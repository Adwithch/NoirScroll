import { Chapter } from "../types";
import { getManganatoChapters, getManganatoPages } from "./manganato";

export const searchMangaKakalot = async (query: string) => {
  try {
    const response = await fetch(`/api/mangakakalot/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("MangaKakalot search error:", error);
    return [];
  }
};

export const getMangaKakalotChapters = getManganatoChapters;
export const getMangaKakalotPages = getManganatoPages;
