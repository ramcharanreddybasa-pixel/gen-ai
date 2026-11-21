import { useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { ActivePage } from '../types/study';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  historyCount: number;
}

const NAV_ITEMS: Array<{ id: ActivePage; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'notes', label: 'My Notes' },
  { id: 'history', label: 'Revision History' },
  { id: 'about', label: 'About' },
];

export function BrandLogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="studyBuddyGrad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7957FF" />
          <stop offset="55%" stopColor="#B36BFF" />
          <stop offset="100%" stopColor="#00D9FF" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#studyBuddyGrad)" fillOpacity="0.18" />
      <rect x="2.75" y="2.75" width="34.5" height="34.5" rx="10.25" stroke="url(#studyBuddyGrad)" strokeWidth="1.5" />
      <path
        d="M11.5 14.5C11.5 13.4 12.4 12.5 13.5 12.5H17.2C18.75 12.5 20 13.75 20 15.3V27.5C20 26.4 19.1 25.5 18 25.5H13.5C12.4 25.5 11.5 24.6 11.5 23.5V14.5Z"
        stroke="url(#studyBuddyGrad)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M28.5 14.5C28.5 13.4 27.6 12.5 26.5 12.5H22.8C21.25 12.5 20 13.75 20 15.3V27.5C20 26.4 20.9 25.5 22 25.5H26.5C27.6 25.5 28.5 24.6 28.5 23.5V14.5Z"
        stroke="url(#studyBuddyGrad)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="10.2" r="2.2" fill="#00D9FF" />
    </svg>
  );
}

export function Navbar({
  activePage,
  onNavigate,
  theme,
  onToggleTheme,
  historyCount,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (page: ActivePage) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-[#080B18]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7957FF] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
        >
          <BrandLogoIcon className="h-8 w-8 shrink-0" />
          <span className="font-display text-lg font-bold tracking-tight text-[#0C1126] dark:text-white whitespace-nowrap">
            AI Study Buddy
          </span>
        </button>

        {/* Zone 2: Primary Navigation Links */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7957FF] rounded ${
                  isActive
                    ? 'text-[#613EEA] dark:text-white'
                    : 'text-[#525C7A] dark:text-[#A6AEC8] hover:text-[#0C1126] dark:hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {item.id === 'history' && historyCount > 0 && (
                  <span className="ml-1.5 font-mono text-xs tabular-nums text-[#7957FF] dark:text-[#00D9FF]">
                    ({historyCount})
                  </span>
                )}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[13px] h-[2px] rounded-full bg-gradient-to-r from-[#7957FF] to-[#00D9FF]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Theme Switcher & Mobile Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 dark:border-white/12 bg-slate-100/80 dark:bg-white/5 text-[#0C1126] dark:text-[#A6AEC8] hover:text-[#613EEA] dark:hover:text-white hover:border-[#7957FF]/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7957FF]"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 dark:border-white/12 bg-slate-100/80 dark:bg-white/5 text-[#0C1126] dark:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7957FF]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0B0F22]/98 px-4 py-3 space-y-1"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#7957FF]/12 text-[#613EEA] dark:bg-[#7957FF]/20 dark:text-white'
                    : 'text-[#525C7A] dark:text-[#A6AEC8] hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <span>{item.label}</span>
                {item.id === 'history' && historyCount > 0 && (
                  <span className="font-mono text-xs tabular-nums text-[#7957FF] dark:text-[#00D9FF]">
                    {historyCount} saved
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
