import { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Loader2,
  PencilLine,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  DashboardTab,
  KeyTerm,
  QuizResultSummary,
  RevisionPack,
} from '../types/study';
import { exportRevisionPackToPdf } from '../utils/pdfExport';
import { PracticeQuizSection } from './PracticeQuizSection';

interface RevisionDashboardProps {
  pack: RevisionPack;
  isRegenerating: boolean;
  onRegenerate: () => void;
  onEditNotes: () => void;
  onQuizSubmitted: (result: QuizResultSummary) => void;
}

const TABS: Array<{ id: DashboardTab; label: string }> = [
  { id: 'all', label: 'All Sections' },
  { id: 'summary', label: 'Quick Summary' },
  { id: 'quiz', label: 'Practice Quiz' },
  { id: 'terms', label: 'Important Terms' },
];

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function RevisionDashboard({
  pack,
  isRegenerating,
  onRegenerate,
  onEditNotes,
  onQuizSubmitted,
}: RevisionDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('all');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedTermIndex, setCopiedTermIndex] = useState<number | null>(null);
  const [exportFeedback, setExportFeedback] = useState(false);

  const formattedDate = new Date(pack.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleCopySummary = async () => {
    const lines = [
      `${pack.topicTitle} — Quick Summary`,
      '',
      ...pack.summary.map((pt, idx) => {
        const base = `${idx + 1}. ${pt.heading}\n   ${pt.explanation}`;
        return pt.highlightedDefinition
          ? `${base}\n   Key Definition: ${pt.highlightedDefinition}`
          : base;
      }),
    ];
    const ok = await copyTextToClipboard(lines.join('\n'));
    if (ok) {
      setCopiedSummary(true);
      window.setTimeout(() => setCopiedSummary(false), 2000);
    }
  };

  const handleCopyTerm = async (termItem: KeyTerm, index: number) => {
    const text = termItem.example
      ? `${termItem.term}: ${termItem.definition}\nExample: ${termItem.example}`
      : `${termItem.term}: ${termItem.definition}`;
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedTermIndex(index);
      window.setTimeout(() => setCopiedTermIndex(null), 2000);
    }
  };

  const handleDownloadPdf = () => {
    exportRevisionPackToPdf(pack);
    setExportFeedback(true);
    window.setTimeout(() => setExportFeedback(false), 2200);
  };

  const showSummary = activeTab === 'all' || activeTab === 'summary';
  const showQuiz = activeTab === 'all' || activeTab === 'quiz';
  const showTerms = activeTab === 'all' || activeTab === 'terms';

  return (
    <motion.section
      id="revision-dashboard"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto mt-10 max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6"
    >
      {/* Revision Pack Header Panel */}
      <div className="glass-panel rounded-2xl p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-balance text-[#0C1126] dark:text-white">
              {pack.topicTitle}
            </h2>
            {/* Clean Unboxed Metadata */}
            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-[13px] text-[#525C7A] dark:text-[#A6AEC8]">
              <span className="font-medium text-[#613EEA] dark:text-[#00D9FF]">
                {pack.subjectArea}
              </span>
              <span aria-hidden="true">·</span>
              <span>{formattedDate}</span>
              <span aria-hidden="true">·</span>
              <span>
                {pack.sourceType === 'pdf' && pack.fileName
                  ? `PDF: ${pack.fileName}${pack.pageCount ? ` (${pack.pageCount}p)` : ''}`
                  : 'Pasted Notes'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {pack.sourceWordCount.toLocaleString()} source words
              </span>
              {pack.lastQuizScore && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                    Last Quiz: {pack.lastQuizScore.correct}/{pack.lastQuizScore.total} (
                    {pack.lastQuizScore.percentage}%)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onEditNotes}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/14 bg-white/80 dark:bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-[#0C1126] dark:text-white hover:border-[#7957FF]/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7957FF]"
            >
              <PencilLine className="h-3.5 w-3.5" />
              <span>Edit Notes</span>
            </button>

            <button
              type="button"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/14 bg-white/80 dark:bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-[#0C1126] dark:text-white hover:border-[#7957FF]/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7957FF]"
            >
              {isRegenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Pack'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="brand-gradient-btn inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]"
            >
              {exportFeedback ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>PDF Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Segmented Dashboard Filter Bar */}
        <div
          role="tablist"
          aria-label="Revision dashboard sections"
          className="mt-6 flex items-center gap-1.5 overflow-x-auto rounded-xl bg-slate-100/90 dark:bg-[#0A0E21]/90 p-1.5 border border-slate-200/80 dark:border-white/10"
        >
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7957FF] ${
                  isSelected
                    ? 'bg-white dark:bg-[#192145] text-[#613EEA] dark:text-white shadow-sm'
                    : 'text-[#525C7A] dark:text-[#A6AEC8] hover:text-[#0C1126] dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: Quick Summary */}
      {showSummary && (
        <div className="glass-panel rounded-2xl p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-200/80 dark:border-white/10">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-[#0C1126] dark:text-white">
                01. Quick Summary
              </h3>
              <p className="mt-1 text-sm text-[#525C7A] dark:text-[#A6AEC8]">
                {pack.summary.length} high-yield exam revision points distilled from your notes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleCopySummary()}
              className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-xl border border-slate-200 dark:border-white/14 bg-white/80 dark:bg-white/5 px-3.5 py-2 text-xs font-semibold text-[#0C1126] dark:text-white hover:border-[#7957FF]/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7957FF]"
            >
              {copiedSummary ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Summary Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
          </div>

          <ol className="mt-6 space-y-5">
            {pack.summary.map((point, idx) => (
              <li
                key={`${pack.id}-sum-${idx}`}
                className="flex gap-4 pb-5 border-b border-slate-200/70 dark:border-white/8 last:border-b-0 last:pb-0"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#7957FF]/14 font-mono text-xs font-semibold tabular-nums text-[#613EEA] dark:text-[#00D9FF]">
                  0{idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-display text-base font-semibold text-[#0C1126] dark:text-white">
                    {point.heading}
                  </h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#334155] dark:text-[#C8CFE4]">
                    {point.explanation}
                  </p>
                  {point.highlightedDefinition && (
                    <div className="mt-3 rounded-xl border border-[#7957FF]/25 bg-[#7957FF]/8 dark:bg-[#7957FF]/12 px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed text-[#3B2696] dark:text-[#DCD4FF]">
                      <span className="font-semibold text-[#613EEA] dark:text-[#00D9FF]">
                        Key Definition:{' '}
                      </span>
                      {point.highlightedDefinition}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* SECTION 2: Practice Quiz */}
      {showQuiz && (
        <PracticeQuizSection
          packId={pack.id}
          questions={pack.quiz}
          onQuizSubmitted={onQuizSubmitted}
        />
      )}

      {/* SECTION 3: Important Terms */}
      {showTerms && (
        <div className="glass-panel rounded-2xl p-5 sm:p-7">
          <div className="pb-5 border-b border-slate-200/80 dark:border-white/10">
            <h3 className="font-display text-lg sm:text-xl font-semibold text-[#0C1126] dark:text-white">
              03. Important Terms
            </h3>
            <p className="mt-1 text-sm text-[#525C7A] dark:text-[#A6AEC8]">
              {pack.keyTerms.length} essential concepts and definitions to remember for your exam.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            {pack.keyTerms.map((termItem, idx) => {
              const isCopied = copiedTermIndex === idx;
              return (
                <article
                  key={`${pack.id}-term-${idx}`}
                  className="glass-subtle flex flex-col justify-between rounded-xl p-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display text-base font-semibold text-[#0C1126] dark:text-white leading-snug">
                        {termItem.term}
                      </h4>
                      <button
                        type="button"
                        onClick={() => void handleCopyTerm(termItem, idx)}
                        aria-label={`Copy term ${termItem.term}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 dark:border-white/12 bg-white/80 dark:bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-[#525C7A] dark:text-[#A6AEC8] hover:text-[#613EEA] dark:hover:text-white hover:border-[#7957FF]/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7957FF]"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-[#334155] dark:text-[#C8CFE4]">
                      {termItem.definition}
                    </p>
                  </div>

                  {termItem.example && (
                    <div className="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-white/10 text-xs leading-relaxed text-[#525C7A] dark:text-[#A6AEC8]">
                      <span className="font-semibold text-[#0088B8] dark:text-[#00D9FF]">
                        Example:{' '}
                      </span>
                      {termItem.example}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </motion.section>
  );
}
