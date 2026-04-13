import { Chapter } from "../types";

export const searchComick = async (query: string) => {
  try {
    const response = await fetch(`/api/comick/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Comick search error:", error);
    return [];
  }
};

export const getComickChapters = async (hid: string): Promise<{ chapters: Chapter[] }> => {
  try {
    const response = await fetch(`/api/comick/chapters?hid=${encodeURIComponent(hid)}`);
    const data = await response.json();
    
    const chapters: Chapter[] = data.map((ch: any) => ({
      id: ch.hid,
      chapter: ch.chap,
      title: ch.title || `Chapter ${ch.chap}`,
      pages: [],
      source: "comick",
    }));

    return { chapters };
  } catch (error) {
    console.error("Comick chapters error:", error);
    return { chapters: [] };
  }
};

export const getComickPages = async (hid: string): Promise<string[]> => {
  try {
    const response = await fetch(`/api/comick/pages?hid=${encodeURIComponent(hid)}`);
    const data = await response.json();
    return data.map((url: string) => `/api/comick/image?url=${encodeURIComponent(url)}`);
  } catch (error) {
    console.error("Comick pages error:", error);
    return [];
  }
};
