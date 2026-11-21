import { motion } from 'motion/react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-8 sm:pt-16 sm:pb-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Glowing AI Emblem */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center"
        >
          <div
            aria-hidden="true"
            className="ai-emblem-halo absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#7957FF]/45 via-[#B36BFF]/35 to-[#00D9FF]/45 blur-xl"
          />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#7957FF]/35 dark:border-white/20 bg-white/90 dark:bg-[#101733]/90 shadow-lg">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-9 w-9"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="heroEmblemGrad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#7957FF" />
                  <stop offset="50%" stopColor="#B36BFF" />
                  <stop offset="100%" stopColor="#00D9FF" />
                </linearGradient>
              </defs>
              <path
                d="M24 6L28.8 18.2L41 23L28.8 27.8L24 40L19.2 27.8L7 23L19.2 18.2L24 6Z"
                fill="url(#heroEmblemGrad)"
                fillOpacity="0.22"
                stroke="url(#heroEmblemGrad)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <circle cx="24" cy="23" r="4" fill="url(#heroEmblemGrad)" />
              <path
                d="M36 9L37.4 12.6L41 14L37.4 15.4L36 19L34.6 15.4L31 14L34.6 12.6L36 9Z"
                fill="#00D9FF"
              />
            </svg>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="font-display mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight text-[#0C1126] dark:text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
        >
          Study Smarter,{' '}
          <span className="bg-gradient-to-r from-[#7957FF] via-[#B36BFF] to-[#00D9FF] bg-clip-text text-transparent">
            Not Longer.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#525C7A] dark:text-[#A6AEC8] sm:text-lg"
        >
          Transform your lengthy notes into smart summaries, interactive quizzes, and quick
          revision packs with AI.
        </motion.p>

        {/* Quiet Inline Capability Metadata (Zero-Pill Discipline) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs font-medium text-[#525C7A] dark:text-[#A6AEC8] sm:text-[13px]"
        >
          <span>5–6 Exam Summary Points</span>
          <span aria-hidden="true" className="text-[#7957FF] dark:text-[#00D9FF]">
            ·
          </span>
          <span>5 Interactive MCQs</span>
          <span aria-hidden="true" className="text-[#7957FF] dark:text-[#00D9FF]">
            ·
          </span>
          <span>3 Core Key Terms</span>
          <span aria-hidden="true" className="text-[#7957FF] dark:text-[#00D9FF]">
            ·
          </span>
          <span>Instant PDF Export</span>
        </motion.div>
      </div>
    </section>
  );
}
