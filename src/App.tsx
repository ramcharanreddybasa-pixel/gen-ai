import { useEffect, useState } from 'react';
import { AboutView } from './components/AboutView';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { NotesWorkspace } from './components/NotesWorkspace';
import { RevisionDashboard } from './components/RevisionDashboard';
import { RevisionHistoryView } from './components/RevisionHistoryView';
import {
  ActivePage,
  GenerateRevisionResponse,
  PdfExtractionResult,
  QuizResultSummary,
  RevisionPack,
} from './types/study';
import {
  addRevisionPackToHistory,
  deleteRevisionPackFromHistory,
  loadDraftNotes,
  loadRevisionHistory,
  loadThemePreference,
  saveDraftNotes,
  saveThemePreference,
  updatePackQuizScore,
} from './utils/storage';

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function createPackId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pack-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => loadThemePreference());
  const [activePage, setActivePage] = useState<ActivePage>('home');

  const [notes, setNotes] = useState<string>(() => loadDraftNotes());
  const [topicTitleInput, setTopicTitleInput] = useState<string>('');
  const [uploadedPdf, setUploadedPdf] = useState<PdfExtractionResult | null>(null);

  const [history, setHistory] = useState<RevisionPack[]>(() => loadRevisionHistory());
  const [activePack, setActivePack] = useState<RevisionPack | null>(null);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [insufficientInfoMessage, setInsufficientInfoMessage] = useState<string | null>(null);

  // Sync Tailwind v4 .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveThemePreference(theme);
  }, [theme]);

  // Persist draft notes automatically
  useEffect(() => {
    saveDraftNotes(notes);
  }, [notes]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleDismissAlerts = () => {
    setErrorMessage(null);
    setInsufficientInfoMessage(null);
  };

  const handleClearNotes = () => {
    setNotes('');
    setTopicTitleInput('');
    setUploadedPdf(null);
    handleDismissAlerts();
  };

  const runGeneration = async (options: {
    sourceNotes: string;
    sourceTitle?: string;
    sourceType: 'text' | 'pdf';
    fileName?: string;
    pageCount?: number;
    isRegen: boolean;
  }) => {
    const trimmed = options.sourceNotes.trim();
    handleDismissAlerts();

    if (!trimmed) {
      setErrorMessage(
        'Please paste your study notes or upload a PDF document before generating a revision pack.'
      );
      return;
    }

    if (options.isRegen) {
      setIsRegenerating(true);
    } else {
      setIsGenerating(true);
    }

    try {
      const response = await fetch('/api/generate-revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: trimmed,
          sourceTitle: options.sourceTitle?.trim() || undefined,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as GenerateRevisionResponse;

      if (!response.ok) {
        setErrorMessage(
          payload.error || 'Unable to generate revision pack right now. Please try again.'
        );
        return;
      }

      if (!payload.hasEnoughInformation || !payload.data) {
        setInsufficientInfoMessage(
          payload.insufficientInfoMessage ||
            'Your notes do not contain enough study information to build a complete revision pack without inventing facts. Please add more detailed notes.'
        );
        return;
      }

      const newPack: RevisionPack = {
        id: createPackId(),
        topicTitle: payload.data.topicTitle,
        subjectArea: payload.data.subjectArea,
        createdAt: new Date().toISOString(),
        sourceType: options.sourceType,
        fileName: options.fileName,
        pageCount: options.pageCount,
        sourceWordCount: countWords(trimmed),
        sourceNotes: trimmed,
        summary: payload.data.summary,
        quiz: payload.data.quiz,
        keyTerms: payload.data.keyTerms,
      };

      const updatedHistory = addRevisionPackToHistory(newPack);
      setHistory(updatedHistory);
      setActivePack(newPack);

      // Smoothly bring the generated Revision Dashboard into view
      window.setTimeout(() => {
        const el = document.getElementById('revision-dashboard');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);
    } catch {
      setErrorMessage(
        'Network error while connecting to the AI service. Please check your connection and retry.'
      );
    } finally {
      setIsGenerating(false);
      setIsRegenerating(false);
    }
  };

  const handleGenerateFromWorkspace = () => {
    void runGeneration({
      sourceNotes: notes,
      sourceTitle: topicTitleInput,
      sourceType: uploadedPdf ? 'pdf' : 'text',
      fileName: uploadedPdf?.fileName,
      pageCount: uploadedPdf?.pageCount,
      isRegen: false,
    });
  };

  const handleRegenerateActivePack = () => {
    if (!activePack) return;
    void runGeneration({
      sourceNotes: activePack.sourceNotes,
      sourceTitle: activePack.topicTitle,
      sourceType: activePack.sourceType,
      fileName: activePack.fileName,
      pageCount: activePack.pageCount,
      isRegen: true,
    });
  };

  const handleQuizSubmitted = (result: QuizResultSummary) => {
    if (!activePack) return;
    const updatedPack: RevisionPack = { ...activePack, lastQuizScore: result };
    setActivePack(updatedPack);
    setHistory(updatePackQuizScore(activePack.id, result));
  };

  const handleOpenPackFromHistory = (pack: RevisionPack) => {
    setActivePack(pack);
    setNotes(pack.sourceNotes);
    setTopicTitleInput(pack.topicTitle);
    setUploadedPdf(
      pack.sourceType === 'pdf' && pack.fileName
        ? {
            text: pack.sourceNotes,
            fileName: pack.fileName,
            pageCount: pack.pageCount ?? 1,
            wordCount: pack.sourceWordCount,
            charCount: pack.sourceNotes.length,
          }
        : null
    );
    handleDismissAlerts();
    setActivePage('home');

    window.setTimeout(() => {
      const el = document.getElementById('revision-dashboard');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  const handleDeletePackFromHistory = (packId: string) => {
    const updated = deleteRevisionPackFromHistory(packId);
    setHistory(updated);
    if (activePack?.id === packId) {
      setActivePack(null);
    }
  };

  const handleEditCurrentPackNotes = () => {
    if (activePack) {
      setNotes(activePack.sourceNotes);
      setTopicTitleInput(activePack.topicTitle);
    }
    setActivePage('notes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-clip bg-[#F5F7FC] dark:bg-[#080B18] text-[#0C1126] dark:text-white transition-colors duration-200">
      {/* Ambient Futuristic Animated Background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="ambient-orb-a absolute -top-32 left-1/4 h-[460px] w-[460px] rounded-full bg-[#7957FF]/18 dark:bg-[#7957FF]/22 blur-[120px]" />
        <div className="ambient-orb-b absolute top-40 right-1/6 h-[400px] w-[400px] rounded-full bg-[#00D9FF]/14 dark:bg-[#00D9FF]/16 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[320px] w-[620px] rounded-full bg-[#B36BFF]/10 dark:bg-[#B36BFF]/12 blur-[130px]" />
        {/* Subtle Architectural Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #7957FF 1px, transparent 1px), linear-gradient(to bottom, #7957FF 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Navigation Bar */}
      <Navbar
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        historyCount={history.length}
      />

      {/* Main Content */}
      <main className="flex-1 pb-20">
        {activePage === 'home' && (
          <>
            <HeroSection />
            <NotesWorkspace
              notes={notes}
              onNotesChange={setNotes}
              topicTitleInput={topicTitleInput}
              onTopicTitleInputChange={setTopicTitleInput}
              uploadedPdf={uploadedPdf}
              onPdfExtracted={setUploadedPdf}
              isGenerating={isGenerating}
              onGenerate={handleGenerateFromWorkspace}
              onClearNotes={handleClearNotes}
              errorMessage={errorMessage}
              insufficientInfoMessage={insufficientInfoMessage}
              onDismissAlerts={handleDismissAlerts}
            />
            {activePack && (
              <RevisionDashboard
                pack={activePack}
                isRegenerating={isRegenerating}
                onRegenerate={handleRegenerateActivePack}
                onEditNotes={handleEditCurrentPackNotes}
                onQuizSubmitted={handleQuizSubmitted}
              />
            )}
          </>
        )}

        {activePage === 'notes' && (
          <div className="pt-10">
            <NotesWorkspace
              notes={notes}
              onNotesChange={setNotes}
              topicTitleInput={topicTitleInput}
              onTopicTitleInputChange={setTopicTitleInput}
              uploadedPdf={uploadedPdf}
              onPdfExtracted={setUploadedPdf}
              isGenerating={isGenerating}
              onGenerate={handleGenerateFromWorkspace}
              onClearNotes={handleClearNotes}
              errorMessage={errorMessage}
              insufficientInfoMessage={insufficientInfoMessage}
              onDismissAlerts={handleDismissAlerts}
              compactHeader
            />
            {activePack && (
              <RevisionDashboard
                pack={activePack}
                isRegenerating={isRegenerating}
                onRegenerate={handleRegenerateActivePack}
                onEditNotes={handleEditCurrentPackNotes}
                onQuizSubmitted={handleQuizSubmitted}
              />
            )}
          </div>
        )}

        {activePage === 'history' && (
          <RevisionHistoryView
            history={history}
            activePackId={activePack?.id ?? null}
            onOpenPack={handleOpenPackFromHistory}
            onDeletePack={handleDeletePackFromHistory}
            onCreateNew={() => {
              setActivePage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activePage === 'about' && (
          <AboutView
            onStartStudying={() => {
              setActivePage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="border-t border-slate-200/80 dark:border-white/10 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 text-xs text-[#525C7A] dark:text-[#A6AEC8]">
          <p>AI Study Buddy — Smart Revision Assistant</p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => {
                setActivePage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#0C1126] dark:hover:text-white transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePage('notes');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#0C1126] dark:hover:text-white transition-colors cursor-pointer"
            >
              My Notes
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePage('history');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#0C1126] dark:hover:text-white transition-colors cursor-pointer"
            >
              Revision History
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePage('about');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#0C1126] dark:hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
