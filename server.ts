import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import * as cheerio from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AquaManga Scraper - Search
  app.get("/api/aquamanga/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: "Query required" });

      const searchUrl = `https://aquareader.net/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
      const { data } = await axios.get(searchUrl, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          "Referer": "https://aquareader.net/"
        },
        timeout: 10000
      });
      const $ = cheerio.load(data);
      const results: any[] = [];

      $(".c-tabs-item__content").each((_, el) => {
        const titleEl = $(el).find(".post-title h3 a");
        const title = titleEl.text().trim();
        const href = titleEl.attr("href");
        const img = $(el).find("img").attr("src") || $(el).find("img").attr("data-src");

        if (href) {
          results.push({
            id: href,
            title: title || "Unknown Title",
            url: href,
            thumbnail: img,
          });
        }
      });

      res.json(results);
    } catch (error: any) {
      console.error("AquaManga Search error:", error.message);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // AquaManga Scraper - Chapters
  app.get("/api/aquamanga/chapters", async (req, res) => {
    try {
      const mangaUrl = req.query.url as string;
      if (!mangaUrl) return res.status(400).json({ error: "URL required" });

      const { data } = await axios.get(mangaUrl, {
        headers: { 
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://aquareader.net/"
        },
        timeout: 10000
      });
      const $ = cheerio.load(data);
      const chapters: any[] = [];

      $(".wp-manga-chapter a").each((_, el) => {
        const href = $(el).attr("href");
        const title = $(el).text().trim();
        if (href) {
          chapters.push({
            id: href,
            title: title,
            url: href,
            chapter: title.replace(/Chapter\s+/i, "").trim()
          });
        }
      });

      res.json(chapters); // Madara usually lists newest first
    } catch (error: any) {
      console.error("AquaManga Chapters error:", error.message);
      res.status(500).json({ error: "Failed to fetch chapters" });
    }
  });

  // AquaManga Scraper - Pages
  app.get("/api/aquamanga/pages", async (req, res) => {
    try {
      const chapterUrl = req.query.url as string;
      if (!chapterUrl) return res.status(400).json({ error: "URL required" });

      const { data } = await axios.get(chapterUrl, {
        headers: { 
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://aquareader.net/"
        },
        timeout: 10000
      });
      const $ = cheerio.load(data);
      const pages: string[] = [];

      $(".reading-content img").each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src");
        if (src) {
          const cleanSrc = src.trim();
          // Use universal proxy for images to avoid referer issues
          pages.push(`/api/proxy/image?url=${encodeURIComponent(cleanSrc)}`);
        }
      });

      res.json(pages);
    } catch (error: any) {
      console.error("AquaManga Pages error:", error.message);
      res.status(500).json({ error: "Failed to fetch pages" });
    }
  });

  // Proxy for AniList API
  app.post("/api/anilist", async (req, res) => {
    try {
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("AniList Proxy error:", error);
      res.status(500).json({ error: "Failed to fetch from AniList" });
    }
  });

  // Mangapill Scraper - Search
  app.get("/api/mangapill/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: "Query required" });

      const searchUrl = `https://mangapill.com/search?q=${encodeURIComponent(query)}`;
      const { data } = await axios.get(searchUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
      });
      const $ = cheerio.load(data);
      const results: any[] = [];

      $("div.grid > div").each((_, el) => {
        const a = $(el).find("a").last(); // Usually the title link is the last one or contains the title
        const title = $(el).find("a div.text-secondary").text().trim() || $(el).find("a.text-secondary").text().trim() || a.text().trim();
        const href = a.attr("href");
        const img = $(el).find("img").attr("data-src") || $(el).find("img").attr("src");

        if (href && href.startsWith("/manga/")) {
          results.push({
            id: href,
            title: title || "Unknown Title",
            url: `https://mangapill.com${href}`,
            thumbnail: img,
          });
        }
      });

      res.json(results);
    } catch (error) {
      console.error("Mangapill Search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Mangapill Scraper - Chapters
  app.get("/api/mangapill/chapters", async (req, res) => {
    try {
      const mangaUrl = req.query.url as string;
      if (!mangaUrl) return res.status(400).json({ error: "URL required" });

      const { data } = await axios.get(mangaUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const $ = cheerio.load(data);
      const chapters: any[] = [];

      $("#chapters a").each((_, el) => {
        const href = $(el).attr("href");
        if (href && href.startsWith("/chapters/")) {
          chapters.push({
            id: href,
            title: $(el).text().trim(),
            url: `https://mangapill.com${href}`,
          });
        }
      });

      res.json(chapters.reverse()); // Oldest to newest
    } catch (error) {
      console.error("Mangapill Chapters error:", error);
      res.status(500).json({ error: "Failed to fetch chapters" });
    }
  });

  // Mangapill Scraper - Pages
  app.get("/api/mangapill/pages", async (req, res) => {
    try {
      const chapterUrl = req.query.url as string;
      if (!chapterUrl) return res.status(400).json({ error: "URL required" });

      const { data } = await axios.get(chapterUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const $ = cheerio.load(data);
      const pages: string[] = [];

      $("picture img").each((_, el) => {
        const src = $(el).attr("data-src") || $(el).attr("src");
        if (src) pages.push(src);
      });

      res.json(pages);
    } catch (error) {
      console.error("Mangapill Pages error:", error);
      res.status(500).json({ error: "Failed to fetch pages" });
    }
  });

  // Mangapill Image Proxy
  app.get("/api/mangapill/image", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).send("URL required");

      const response = await axios.get(url, {
        responseType: "arraybuffer",
        headers: {
          "Referer": "https://mangapill.com/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        timeout: 15000
      });

      res.setHeader("Content-Type", response.headers["content-type"] || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=31536000");
      res.send(response.data);
    } catch (error: any) {
      console.error("Mangapill Image Proxy Error:", error.message, "URL:", req.query.url);
      res.status(500).send("Failed to fetch image");
    }
  });

  // AllManga API Proxy
  app.get("/api/allmanga/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: "Query required" });

      // Try primary API endpoint
      const tryFetch = async (url: string) => {
        return await axios.post(url, {
          variables: {
            search: { name: query },
            limit: 20,
            page: 1,
            translationType: "sub"
          },
          query: `query($search: SearchInput, $limit: Int, $page: Int, $translationType: String) {
            mangas(search: $search, limit: $limit, page: $page, translationType: $translationType) {
              edges {
                _id
                name
                thumbnail
                slug
              }
            }
          }`
        }, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Referer": "https://allmanga.to/",
            "Origin": "https://allmanga.to",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          },
          maxRedirects: 2,
          timeout: 8000
        });
      };

      let response;
      try {
        response = await tryFetch("https://api.allmanga.to/api");
      } catch (e) {
        console.log("AllManga primary API failed, trying fallback...");
        response = await tryFetch("https://allmanga.to/api");
      }

      if (!response.data?.data?.mangas?.edges) {
        return res.json([]);
      }

      const results = response.data.data.mangas.edges.map((manga: any) => ({
        id: manga._id,
        title: manga.name,
        thumbnail: manga.thumbnail,
        slug: manga.slug
      }));

      res.json(results);
    } catch (error: any) {
      console.error("AllManga Search error:", error.message);
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.get("/api/allmanga/chapters", async (req, res) => {
    try {
      const mangaId = req.query.id as string;
      if (!mangaId) return res.status(400).json({ error: "ID required" });

      const tryFetch = async (url: string) => {
        return await axios.post(url, {
          variables: {
            mangaId: mangaId
          },
          query: `query($mangaId: String!) {
            manga(mangaId: $mangaId) {
              availableChapters
            }
          }`
        }, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://allmanga.to/",
            "Origin": "https://allmanga.to",
            "Accept": "*/*",
            "Content-Type": "application/json"
          },
          maxRedirects: 2,
          timeout: 8000
        });
      };

      let response;
      try {
        response = await tryFetch("https://api.allmanga.to/api");
      } catch (e) {
        response = await tryFetch("https://allmanga.to/api");
      }

      const availableChapters = response.data.data?.manga?.availableChapters;
      if (!availableChapters) return res.json([]);

      const subChapters = availableChapters.sub || [];
      
      const chapters = subChapters.map((ch: string) => ({
        id: ch,
        title: `Chapter ${ch}`,
        chapter: ch
      })).reverse();

      res.json(chapters);
    } catch (error: any) {
      console.error("AllManga Chapters error:", error.message);
      res.status(500).json({ error: "Failed to fetch chapters" });
    }
  });

  app.get("/api/allmanga/pages", async (req, res) => {
    try {
      const mangaId = req.query.mangaId as string;
      const chapter = req.query.chapter as string;
      if (!mangaId || !chapter) return res.status(400).json({ error: "mangaId and chapter required" });

      const tryFetch = async (url: string) => {
        return await axios.post(url, {
          variables: {
            mangaId: mangaId,
            chapter: chapter,
            translationType: "sub"
          },
          query: `query($mangaId: String!, $chapter: String!, $translationType: String!) {
            chapter(mangaId: $mangaId, chapter: $chapter, translationType: $translationType) {
              pages {
                url
              }
            }
          }`
        }, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://allmanga.to/",
            "Origin": "https://allmanga.to",
            "Accept": "*/*",
            "Content-Type": "application/json"
          },
          maxRedirects: 2,
          timeout: 8000
        });
      };

      let response;
      try {
        response = await tryFetch("https://api.allmanga.to/api");
      } catch (e) {
        response = await tryFetch("https://allmanga.to/api");
      }

      const pagesData = response.data.data?.chapter?.pages;
      if (!pagesData) return res.json([]);

      const pages = pagesData.map((p: any) => p.url);
      res.json(pages);
    } catch (error: any) {
      console.error("AllManga Pages error:", error.message);
      res.status(500).json({ error: "Failed to fetch pages" });
    }
  });

  // MangaFire Scraper - Search (Experimental)
  app.get("/api/mangafire/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: "Query required" });

      const searchUrl = `https://mangafire.to/filter?keyword=${encodeURIComponent(query)}`;
      const { data } = await axios.get(searchUrl, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        }
      });
      const $ = cheerio.load(data);
      const results: any[] = [];

      $(".inner .info a").each((_, el) => {
        const title = $(el).text().trim();
        const href = $(el).attr("href");
        if (href && href.includes("/manga/")) {
          results.push({
            id: href,
            title,
            url: `https://mangafire.to${href}`,
          });
        }
      });

      res.json(results);
    } catch (error) {
      console.error("MangaFire Search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Manganato Scraper
  app.get("/api/manganato/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: "Query required" });

      const searchUrl = `https://manganato.com/search/story/${query.replace(/\s+/g, "_")}`;
      const { data } = await axios.get(searchUrl, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://manganato.com/",
          "Cache-Control": "no-cache"
        },
        timeout: 10000
      });
      const $ = cheerio.load(data);
      const results: any[] = [];

      $(".search-story-item").each((_, el) => {
        const titleEl = $(el).find(".item-title");
        const title = titleEl.text().trim();
        const href = titleEl.attr("href");
        const img = $(el).find("img").attr("src");

        if (href && (href.includes("manganato.com") || href.includes("readmanganato.com"))) {
          results.push({
            id: href,
            title: title || "Unknown Title",
            url: href,
            thumbnail: img,
          });
        }
      });

      res.json(results);
    } catch (error: any) {
      console.error("Manganato Search error:", error.message);
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.get("/api/manganato/chapters", async (req, res) => {
    try {
      const mangaUrl = req.query.url as string;
      if (!mangaUrl) return res.status(400).json({ error: "URL required" });

      const { data } = await axios.get(mangaUrl, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://manganato.com/"
        },
        timeout: 10000
      });
      const $ = cheerio.load(data);
      const chapters: any[] = [];

      $(".row-content-chapter li a").each((_, el) => {
        const href = $(el).attr("href");
        const title = $(el).text().trim();
        if (href) {
          chapters.push({
            id: href,
            title: title,
            url: href,
          });
        }
      });

      res.json(chapters.reverse());
    } catch (error: any) {
      console.error("Manganato Chapters error:", error.message);
      res.status(500).json({ error: "Failed to fetch chapters" });
    }
  });

  app.get("/api/manganato/pages", async (req, res) => {
    try {
      const chapterUrl = req.query.url as string;
      if (!chapterUrl) return res.status(400).json({ error: "URL required" });

      const { data } = await axios.get(chapterUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
      });
      const $ = cheerio.load(data);
      const pages: string[] = [];

      $(".container-chapter-reader img, .v-content img, .container-chapter-reader picture img, .read-container img, .reader-content img").each((_, el) => {
        const src = $(el).attr("data-src") || $(el).attr("src") || $(el).attr("data-original") || $(el).attr("data-url");
        if (src && !src.includes("banner") && !src.includes("logo") && !src.includes("icon")) {
          pages.push(src.trim());
        }
      });

      // Remove duplicates
      const uniquePages = Array.from(new Set(pages));
      res.json(uniquePages);
    } catch (error) {
      console.error("Manganato Pages error:", error);
      res.status(500).json({ error: "Failed to fetch pages" });
    }
  });

  app.get("/api/manganato/image", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).send("URL required");

      const response = await axios.get(url, {
        responseType: "arraybuffer",
        headers: {
          "Referer": "https://chapmanganato.to/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 15000
      });

      res.setHeader("Content-Type", response.headers["content-type"] || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=31536000");
      res.send(response.data);
    } catch (error: any) {
      console.error("Manganato Image Proxy Error:", error.message, "URL:", req.query.url);
      res.status(500).send("Failed to fetch image");
    }
  });

  // MangaKakalot Scraper
  app.get("/api/mangakakalot/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: "Query required" });

      const searchUrl = `https://mangakakalot.com/search/story/${query.replace(/\s+/g, "_")}`;
      const { data } = await axios.get(searchUrl, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://mangakakalot.com/",
          "Cache-Control": "no-cache"
        },
        timeout: 10000
      });
      const $ = cheerio.load(data);
      const results: any[] = [];

      $(".story_item").each((_, el) => {
        const titleEl = $(el).find("h3 a");
        const title = titleEl.text().trim();
        const href = titleEl.attr("href");
        const img = $(el).find("img").attr("src");

        if (href) {
          results.push({
            id: href,
            title: title || "Unknown Title",
            url: href,
            thumbnail: img,
          });
        }
      });

      res.json(results);
    } catch (error: any) {
      console.error("MangaKakalot Search error:", error.message);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Comick API Proxy
  app.get("/api/comick/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const response = await axios.get(`https://api.comick.io/v1.0/search`, {
        params: { q: query, limit: 10 },
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://comick.io/"
        },
        timeout: 10000
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Comick Search error:", error.message);
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.get("/api/comick/chapters", async (req, res) => {
    try {
      const hid = req.query.hid as string;
      const response = await axios.get(`https://api.comick.io/comic/${hid}/chapters`, {
        params: { lang: "en", limit: 1000 }
      });
      res.json(response.data.chapters);
    } catch (error) {
      console.error("Comick Chapters error:", error);
      res.status(500).json({ error: "Failed to fetch chapters" });
    }
  });

  app.get("/api/comick/pages", async (req, res) => {
    try {
      const hid = req.query.hid as string;
      const response = await axios.get(`https://api.comick.io/chapter/${hid}/get_images`);
      const pages = response.data.images.map((img: any) => `https://meo.comick.pictures/${img.url}`);
      res.json(pages);
    } catch (error) {
      console.error("Comick Pages error:", error);
      res.status(500).json({ error: "Failed to fetch pages" });
    }
  });

  app.get("/api/comick/image", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).send("URL required");

      const response = await axios.get(url, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        timeout: 15000
      });

      res.setHeader("Content-Type", response.headers["content-type"] || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=31536000");
      res.send(response.data);
    } catch (error: any) {
      console.error("Comick Image Proxy Error:", error.message, "URL:", req.query.url);
      res.status(500).send("Failed to fetch image");
    }
  });

  app.get("/api/proxy/image", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).send("URL required");

      const urlObj = new URL(url);
      
      // Smart referer selection based on the target image host
      let referer = `${urlObj.protocol}//${urlObj.host}/`;
      if (url.includes("manganato")) referer = "https://chapmanganato.to/";
      if (url.includes("mangakakalot")) referer = "https://mangakakalot.com/";
      if (url.includes("comick")) referer = "https://comick.io/";
      if (url.includes("mangapill")) referer = "https://mangapill.com/";
      if (url.includes("allmanga")) referer = "https://allmanga.to/";
      if (url.includes("aquareader.net")) referer = "https://aquareader.net/";
      if (url.includes("aquamanga")) referer = "https://aquareader.net/";

      const response = await axios.get(url, {
        responseType: "arraybuffer",
        headers: {
          "Referer": referer,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        },
        timeout: 20000
      });

      res.setHeader("Content-Type", response.headers["content-type"] || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=31536000");
      res.send(response.data);
    } catch (error: any) {
      console.error("Universal Image Proxy Error:", error.message, "URL:", req.query.url);
      res.status(500).send("Failed to fetch image");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
