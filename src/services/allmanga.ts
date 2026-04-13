import { Chapter } from "../types";

export const searchAllManga = async (query: string) => {
  try {
    const response = await fetch(`/api/allmanga/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("AllManga search error:", error);
    return [];
  }
};

export const getAllMangaChapters = async (mangaId: string) => {
  try {
    const response = await fetch(`/api/allmanga/chapters?id=${mangaId}`);
    const data = await response.json();
    return {
      chapters: data.map((ch: any) => ({
        ...ch,
        source: "allmanga",
        mangaId: mangaId // Store mangaId for page fetching
      }))
    };
  } catch (error) {
    console.error("AllManga chapters error:", error);
    return { chapters: [] };
  }
};

export const getAllMangaPages = async (mangaId: string, chapter: string) => {
  try {
    const response = await fetch(`/api/allmanga/pages?mangaId=${mangaId}&chapter=${chapter}`);
    const data = await response.json();
    // AllManga pages are often relative or need proxying
    return data.map((url: string) => {
      if (url.startsWith("http")) {
        return `/api/proxy/image?url=${encodeURIComponent(url)}`;
      }
      return url;
    });
  } catch (error) {
    console.error("AllManga pages error:", error);
    return [];
  }
};
