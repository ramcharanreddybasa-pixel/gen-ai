import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import http from 'http';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { extractText, getDocumentProxy } from 'unpdf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_NOTES_CHARS = 120_000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PDF_BYTES,
  },
});

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'Gemini API key is not configured. Please add your GEMINI_API_KEY in the Settings > Secrets panel.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const PRIMARY_MODEL = 'gemini-4-hydrogen';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

function isTransientOverloadError(err: unknown): boolean {
  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: number }).status)
      : undefined;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    status === 429 ||
    (status !== undefined && status >= 500) ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('503') ||
    msg.includes('DEADLINE_EXCEEDED')
  );
}

async function withModelFallback<T>(
  runForModel: (model: string) => Promise<T>
): Promise<T> {
  // Try primary model first (1 retry on transient error)
  let primaryError: unknown;
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      return await runForModel(PRIMARY_MODEL);
    } catch (err: unknown) {
      primaryError = err;
      if (!isTransientOverloadError(err)) {
        throw err;
      }
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }
  }

  // Fallback to secondary active Gemini model on transient 503/overload
  console.warn(
    `Primary model (${PRIMARY_MODEL}) unavailable, retrying with ${FALLBACK_MODEL}.`
  );
  let fallbackError: unknown;
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      return await runForModel(FALLBACK_MODEL);
    } catch (err: unknown) {
      fallbackError = err;
      if (!isTransientOverloadError(err) || attempt === 1) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }
  throw fallbackError ?? primaryError;
}

function formatApiError(err: unknown): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: number }).status)
      : 500;

  if (
    status === 403 ||
    rawMessage.includes('PERMISSION_DENIED') ||
    rawMessage.includes('API_KEY_INVALID')
  ) {
    return {
      status: 403,
      message:
        'Unable to authenticate with the AI service. Please verify your Gemini API key in the Settings > Secrets panel.',
    };
  }
  if (status === 429 || rawMessage.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message:
        'The AI service is currently rate-limited. Please wait a few seconds and try again.',
    };
  }
  if (status === 503 || rawMessage.includes('UNAVAILABLE')) {
    return {
      status: 503,
      message:
        'The AI service is temporarily experiencing high demand. Please wait a moment and click Generate Revision Pack again.',
    };
  }
  if (rawMessage.includes('GEMINI_API_KEY')) {
    return {
      status: 500,
      message: rawMessage,
    };
  }
  return {
    status: status >= 400 && status < 600 ? status : 500,
    message: 'Failed to process your request with the AI service. Please try again in a moment.',
  };
}

function cleanExtractedText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

const revisionResponseSchema = {
  type: Type.OBJECT,
  properties: {
    hasEnoughInformation: {
      type: Type.BOOLEAN,
      description:
        'True ONLY if the supplied notes contain enough factual academic or informational content to produce 5-6 grounded summary points, 5 distinct MCQs, and 3 key terms without inventing external facts. False if the input is too short, gibberish, or lacks substance.',
    },
    insufficientInfoMessage: {
      type: Type.STRING,
      description:
        'If hasEnoughInformation is false, provide a clear, polite message explaining why the notes are insufficient and what the student should add. Empty string if hasEnoughInformation is true.',
    },
    topicTitle: {
      type: Type.STRING,
      description:
        'A concise, clear academic topic title (3-8 words) directly reflecting the supplied notes.',
    },
    subjectArea: {
      type: Type.STRING,
      description:
        'A short 1-3 word subject category derived strictly from the notes (e.g., Operating Systems, Organic Chemistry, Microeconomics).',
    },
    summary: {
      type: Type.ARRAY,
      description:
        'Between 5 and 6 concise, exam-oriented revision bullet points strictly grounded in the provided notes.',
      items: {
        type: Type.OBJECT,
        properties: {
          heading: {
            type: Type.STRING,
            description: 'Short, clear concept title for this revision point (3-7 words).',
          },
          explanation: {
            type: Type.STRING,
            description:
              'Simple, clear, exam-focused explanation of the concept using only facts from the notes (1-3 sentences).',
          },
          highlightedDefinition: {
            type: Type.STRING,
            description:
              'Optional crucial definition, law, rule, or formula directly stated in the notes. Empty string if no explicit definition applies to this point.',
          },
        },
        required: ['heading', 'explanation', 'highlightedDefinition'],
      },
    },
    quiz: {
      type: Type.ARRAY,
      description:
        'Exactly 5 distinct multiple-choice questions strictly testing facts and concepts present in the provided notes.',
      items: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: 'Clear exam-style question directly answerable from the notes.',
          },
          options: {
            type: Type.ARRAY,
            description:
              'Exactly 4 plausible answer choices (do NOT prefix with A., B., C., D. — provide the option text directly).',
            items: {
              type: Type.STRING,
            },
          },
          correctIndex: {
            type: Type.INTEGER,
            description: 'Zero-based index (0, 1, 2, or 3) of the single correct option.',
          },
          explanation: {
            type: Type.STRING,
            description:
              'Simple, direct explanation of why the correct answer is right based strictly on the supplied notes.',
          },
        },
        required: ['question', 'options', 'correctIndex', 'explanation'],
      },
    },
    keyTerms: {
      type: Type.ARRAY,
      description:
        'Exactly 3 of the most important technical or academic terms found in the provided notes.',
      items: {
        type: Type.OBJECT,
        properties: {
          term: {
            type: Type.STRING,
            description: 'The exact key term or concept name from the notes.',
          },
          definition: {
            type: Type.STRING,
            description: 'A simple, clear, student-friendly definition grounded in the notes.',
          },
          example: {
            type: Type.STRING,
            description:
              'An easy, intuitive example illustrating the term when relevant (grounded in the notes or a direct everyday illustration of the definition). Empty string if not applicable.',
          },
        },
        required: ['term', 'definition', 'example'],
      },
    },
  },
  required: [
    'hasEnoughInformation',
    'insufficientInfoMessage',
    'topicTitle',
    'subjectArea',
    'summary',
    'quiz',
    'keyTerms',
  ],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '6mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/extract-pdf', (req: Request, res: Response) => {
    upload.single('file')(req, res, async (uploadErr: unknown) => {
      if (uploadErr) {
        if (
          typeof uploadErr === 'object' &&
          uploadErr !== null &&
          'code' in uploadErr &&
          (uploadErr as { code?: string }).code === 'LIMIT_FILE_SIZE'
        ) {
          res.status(413).json({
            error: 'PDF file exceeds the 15 MB limit. Please upload a smaller document.',
          });
          return;
        }
        res.status(400).json({ error: 'Unable to read uploaded file. Please try again.' });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No PDF file was uploaded.' });
        return;
      }

      const isPdfMime = file.mimetype === 'application/pdf';
      const isPdfExt = file.originalname.toLowerCase().endsWith('.pdf');
      const headerSignature = file.buffer.subarray(0, 5).toString('utf8');
      const hasPdfMagic = headerSignature === '%PDF-';

      if ((!isPdfMime && !isPdfExt) || !hasPdfMagic) {
        res.status(400).json({
          error:
            'Invalid file format. Please upload a valid PDF document (.pdf) rather than another file type.',
        });
        return;
      }

      try {
        let pageCount = 1;
        let extractedText = '';
        let usedOcr = false;

        try {
          const pdfDoc = await getDocumentProxy(new Uint8Array(file.buffer));
          pageCount = pdfDoc.numPages || 1;
          const result = await extractText(pdfDoc, { mergePages: true });
          const rawText = Array.isArray(result.text)
            ? result.text.join('\n\n')
            : String(result.text ?? '');
          extractedText = cleanExtractedText(rawText);
        } catch (parseErr: unknown) {
          const parseMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
          if (parseMsg.toLowerCase().includes('password')) {
            res.status(422).json({
              error:
                'This PDF is password-protected. Please unlock it first or paste your study notes directly.',
            });
            return;
          }
          // Fall through to OCR check if binary is valid PDF but unpdf had trouble
        }

        // If text extraction returned too little text (likely a scanned PDF), try Gemini multimodal text extraction
        if (extractedText.length < 40 && file.buffer.length <= 8 * 1024 * 1024) {
          try {
            const ai = getGeminiClient();
            const ocrResponse = await withModelFallback((model) =>
              ai.models.generateContent({
                model,
                contents: {
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'application/pdf',
                        data: file.buffer.toString('base64'),
                      },
                    },
                    {
                      text: 'Extract and transcribe all readable study text from this PDF document cleanly across all pages. Preserve headings, definitions, and bullet points. Do not add commentary or invent missing text. If the document has no readable text, return an empty string.',
                    },
                  ],
                },
                config: {
                  thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
                },
              })
            );
            const ocrText = cleanExtractedText(ocrResponse.text ?? '');
            if (ocrText.length >= 30) {
              extractedText = ocrText;
              usedOcr = true;
            }
          } catch {
            // Keep original failure message below
          }
        }

        if (extractedText.length < 25) {
          res.status(422).json({
            error:
              'We could not extract readable text from this PDF. It may be blank, corrupted, or contain unreadable scans. Please try another PDF or paste your notes directly.',
          });
          return;
        }

        res.json({
          text: extractedText,
          pageCount,
          fileName: file.originalname,
          wordCount: countWords(extractedText),
          charCount: extractedText.length,
          usedOcr,
        });
      } catch (err: unknown) {
        console.error('PDF extraction error:', err);
        res.status(422).json({
          error:
            'This PDF could not be processed. Please check that the file is not corrupted or encrypted.',
        });
      }
    });
  });

  app.post('/api/generate-revision', async (req: Request, res: Response) => {
    try {
      const { notes, sourceTitle } = req.body as {
        notes?: unknown;
        sourceTitle?: unknown;
      };

      if (typeof notes !== 'string' || !notes.trim()) {
        res.status(400).json({
          error: 'Please paste your study notes or upload a PDF document before generating.',
        });
        return;
      }

      const trimmedNotes = notes.trim();
      const words = countWords(trimmedNotes);

      if (trimmedNotes.length < 40 || words < 8) {
        res.status(200).json({
          hasEnoughInformation: false,
          insufficientInfoMessage:
            'Your notes are too brief to build a reliable exam summary, 5 quiz questions, and 3 key terms without inventing facts. Please provide at least a paragraph or chapter excerpt of study material.',
        });
        return;
      }

      const preparedNotes =
        trimmedNotes.length > MAX_NOTES_CHARS
          ? trimmedNotes.slice(0, MAX_NOTES_CHARS)
          : trimmedNotes;

      const ai = getGeminiClient();

      const customTitleHint =
        typeof sourceTitle === 'string' && sourceTitle.trim()
          ? `Student's suggested topic title: "${sourceTitle.trim()}"\n\n`
          : '';

      const systemInstruction = `You are AI Study Buddy, an expert academic revision assistant helping students prepare for semester exams, competitive exams, and placement tests.

STRICT GROUNDING RULES (MANDATORY):
1. Base EVERY summary point, definition, quiz question, answer choice, explanation, and key term strictly on the student's supplied study notes.
2. NEVER invent facts, statistics, dates, or concepts that are not present in the supplied notes.
3. If the supplied notes are gibberish, repetitive filler, off-topic chat, or too sparse to create 5-6 grounded summary points, 5 distinct MCQs, and 3 key terms WITHOUT fabricating facts, you MUST set "hasEnoughInformation" to false and provide a clear, helpful "insufficientInfoMessage" explaining what is missing. In that case, return empty arrays for summary, quiz, and keyTerms.
4. When "hasEnoughInformation" is true:
   - "summary": Produce 5 to 6 crisp, exam-oriented revision points. Each needs a clear "heading", a simple student-friendly "explanation", and a "highlightedDefinition" when a core definition, law, rule, or formula appears in the notes (otherwise empty string "").
   - "quiz": Produce EXACTLY 5 distinct multiple-choice questions testing understanding and recall of the notes. Each question MUST have EXACTLY 4 options (without "A.", "B.", "C.", "D." prefixes), one unambiguously correct answer ("correctIndex" from 0 to 3), and a clear "explanation". Vary "correctIndex" naturally across 0, 1, 2, and 3.
   - "keyTerms": Extract EXACTLY 3 of the most important concepts or vocabulary terms from the notes, each with a simple "definition" and an easy real-world "example" when relevant (or empty string "" if none fits).`;

      const response = await withModelFallback((model) =>
        ai.models.generateContent({
          model,
          contents: `${customTitleHint}Analyze the following study notes and generate the structured Smart Revision Pack:\n\n--- STUDY NOTES START ---\n${preparedNotes}\n--- STUDY NOTES END ---`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: revisionResponseSchema,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        })
      );

      const rawJson = (response.text ?? '').trim();
      if (!rawJson) {
        res.status(502).json({
          error: 'The AI returned an empty response. Please try generating again.',
        });
        return;
      }

      const parsed = JSON.parse(rawJson) as {
        hasEnoughInformation: boolean;
        insufficientInfoMessage?: string;
        topicTitle?: string;
        subjectArea?: string;
        summary?: Array<{
          heading?: string;
          explanation?: string;
          highlightedDefinition?: string;
        }>;
        quiz?: Array<{
          question?: string;
          options?: string[];
          correctIndex?: number;
          explanation?: string;
        }>;
        keyTerms?: Array<{
          term?: string;
          definition?: string;
          example?: string;
        }>;
      };

      if (!parsed.hasEnoughInformation) {
        res.status(200).json({
          hasEnoughInformation: false,
          insufficientInfoMessage:
            parsed.insufficientInfoMessage?.trim() ||
            'The supplied notes do not contain enough factual study content to generate a complete revision pack without inventing information. Please add more detailed notes or upload a fuller chapter.',
        });
        return;
      }

      // Normalize and validate structure strictly
      const cleanSummary = (parsed.summary ?? [])
        .filter((s) => s?.heading && s?.explanation)
        .slice(0, 6)
        .map((s) => ({
          heading: String(s.heading).trim(),
          explanation: String(s.explanation).trim(),
          highlightedDefinition: s.highlightedDefinition?.trim() || undefined,
        }));

      const cleanQuiz = (parsed.quiz ?? [])
        .filter((q) => q?.question && Array.isArray(q.options) && q.options.length >= 4)
        .slice(0, 5)
        .map((q) => {
          const opts = q.options!.slice(0, 4).map((o) =>
            String(o)
              .replace(/^[A-Da-d][).:\-]\s*/, '')
              .trim()
          ) as [string, string, string, string];
          const idx =
            typeof q.correctIndex === 'number' &&
            Number.isInteger(q.correctIndex) &&
            q.correctIndex >= 0 &&
            q.correctIndex <= 3
              ? q.correctIndex
              : 0;
          return {
            question: String(q.question).trim(),
            options: opts,
            correctIndex: idx,
            explanation: String(q.explanation ?? '').trim(),
          };
        });

      const cleanKeyTerms = (parsed.keyTerms ?? [])
        .filter((k) => k?.term && k?.definition)
        .slice(0, 3)
        .map((k) => ({
          term: String(k.term).trim(),
          definition: String(k.definition).trim(),
          example: k.example?.trim() || undefined,
        }));

      if (cleanSummary.length < 3 || cleanQuiz.length < 5 || cleanKeyTerms.length < 3) {
        res.status(200).json({
          hasEnoughInformation: false,
          insufficientInfoMessage:
            'Your notes did not contain enough distinct concepts to produce a complete 5-question quiz and 3 key terms strictly from the source text. Try pasting a longer section of your notes.',
        });
        return;
      }

      const finalTitle =
        typeof sourceTitle === 'string' && sourceTitle.trim()
          ? sourceTitle.trim()
          : parsed.topicTitle?.trim() || 'Study Revision Pack';

      res.json({
        hasEnoughInformation: true,
        data: {
          topicTitle: finalTitle,
          subjectArea: parsed.subjectArea?.trim() || 'General Studies',
          summary: cleanSummary,
          quiz: cleanQuiz,
          keyTerms: cleanKeyTerms,
        },
      });
    } catch (err: unknown) {
      console.error('Revision generation error:', err);
      const { status, message } = formatApiError(err);
      res.status(status).json({ error: message });
    }
  });

  const httpServer = http.createServer(app);

  if (IS_PROD) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*path}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Study Buddy server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
