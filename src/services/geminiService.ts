import { GoogleGenAI, Type } from "@google/genai";
import { Manga } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getLatestMangaFromGemini = async (type: "MANGA" | "WEBTOON"): Promise<Manga[]> => {
  const prompt = `Find the top 20 latest and most popular ${type === "MANGA" ? "manga" : "webtoons/manhwa"} released or trending in 2025 and 2026. 
  For each item, provide:
  - title
  - anilistId (AniList ID if known, otherwise null)
  - description (brief synopsis)
  - coverImage (A high-quality cover image URL)
  - bannerImage (A high-quality banner image URL)
  - genres (array of strings)
  - status (RELEASING, FINISHED, etc.)
  - format (MANGA, ONE_SHOT, etc.)
  - averageScore (out of 100)
  
  Return the data as a JSON array of objects.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }] as any,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              anilistId: { type: Type.NUMBER },
              description: { type: Type.STRING },
              coverImage: { type: Type.STRING },
              bannerImage: { type: Type.STRING },
              genres: { type: Type.ARRAY, items: { type: Type.STRING } },
              status: { type: Type.STRING },
              format: { type: Type.STRING },
              averageScore: { type: Type.NUMBER },
            },
            required: ["title", "description", "coverImage"],
          },
        },
      },
    });

    const results = JSON.parse(response.text);
    return results.map((item: any) => ({
      id: item.anilistId || Math.random().toString(36).substr(2, 9),
      anilistId: item.anilistId,
      title: item.title,
      coverImage: item.coverImage,
      bannerImage: item.bannerImage,
      description: item.description,
      genres: item.genres || [],
      status: item.status || "UNKNOWN",
      format: item.format || "MANGA",
      averageScore: item.averageScore,
      type: type,
    }));
  } catch (error) {
    console.error(`Error fetching ${type} from Gemini:`, error);
    return [];
  }
};

export const searchMangaWithGemini = async (query: string): Promise<Manga[]> => {
  const prompt = `Search for manga, webtoons, and manhwa related to "${query}". 
  Provide details for the top 10 results including title, anilistId, description, coverImage, bannerImage, genres, status, format, and averageScore.
  Return as a JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }] as any,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              anilistId: { type: Type.NUMBER },
              description: { type: Type.STRING },
              coverImage: { type: Type.STRING },
              bannerImage: { type: Type.STRING },
              genres: { type: Type.ARRAY, items: { type: Type.STRING } },
              status: { type: Type.STRING },
              format: { type: Type.STRING },
              averageScore: { type: Type.NUMBER },
            },
            required: ["title", "description", "coverImage"],
          },
        },
      },
    });

    const results = JSON.parse(response.text);
    return results.map((item: any) => ({
      id: item.anilistId || Math.random().toString(36).substr(2, 9),
      anilistId: item.anilistId,
      title: item.title,
      coverImage: item.coverImage,
      bannerImage: item.bannerImage,
      description: item.description,
      genres: item.genres || [],
      status: item.status || "UNKNOWN",
      format: item.format || "MANGA",
      averageScore: item.averageScore,
      type: item.format === "MANGA" ? "MANGA" : "WEBTOON",
    }));
  } catch (error) {
    console.error("Error searching with Gemini:", error);
    return [];
  }
};
