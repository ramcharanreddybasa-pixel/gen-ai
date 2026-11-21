import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Download,
  Search,
  Trash2,
} from 'lucide-react';
import { RevisionPack } from '../types/study';
import { exportRevisionPackToPdf } from '../utils/pdfExport';

interface RevisionHistoryViewProps {
  history: RevisionPack[];
  activePackId: string | null;
  onOpenPack: (pack: RevisionPack) => void;
  onDeletePack: (packId: string) => void;
  onCreateNew: () => void;
}

export function RevisionHistoryView({
  history,
  activePackId,
  onOpenPack,
  onDeletePack,
  onCreateNew,
}: RevisionHistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return history;
    return history.filter(
      (pack) =>
        pack.topicTitle.toLowerCase().includes(q) ||
        pack.subjectArea.toLowerCase().includes(q) ||
        (pack.fileName && pack.fileName.toLowerCase().includes(q))
    );
  }, [history, searchQuery]);

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-10 pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0C1126] dark:text-white">
            Revision History
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#525C7A] dark:text-[#A6AEC8]">
            Revisit saved revision packs, retake practice quizzes, or export PDFs anytime.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="brand-gradient-btn inline-flex items-center justify-center gap-2 self-start sm:self-auto rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]"
        >
          <span>Create New Pack</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Empty State */}
      {history.length === 0 ? (
        <div className="glass-panel mt-8 rounded-2xl p-10 sm:p-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7957FF]/14 text-[#613EEA] dark:text-[#00D9FF]">
            <BookOpen className="h-7 w-7" />
          </div>
          <h2 className="font-display mt-5 text-xl font-semibold text-[#0C1126] dark:text-white">
            No saved revision packs yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#525C7A] dark:text-[#A6AEC8]">
            Every revision pack you generate is saved automatically right here so you can review
            summaries, retake quizzes, and download PDFs before your exams.
          </p>
          <button
            type="button"
            onClick={onCreateNew}
            className="brand-gradient-btn mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all whitespace-nowrap cursor-pointer"
          >
            <span>Generate Your First Pack</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525C7A] dark:text-[#A6AEC8]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic, subject, or PDF filename..."
                className="w-full rounded-xl border border-slate-200 dark:border-white/12 bg-white/90 dark:bg-[#0D132B]/90 py-2.5 pl-10 pr-4 text-sm text-[#0C1126] dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#A6AEC8]/55 focus:border-[#7957FF] focus:outline-none focus:ring-2 focus:ring-[#7957FF]/30"
              />
            </div>

            <span className="font-mono text-xs tabular-nums text-[#525C7A] dark:text-[#A6AEC8]">
              Showing {filteredHistory.length} of {history.length}{' '}
              {history.length === 1 ? 'pack' : 'packs'}
            </span>
          </div>

          {/* Saved Packs List */}
          {filteredHistory.length === 0 ? (
            <div className="glass-panel mt-6 rounded-2xl p-10 text-center">
              <p className="text-sm text-[#525C7A] dark:text-[#A6AEC8]">
                No saved revision packs match &ldquo;{searchQuery}&rdquo;.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredHistory.map((pack) => {
                const isCurrent = pack.id === activePackId;
                const isConfirmingDelete = confirmDeleteId === pack.id;
                const dateLabel = new Date(pack.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <article
                    key={pack.id}
                    className={`glass-panel rounded-2xl p-5 transition-colors ${
                      isCurrent ? 'ring-1 ring-[#7957FF]/55' : ''
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <h2 className="font-display text-lg font-semibold text-[#0C1126] dark:text-white truncate">
                            {pack.topicTitle}
                          </h2>
                          {isCurrent && (
                            <span className="text-xs font-medium text-[#613EEA] dark:text-[#00D9FF] whitespace-nowrap shrink-0">
                              · Currently Open
                            </span>
                          )}
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#525C7A] dark:text-[#A6AEC8]">
                          <span className="font-medium text-[#613EEA] dark:text-[#B36BFF]">
                            {pack.subjectArea}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{dateLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {pack.sourceType === 'pdf' && pack.fileName
                              ? `PDF: ${pack.fileName}`
                              : 'Pasted Notes'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {pack.summary.length} points · {pack.quiz.length} MCQs ·{' '}
                            {pack.keyTerms.length} terms
                          </span>
                          {pack.lastQuizScore && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                                Quiz: {pack.lastQuizScore.percentage}% (
                                {pack.lastQuizScore.correct}/{pack.lastQuizScore.total})
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                              Delete pack?
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeletePack(pack.id);
                                setConfirmDeleteId(null);
                              }}
                              className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-xl border border-slate-200 dark:border-white/15 px-3 py-2 text-xs font-medium text-[#525C7A] dark:text-[#A6AEC8] hover:text-[#0C1126] dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onOpenPack(pack)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-[#7957FF]/12 dark:bg-[#7957FF]/22 border border-[#7957FF]/35 px-4 py-2 text-xs font-semibold text-[#613EEA] dark:text-white hover:bg-[#7957FF]/22 dark:hover:bg-[#7957FF]/35 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7957FF]"
                            >
                              <span>Open Pack</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => exportRevisionPackToPdf(pack)}
                              aria-label={`Download PDF for ${pack.topicTitle}`}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/14 bg-white/80 dark:bg-white/5 px-3.5 py-2 text-xs font-medium text-[#0C1126] dark:text-white hover:border-[#7957FF]/60 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7957FF]"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>PDF</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(pack.id)}
                              aria-label={`Delete ${pack.topicTitle}`}
                              className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/14 bg-white/80 dark:bg-white/5 p-2 text-[#525C7A] dark:text-[#A6AEC8] hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-400/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
