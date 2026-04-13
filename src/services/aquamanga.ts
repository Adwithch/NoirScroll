import { Chapter } from "../types";

export const searchAquaManga = async (query: string) => {
  try {
    const response = await fetch(`/api/aquamanga/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("AquaManga search error:", error);
    return [];
  }
};

export const getAquaMangaChapters = async (mangaUrl: string) => {
  try {
    const response = await fetch(`/api/aquamanga/chapters?url=${encodeURIComponent(mangaUrl)}`);
    const data = await response.json();
    return {
      chapters: data.map((ch: any) => ({
        ...ch,
        source: "aquamanga"
      }))
    };
  } catch (error) {
    console.error("AquaManga chapters error:", error);
    return { chapters: [] };
  }
};

export const getAquaMangaPages = async (chapterUrl: string) => {
  try {
    const response = await fetch(`/api/aquamanga/pages?url=${encodeURIComponent(chapterUrl)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("AquaManga pages error:", error);
    return [];
  }
};
