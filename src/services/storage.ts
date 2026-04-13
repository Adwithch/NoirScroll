import { UserSettings } from "../types";

const SETTINGS_KEY = "mangaflow_settings";
const HISTORY_KEY = "mangaflow_history";
const BOOKMARKS_KEY = "mangaflow_bookmarks";
const STATS_KEY = "mangaflow_stats";
const READ_CHAPTERS_KEY = "noirscroll_read_chapters";
const CHAPTER_PROGRESS_KEY = "noirscroll_chapter_progress";

export const defaultSettings: UserSettings = {
  readingMode: "webtoon",
  direction: "ltr",
  autoNext: true,
  imageQuality: "high",
};

export const getSettings = (): UserSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = (settings: UserSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getHistory = () => {
  const stored = localStorage.getItem(HISTORY_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const saveHistory = (item: any) => {
  const history = getHistory();
  const filtered = history.filter((h: any) => h.mangaId !== item.mangaId);
  const newHistory = [item, ...filtered].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
};

export const getBookmarks = () => {
  const stored = localStorage.getItem(BOOKMARKS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const toggleBookmark = (manga: any) => {
  const bookmarks = getBookmarks();
  const exists = bookmarks.find((b: any) => b.mangaId === manga.id);
  let newBookmarks;
  if (exists) {
    newBookmarks = bookmarks.filter((b: any) => b.mangaId !== manga.id);
  } else {
    newBookmarks = [{ mangaId: manga.id, manga, addedAt: Date.now(), tags: [] }, ...bookmarks];
  }
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
  return !exists;
};

export const updateBookmarkTags = (mangaId: string | number, tags: string[]) => {
  const bookmarks = getBookmarks();
  const newBookmarks = bookmarks.map((b: any) => 
    b.mangaId === mangaId ? { ...b, tags } : b
  );
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
};

export const getStats = () => {
  const stored = localStorage.getItem(STATS_KEY);
  if (!stored) return { totalChaptersRead: 0, totalTimeSpent: 0, genreCounts: {}, lastReadAt: 0 };
  try {
    return JSON.parse(stored);
  } catch {
    return { totalChaptersRead: 0, totalTimeSpent: 0, genreCounts: {}, lastReadAt: 0 };
  }
};

export const updateStats = (chaptersRead: number, timeSpent: number, genres: string[]) => {
  const stats = getStats();
  const newGenreCounts = { ...stats.genreCounts };
  genres.forEach(genre => {
    newGenreCounts[genre] = (newGenreCounts[genre] || 0) + chaptersRead;
  });
  
  const newStats = {
    totalChaptersRead: stats.totalChaptersRead + chaptersRead,
    totalTimeSpent: stats.totalTimeSpent + timeSpent,
    genreCounts: newGenreCounts,
    lastReadAt: Date.now()
  };
  localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
};

export const getReadChapters = (mangaId: string | number): string[] => {
  const stored = localStorage.getItem(`${READ_CHAPTERS_KEY}_${mangaId}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const markChapterAsRead = (mangaId: string | number, chapterId: string) => {
  const read = getReadChapters(mangaId);
  if (!read.includes(chapterId)) {
    const newRead = [...read, chapterId];
    localStorage.setItem(`${READ_CHAPTERS_KEY}_${mangaId}`, JSON.stringify(newRead));
  }
};

export const saveChapterProgress = (chapterId: string, progress: number) => {
  localStorage.setItem(`${CHAPTER_PROGRESS_KEY}_${chapterId}`, progress.toString());
};

export const getChapterProgress = (chapterId: string): number => {
  const stored = localStorage.getItem(`${CHAPTER_PROGRESS_KEY}_${chapterId}`);
  return stored ? parseFloat(stored) : 0;
};
