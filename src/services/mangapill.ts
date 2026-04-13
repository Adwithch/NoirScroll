import { Chapter } from "../types";

export const searchMangapillManga = async (query: string) => {
  try {
    const response = await fetch(`/api/mangapill/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (data && data.length > 0) return data[0];

    // Try a slightly different query if no results (e.g. remove special chars)
    const cleanQuery = query.replace(/[^a-zA-Z0-9 ]/g, "");
    if (cleanQuery !== query) {
      const retryResponse = await fetch(`/api/mangapill/search?q=${encodeURIComponent(cleanQuery)}`);
      const retryData = await retryResponse.json();
      return retryData[0] || null;
    }

    return null;
  } catch (error) {
    console.error("Mangapill search error:", error);
    return null;
  }
};

export const getMangapillChapters = async (url: string): Promise<{ chapters: Chapter[] }> => {
  try {
    const response = await fetch(`/api/mangapill/chapters?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    const chapters: Chapter[] = data.map((ch: any) => ({
      id: ch.url, // Use the full URL as ID
      chapter: ch.title.match(/Chapter (\d+)/)?.[1] || ch.title,
      title: ch.title,
      pages: [],
      source: "mangapill",
    }));

    return { chapters };
  } catch (error) {
    console.error("Mangapill chapters error:", error);
    return { chapters: [] };
  }
};

export const getMangapillPages = async (url: string): Promise<string[]> => {
  try {
    const response = await fetch(`/api/mangapill/pages?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    // Use our image proxy for each page
    return data.map((pageUrl: string) => `/api/mangapill/image?url=${encodeURIComponent(pageUrl)}`);
  } catch (error) {
    console.error("Mangapill pages error:", error);
    return [];
  }
};
