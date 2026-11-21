import { ArrowRight, ShieldCheck } from 'lucide-react';

interface AboutViewProps {
  onStartStudying: () => void;
}

const PIPELINE_STEPS = [
  {
    num: '01',
    title: 'Read & Extract Material',
    body: 'Paste lengthy lecture paragraphs or upload multi-page PDF documents. Our extraction engine parses text cleanly across pages.',
  },
  {
    num: '02',
    title: 'Distill Key Concepts',
    body: 'AI identifies core facts, mechanisms, and exam-critical definitions strictly from your supplied notes without drifting off-topic.',
  },
  {
    num: '03',
    title: 'Generate Smart Summary',
    body: 'Lengthy chapters become 5–6 concise, structured revision points with highlighted key definitions for rapid pre-exam review.',
  },
  {
    num: '04',
    title: 'Build 5-Question Quiz',
    body: 'Practice active recall with 5 multiple-choice questions, instant scoring, percentage accuracy, and clear explanations.',
  },
  {
    num: '05',
    title: 'Extract 3 Core Terms',
    body: 'Master essential academic terminology with student-friendly definitions and practical real-world examples.',
  },
  {
    num: '06',
    title: 'Save & Export PDF',
    body: 'Revisit any revision pack from your local Revision History or download a formatted, print-ready PDF study sheet.',
  },
];

export function AboutView({ onStartStudying }: AboutViewProps) {
  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-10 pb-16 space-y-8">
      <div className="glass-panel rounded-2xl p-6 sm:p-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-balance text-[#0C1126] dark:text-white">
          Built for Faster, Smarter Exam Revision
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#525C7A] dark:text-[#A6AEC8]">
          AI Study Buddy — Smart Revision Assistant helps university students and exam candidates
          turn dense lecture notes, textbook chapters, and PDF handouts into focused revision packs
          in seconds. Whether you are preparing for semester finals, competitive exams, or technical
          placement tests, every generated pack combines concise summaries, active-recall quizzes,
          and core vocabulary.
        </p>

        <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-3 pt-7 border-t border-slate-200/80 dark:border-white/10">
          <div>
            <h2 className="font-display text-base font-semibold text-[#0C1126] dark:text-white">
              Semester Examinations
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#525C7A] dark:text-[#A6AEC8]">
              Condense multi-page lecture slides and chapter readings into clean bullet points and
              definitions the night before exams.
            </p>
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-[#0C1126] dark:text-white">
              Competitive Tests
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#525C7A] dark:text-[#A6AEC8]">
              Reinforce retention through instant 5-question multiple-choice drills with answer
              explanations and score tracking.
            </p>
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-[#0C1126] dark:text-white">
              Placement Preparation
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#525C7A] dark:text-[#A6AEC8]">
              Review core technical concepts and export portable PDF revision sheets for quick
              interview refreshers.
            </p>
          </div>
        </div>
      </div>

      {/* 6-Step Workflow */}
      <div className="glass-panel rounded-2xl p-6 sm:p-10">
        <h2 className="font-display text-2xl font-bold text-[#0C1126] dark:text-white">
          How AI Study Buddy Works
        </h2>
        <p className="mt-1.5 text-sm text-[#525C7A] dark:text-[#A6AEC8]">
          A focused 6-step revision pipeline from raw study notes to an exam-ready pack.
        </p>

        <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PIPELINE_STEPS.map((step) => (
            <div key={step.num} className="glass-subtle rounded-xl p-5">
              <span className="font-mono text-xs font-semibold text-[#613EEA] dark:text-[#00D9FF]">
                {step.num}
              </span>
              <h3 className="font-display mt-2 text-base font-semibold text-[#0C1126] dark:text-white">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#525C7A] dark:text-[#A6AEC8]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Grounding Guarantee + CTA */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4 max-w-2xl">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0C1126] dark:text-white">
              Strictly Grounded in Your Notes
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-[#525C7A] dark:text-[#A6AEC8]">
              AI Study Buddy generates summaries, quizzes, and key terms exclusively from the study
              material you supply. If a note excerpt lacks sufficient information, it lets you know
              clearly rather than inventing facts.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onStartStudying}
          className="brand-gradient-btn inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Start Studying</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
