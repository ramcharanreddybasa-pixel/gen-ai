export interface SummaryPoint {
  heading: string;
  explanation: string;
  highlightedDefinition?: string;
}

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface KeyTerm {
  term: string;
  definition: string;
  example?: string;
}

export interface QuizResultSummary {
  correct: number;
  total: number;
  percentage: number;
  completedAt: string;
}

export interface RevisionPack {
  id: string;
  topicTitle: string;
  subjectArea: string;
  createdAt: string;
  sourceType: 'text' | 'pdf';
  fileName?: string;
  pageCount?: number;
  sourceWordCount: number;
  sourceNotes: string;
  summary: SummaryPoint[];
  quiz: QuizQuestion[];
  keyTerms: KeyTerm[];
  lastQuizScore?: QuizResultSummary;
}

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  fileName: string;
  wordCount: number;
  charCount: number;
  usedOcr?: boolean;
}

export interface GenerateRevisionResponse {
  hasEnoughInformation: boolean;
  insufficientInfoMessage?: string;
  data?: {
    topicTitle: string;
    subjectArea: string;
    summary: SummaryPoint[];
    quiz: QuizQuestion[];
    keyTerms: KeyTerm[];
  };
  error?: string;
}

export type ActivePage = 'home' | 'notes' | 'history' | 'about';
export type DashboardTab = 'all' | 'summary' | 'quiz' | 'terms';
