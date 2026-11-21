import { RevisionPack, QuizResultSummary } from '../types/study';

const HISTORY_STORAGE_KEY = 'ai_study_buddy_revision_history_v1';
const THEME_STORAGE_KEY = 'ai_study_buddy_theme_v1';
const DRAFT_NOTES_STORAGE_KEY = 'ai_study_buddy_draft_notes_v1';

export function loadRevisionHistory(): RevisionPack[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RevisionPack[]) : [];
  } catch {
    return [];
  }
}

export function saveRevisionHistory(packs: RevisionPack[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(packs.slice(0, 40)));
  } catch {
    // Ignore quota errors gracefully; trim older items if needed
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(packs.slice(0, 15)));
    } catch {
      // Storage unavailable
    }
  }
}

export function addRevisionPackToHistory(pack: RevisionPack): RevisionPack[] {
  const existing = loadRevisionHistory().filter((item) => item.id !== pack.id);
  const updated = [pack, ...existing];
  saveRevisionHistory(updated);
  return updated;
}

export function updatePackQuizScore(
  packId: string,
  score: QuizResultSummary
): RevisionPack[] {
  const existing = loadRevisionHistory();
  const updated = existing.map((pack) =>
    pack.id === packId ? { ...pack, lastQuizScore: score } : pack
  );
  saveRevisionHistory(updated);
  return updated;
}

export function deleteRevisionPackFromHistory(packId: string): RevisionPack[] {
  const updated = loadRevisionHistory().filter((item) => item.id !== packId);
  saveRevisionHistory(updated);
  return updated;
}

export function loadThemePreference(): 'dark' | 'light' {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // ignore
  }
  return 'dark';
}

export function saveThemePreference(theme: 'dark' | 'light'): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

export function loadDraftNotes(): string {
  try {
    return localStorage.getItem(DRAFT_NOTES_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveDraftNotes(notes: string): void {
  try {
    if (notes.length < 250_000) {
      localStorage.setItem(DRAFT_NOTES_STORAGE_KEY, notes);
    }
  } catch {
    // ignore
  }
}
