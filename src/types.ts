export interface Manga {
  id: string | number;
  anilistId?: number;
  title: string;
  coverImage: string;
  bannerImage?: string;
  description: string;
  genres: string[];
  status: string;
  format: string;
  chapters?: number;
  averageScore?: number;
  startDate?: string;
  type: "MANGA" | "WEBTOON" | "MANHWA";
}

export interface Chapter {
  id: string;
  title: string;
  chapter: string;
  volume?: string;
  pages?: string[];
  publishAt?: string;
  source?: "mangapill" | "comick" | "manganato" | "mangakakalot" | "allmanga" | "aquamanga";
}

export interface PageInfo {
  currentPage: number;
  hasNextPage: boolean;
  lastPage: number;
  total: number;
  perPage: number;
}

export interface ReadingHistory {
  mangaId: string | number;
  manga: Manga;
  lastChapterId: string;
  lastChapterNumber: string;
  scrollPosition: number;
  updatedAt: number;
}

export interface Bookmark {
  mangaId: string | number;
  manga: Manga;
  addedAt: number;
  tags?: string[];
}

export interface ReadingStats {
  totalChaptersRead: number;
  totalTimeSpent: number; // in minutes
  genreCounts: { [genre: string]: number };
  lastReadAt: number;
}

export interface UserSettings {
  readingMode: "webtoon" | "manga";
  direction: "ltr" | "rtl";
  autoNext: boolean;
  imageQuality: "low" | "high";
}
