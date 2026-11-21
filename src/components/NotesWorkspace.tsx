import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FileUp,
  Info,
  Loader2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { PdfExtractionResult } from '../types/study';

interface NotesWorkspaceProps {
  notes: string;
  onNotesChange: (value: string) => void;
  topicTitleInput: string;
  onTopicTitleInputChange: (value: string) => void;
  uploadedPdf: PdfExtractionResult | null;
  onPdfExtracted: (result: PdfExtractionResult | null) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onClearNotes: () => void;
  errorMessage: string | null;
  insufficientInfoMessage: string | null;
  onDismissAlerts: () => void;
  compactHeader?: boolean;
}

const PROCESSING_STAGES = [
  'Reading and indexing your study notes',
  'Distilling 5–6 high-yield exam summary points',
  'Crafting 5 grounded multiple-choice questions',
  'Extracting 3 core key terms and definitions',
];

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function NotesWorkspace({
  notes,
  onNotesChange,
  topicTitleInput,
  onTopicTitleInputChange,
  uploadedPdf,
  onPdfExtracted,
  isGenerating,
  onGenerate,
  onClearNotes,
  errorMessage,
  insufficientInfoMessage,
  onDismissAlerts,
  compactHeader = false,
}: NotesWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);

  const wordCount = countWords(notes);
  const charCount = notes.length;
  const estReadMinutes = Math.max(1, Math.ceil(wordCount / 220));

  useEffect(() => {
    if (!isGenerating) {
      setStageIndex(0);
      return;
    }
    const timer = window.setInterval(() => {
      setStageIndex((prev) => (prev < PROCESSING_STAGES.length - 1 ? prev + 1 : prev));
    }, 1700);
    return () => window.clearInterval(timer);
  }, [isGenerating]);

  const processPdfFile = async (file: File) => {
    setPdfError(null);
    onDismissAlerts();

    const lowerName = file.name.toLowerCase();
    if (file.type !== 'application/pdf' && !lowerName.endsWith('.pdf')) {
      setPdfError('Invalid file type. Please upload a PDF document (.pdf).');
      return;
    }

    if (file.size === 0) {
      setPdfError('The selected PDF file is empty. Please choose a valid document.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setPdfError('File size exceeds 15 MB. Please upload a smaller PDF document.');
      return;
    }

    setIsExtractingPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      const payload = (await res.json().catch(() => ({}))) as Partial<PdfExtractionResult> & {
        error?: string;
      };

      if (!res.ok || !payload.text) {
        setPdfError(
          payload.error || 'Unable to extract text from this PDF. Please verify the file and try again.'
        );
        return;
      }

      const result: PdfExtractionResult = {
        text: payload.text,
        pageCount: payload.pageCount ?? 1,
        fileName: payload.fileName ?? file.name,
        wordCount: payload.wordCount ?? countWords(payload.text),
        charCount: payload.charCount ?? payload.text.length,
        usedOcr: payload.usedOcr,
      };

      onPdfExtracted(result);
      onNotesChange(result.text);

      // Suggest topic title from filename if user hasn't typed one
      if (!topicTitleInput.trim()) {
        const inferredTitle = file.name
          .replace(/\.pdf$/i, '')
          .replace(/[_-]+/g, ' ')
          .trim();
        if (inferredTitle.length >= 3) {
          onTopicTitleInputChange(inferredTitle);
        }
      }
    } catch {
      setPdfError('Network error while uploading the PDF. Please check your connection and retry.');
    } finally {
      setIsExtractingPdf(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processPdfFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processPdfFile(file);
    }
  };

  const handleRemovePdf = () => {
    onPdfExtracted(null);
    setPdfError(null);
  };

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="glass-panel rounded-2xl p-5 sm:p-7">
        {/* Workspace Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#0C1126] dark:text-white">
              {compactHeader ? 'My Study Notes Workspace' : 'Study Material Input'}
            </h2>
            <p className="mt-1 text-sm text-[#525C7A] dark:text-[#A6AEC8]">
              Paste lecture notes, textbook chapters, or upload a multi-page PDF to build your revision pack.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            {wordCount > 0 && (
              <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-[#525C7A] dark:text-[#A6AEC8] whitespace-nowrap">
                <span>{wordCount.toLocaleString()} words</span>
                <span aria-hidden="true">·</span>
                <span>~{estReadMinutes} min read</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setPdfError(null);
                onClearNotes();
              }}
              disabled={isGenerating || isExtractingPdf || (!notes && !uploadedPdf && !topicTitleInput)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/12 bg-slate-100/80 dark:bg-white/5 px-3.5 py-2 text-xs font-medium text-[#525C7A] dark:text-[#A6AEC8] hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-400/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7957FF]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Notes</span>
            </button>
          </div>
        </div>

        {/* Optional Topic Title */}
        <div className="mt-5">
          <label
            htmlFor="topic-title-input"
            className="block text-xs font-medium text-[#525C7A] dark:text-[#A6AEC8] mb-1.5"
          >
            Topic or Chapter Title (optional — AI detects automatically if left blank)
          </label>
          <input
            id="topic-title-input"
            type="text"
            value={topicTitleInput}
            onChange={(e) => onTopicTitleInputChange(e.target.value)}
            placeholder="e.g., Operating Systems — Deadlocks & Memory Management"
            disabled={isGenerating}
            className="w-full rounded-xl border border-slate-200 dark:border-white/12 bg-white/90 dark:bg-[#0A0E21]/90 px-4 py-2.5 text-sm text-[#0C1126] dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#A6AEC8]/55 focus:border-[#7957FF] focus:outline-none focus:ring-2 focus:ring-[#7957FF]/30 transition-colors"
          />
        </div>

        {/* Main 2-Column Input Grid: Text Editor + PDF Upload */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
          {/* Text Editor */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="study-notes-editor"
                className="text-xs font-medium text-[#525C7A] dark:text-[#A6AEC8]"
              >
                Study Notes Editor
              </label>
              <span className="font-mono text-[11px] tabular-nums text-[#525C7A] dark:text-[#A6AEC8]/80">
                {charCount.toLocaleString()} characters
              </span>
            </div>
            <textarea
              id="study-notes-editor"
              value={notes}
              onChange={(e) => {
                onNotesChange(e.target.value);
                if (errorMessage || insufficientInfoMessage) {
                  onDismissAlerts();
                }
              }}
              disabled={isGenerating}
              rows={11}
              placeholder="Paste your chapter notes, lecture transcript, or study paragraphs here. Longer notes with definitions, processes, and concepts yield stronger revision packs..."
              className="min-h-[260px] flex-1 w-full resize-y rounded-xl border border-slate-200 dark:border-white/12 bg-white/90 dark:bg-[#0A0E21]/90 p-4 text-sm leading-relaxed text-[#0C1126] dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#A6AEC8]/55 focus:border-[#7957FF] focus:outline-none focus:ring-2 focus:ring-[#7957FF]/30 transition-colors"
            />
          </div>

          {/* PDF Upload Column */}
          <div className="lg:col-span-4 flex flex-col">
            <span className="text-xs font-medium text-[#525C7A] dark:text-[#A6AEC8] mb-1.5">
              PDF Document Upload
            </span>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-1 flex-col justify-between rounded-xl border-2 border-dashed p-5 transition-colors ${
                isDragging
                  ? 'border-[#00D9FF] bg-[#00D9FF]/8 dark:bg-[#00D9FF]/10'
                  : 'border-slate-300/90 dark:border-white/15 bg-slate-50/75 dark:bg-[#0A0E21]/65 hover:border-[#7957FF]/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileInputChange}
                className="hidden"
                aria-label="Upload PDF study notes"
              />

              {isExtractingPdf ? (
                <div className="my-auto flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7957FF]/15 text-[#7957FF] dark:text-[#00D9FF]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#0C1126] dark:text-white">
                    Extracting PDF text...
                  </p>
                  <p className="mt-1 text-xs text-[#525C7A] dark:text-[#A6AEC8]">
                    Reading all pages and formatting content
                  </p>
                </div>
              ) : uploadedPdf ? (
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePdf}
                        aria-label="Detach uploaded PDF info"
                        className="rounded-lg p-1.5 text-[#525C7A] dark:text-[#A6AEC8] hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <p
                      className="mt-3 text-sm font-semibold text-[#0C1126] dark:text-white break-words"
                      title={uploadedPdf.fileName}
                    >
                      {uploadedPdf.fileName}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Extracted successfully{uploadedPdf.usedOcr ? ' via OCR' : ''}
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-mono tabular-nums text-[#525C7A] dark:text-[#A6AEC8]">
                      {uploadedPdf.pageCount} {uploadedPdf.pageCount === 1 ? 'page' : 'pages'} ·{' '}
                      {uploadedPdf.wordCount.toLocaleString()} words
                    </p>

                    <p className="mt-3 text-xs leading-relaxed text-[#525C7A] dark:text-[#A6AEC8]">
                      The extracted text is loaded in the editor. You can review, trim, or append extra notes before generating.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                    className="mt-4 w-full rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-[#0C1126] dark:text-white hover:border-[#7957FF]/60 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Replace PDF Document
                  </button>
                </div>
              ) : (
                <div className="my-auto flex flex-col items-center justify-center py-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7957FF]/12 text-[#613EEA] dark:text-[#00D9FF]">
                    <FileUp className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#0C1126] dark:text-white">
                    Upload PDF Study Notes
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#525C7A] dark:text-[#A6AEC8]">
                    Drag and drop a multi-page PDF here, or browse from your device.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                    className="mt-4 inline-flex items-center justify-center rounded-xl border border-[#7957FF]/40 bg-[#7957FF]/10 px-4 py-2.5 text-xs font-semibold text-[#613EEA] dark:text-white hover:bg-[#7957FF]/20 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7957FF] disabled:opacity-50"
                  >
                    Choose PDF File
                  </button>
                  <span className="mt-3 text-[11px] text-[#525C7A] dark:text-[#A6AEC8]/80">
                    Supports multi-page PDFs up to 15 MB
                  </span>
                </div>
              )}
            </div>

            {pdfError && (
              <div
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{pdfError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Validation / Insufficient Information / Error Banners */}
        {insufficientInfoMessage && (
          <div
            role="status"
            className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-amber-500/35 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200"
          >
            <div className="flex items-start gap-2.5">
              <Info className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold">More study material needed</p>
                <p className="mt-0.5 text-xs sm:text-sm leading-relaxed opacity-90">
                  {insufficientInfoMessage}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismissAlerts}
              aria-label="Dismiss notice"
              className="rounded-lg p-1 hover:bg-amber-500/15 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-rose-500/35 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div>
                <p className="font-semibold">Could not generate revision pack</p>
                <p className="mt-0.5 text-xs sm:text-sm leading-relaxed opacity-90">
                  {errorMessage}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismissAlerts}
              aria-label="Dismiss error"
              className="rounded-lg p-1 hover:bg-rose-500/15 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Primary Action Row */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#525C7A] dark:text-[#A6AEC8]">
            Grounded strictly in your supplied notes — no invented facts or off-topic questions.
          </p>

          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || isExtractingPdf}
            className="brand-gradient-btn inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080B18]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating Revision Pack...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Revision Pack</span>
              </>
            )}
          </button>
        </div>

        {/* Animated Multi-Step Processing State */}
        {isGenerating && (
          <div
            aria-live="polite"
            className="mt-6 rounded-xl border border-[#7957FF]/30 bg-[#7957FF]/8 dark:bg-[#0D132B]/90 p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7957FF]/20 text-[#7957FF] dark:text-[#00D9FF]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0C1126] dark:text-white">
                    AI Study Buddy is building your revision pack
                  </p>
                  <p className="text-xs text-[#525C7A] dark:text-[#A6AEC8]">
                    {PROCESSING_STAGES[stageIndex]}...
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs tabular-nums text-[#613EEA] dark:text-[#00D9FF] whitespace-nowrap">
                Step {stageIndex + 1} / {PROCESSING_STAGES.length}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
              {PROCESSING_STAGES.map((label, idx) => {
                const isDone = idx < stageIndex;
                const isCurrent = idx === stageIndex;
                return (
                  <div
                    key={label}
                    className={`rounded-lg px-3 py-2 text-xs transition-colors border ${
                      isDone
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : isCurrent
                        ? 'border-[#7957FF]/45 bg-[#7957FF]/12 text-[#613EEA] dark:text-white font-medium'
                        : 'border-slate-200/70 dark:border-white/8 text-[#525C7A]/70 dark:text-[#A6AEC8]/60'
                    }`}
                  >
                    <span className="font-mono mr-1.5">{idx + 1}.</span>
                    <span>{label.split(' ').slice(0, 3).join(' ')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
