import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { QuizQuestion, QuizResultSummary } from '../types/study';

interface PracticeQuizSectionProps {
  packId: string;
  questions: QuizQuestion[];
  onQuizSubmitted: (result: QuizResultSummary) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export function PracticeQuizSection({
  packId,
  questions,
  onQuizSubmitted,
}: PracticeQuizSectionProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [incompleteWarning, setIncompleteWarning] = useState<string | null>(null);

  // Reset quiz state whenever switching to a different revision pack
  useEffect(() => {
    setSelectedAnswers({});
    setSubmitted(false);
    setIncompleteWarning(null);
  }, [packId, questions]);

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalCount = questions.length;

  const correctCount = questions.reduce((acc, q, idx) => {
    return acc + (selectedAnswers[idx] === q.correctIndex ? 1 : 0);
  }, 0);

  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (submitted) return;
    setIncompleteWarning(null);
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    const unanswered: number[] = [];
    for (let i = 0; i < totalCount; i++) {
      if (selectedAnswers[i] === undefined) {
        unanswered.push(i + 1);
      }
    }
    if (unanswered.length > 0) {
      setIncompleteWarning(
        `Please answer all questions before submitting (remaining: Q${unanswered.join(', Q')}).`
      );
      return;
    }

    setIncompleteWarning(null);
    setSubmitted(true);

    onQuizSubmitted({
      correct: correctCount,
      total: totalCount,
      percentage,
      completedAt: new Date().toISOString(),
    });
  };

  const handleRetakeQuiz = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setIncompleteWarning(null);
  };

  const getPerformanceLabel = (pct: number) => {
    if (pct >= 80) return { label: 'Exam Ready', tone: 'text-emerald-600 dark:text-emerald-400' };
    if (pct >= 60) return { label: 'Good Grasp', tone: 'text-[#613EEA] dark:text-[#00D9FF]' };
    return { label: 'Review Summary Again', tone: 'text-amber-600 dark:text-amber-400' };
  };

  const perf = getPerformanceLabel(percentage);

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-7">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <h3 className="font-display text-lg sm:text-xl font-semibold text-[#0C1126] dark:text-white">
            02. Practice Quiz
          </h3>
          <p className="mt-1 text-sm text-[#525C7A] dark:text-[#A6AEC8]">
            Test your retention with {totalCount} multiple-choice questions grounded directly in your notes.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <span className="font-mono text-xs tabular-nums text-[#525C7A] dark:text-[#A6AEC8] whitespace-nowrap">
            {answeredCount} of {totalCount} answered
          </span>
          {submitted && (
            <button
              type="button"
              onClick={handleRetakeQuiz}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#7957FF]/40 bg-[#7957FF]/10 px-3.5 py-2 text-xs font-semibold text-[#613EEA] dark:text-white hover:bg-[#7957FF]/20 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7957FF]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retake Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* Score Banner After Submission */}
      {submitted && (
        <div className="mt-5 rounded-xl border border-[#7957FF]/35 bg-gradient-to-r from-[#7957FF]/12 via-[#B36BFF]/8 to-[#00D9FF]/12 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#7957FF]/20 text-[#613EEA] dark:text-[#00D9FF]">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#525C7A] dark:text-[#A6AEC8]">
                  Final Quiz Score
                </p>
                <div className="mt-0.5 flex items-baseline gap-3">
                  <span className="font-display text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0C1126] dark:text-white">
                    {correctCount} / {totalCount}
                  </span>
                  <span className="font-mono text-lg font-semibold tabular-nums text-[#613EEA] dark:text-[#00D9FF]">
                    {percentage}%
                  </span>
                  <span className={`text-xs font-semibold ${perf.tone}`}>
                    · {perf.label}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRetakeQuiz}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-white/15 bg-white/85 dark:bg-white/8 px-4 py-2.5 text-xs font-semibold text-[#0C1126] dark:text-white hover:border-[#7957FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retake Quiz</span>
            </button>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7957FF] via-[#B36BFF] to-[#00D9FF] transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Question List */}
      <div className="mt-6 space-y-7">
        {questions.map((q, qIdx) => {
          const userChoice = selectedAnswers[qIdx];
          const isQuestionCorrect = submitted && userChoice === q.correctIndex;

          return (
            <div
              key={`${packId}-q-${qIdx}`}
              className="pb-7 border-b border-slate-200/75 dark:border-white/8 last:border-b-0 last:pb-0"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[15px] font-semibold leading-snug text-[#0C1126] dark:text-white">
                  <span className="mr-2 font-mono text-sm text-[#613EEA] dark:text-[#00D9FF]">
                    Q{qIdx + 1}.
                  </span>
                  {q.question}
                </p>

                {submitted && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap shrink-0 ${
                      isQuestionCorrect
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isQuestionCorrect ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Correct</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        <span>Incorrect</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* 4 Options Grid */}
              <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {q.options.map((optionText, optIdx) => {
                  const isSelected = userChoice === optIdx;
                  const isCorrectOpt = optIdx === q.correctIndex;

                  let optionStyle =
                    'border-slate-200/90 dark:border-white/12 bg-white/80 dark:bg-white/[0.03] text-[#0C1126] dark:text-slate-100 hover:border-[#7957FF]/55 hover:bg-[#7957FF]/6';

                  if (!submitted && isSelected) {
                    optionStyle =
                      'border-[#7957FF] bg-[#7957FF]/12 dark:bg-[#7957FF]/22 text-[#0C1126] dark:text-white ring-1 ring-[#7957FF]/50';
                  } else if (submitted) {
                    if (isCorrectOpt) {
                      optionStyle =
                        'border-emerald-500/60 bg-emerald-500/12 text-emerald-950 dark:text-emerald-100';
                    } else if (isSelected && !isCorrectOpt) {
                      optionStyle =
                        'border-rose-500/60 bg-rose-500/12 text-rose-950 dark:text-rose-100';
                    } else {
                      optionStyle =
                        'border-slate-200/60 dark:border-white/8 bg-slate-50/50 dark:bg-white/[0.015] text-[#525C7A] dark:text-[#A6AEC8]/75';
                    }
                  }

                  return (
                    <button
                      key={`${packId}-q-${qIdx}-opt-${optIdx}`}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`flex min-h-[46px] w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-all cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7957FF] ${optionStyle}`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold ${
                          submitted && isCorrectOpt
                            ? 'bg-emerald-500 text-white'
                            : submitted && isSelected && !isCorrectOpt
                            ? 'bg-rose-500 text-white'
                            : !submitted && isSelected
                            ? 'bg-[#7957FF] text-white'
                            : 'bg-slate-200/80 dark:bg-white/10 text-[#0C1126] dark:text-[#A6AEC8]'
                        }`}
                      >
                        {OPTION_LETTERS[optIdx]}
                      </span>
                      <span className="flex-1 leading-snug">{optionText}</span>
                      {submitted && isCorrectOpt && (
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400"
                          aria-label="Correct answer"
                        />
                      )}
                      {submitted && isSelected && !isCorrectOpt && (
                        <XCircle
                          className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400"
                          aria-label="Your incorrect selection"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation revealed after submission */}
              {submitted && (
                <div className="mt-3 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50/90 dark:bg-[#0B1026]/80 px-4 py-3 text-xs sm:text-[13px] leading-relaxed text-[#334155] dark:text-[#C4CBE0]">
                  <span className="font-semibold text-[#613EEA] dark:text-[#00D9FF]">
                    Answer ({OPTION_LETTERS[q.correctIndex]}):{' '}
                  </span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Incomplete Quiz Warning */}
      {incompleteWarning && (
        <div
          role="alert"
          className="mt-5 flex items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs sm:text-sm text-amber-800 dark:text-amber-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>{incompleteWarning}</span>
        </div>
      )}

      {/* Submit Quiz Footer */}
      {!submitted && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-5 border-t border-slate-200/80 dark:border-white/10">
          <p className="text-xs text-[#525C7A] dark:text-[#A6AEC8]">
            Select one option for all {totalCount} questions to calculate your score and reveal explanations.
          </p>
          <button
            type="button"
            onClick={handleSubmitQuiz}
            className="brand-gradient-btn inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.99] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]"
          >
            Submit Quiz
          </button>
        </div>
      )}
    </div>
  );
}
