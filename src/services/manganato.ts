import { Chapter } from "../types";

export const searchManganato = async (query: string) => {
  try {
    const response = await fetch(`/api/manganato/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Manganato search error:", error);
    return [];
  }
};

export const getManganatoChapters = async (url: string): Promise<{ chapters: Chapter[] }> => {
  try {
    const response = await fetch(`/api/manganato/chapters?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    const chapters: Chapter[] = data.map((ch: any) => ({
      id: ch.url,
      chapter: ch.title.match(/Chapter (\d+)/)?.[1] || ch.title,
      title: ch.title,
      pages: [],
      source: "manganato",
    }));

    return { chapters };
  } catch (error) {
    console.error("Manganato chapters error:", error);
    return { chapters: [] };
  }
};

export const getManganatoPages = async (url: string): Promise<string[]> => {
  try {
    const response = await fetch(`/api/manganato/pages?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    return data.map((pageUrl: string) => `/api/manganato/image?url=${encodeURIComponent(pageUrl)}`);
  } catch (error) {
    console.error("Manganato pages error:", error);
    return [];
  }
};
