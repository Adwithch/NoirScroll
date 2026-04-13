import { useState, useEffect } from "react";
import { Manga, Chapter } from "../types";
import { searchMangapillManga, getMangapillChapters } from "../services/mangapill";
import { searchAquaManga, getAquaMangaChapters } from "../services/aquamanga";
import { toggleBookmark, getBookmarks, getHistory, getReadChapters } from "../services/storage";
import { motion } from "motion/react";
import { ArrowLeft, BookOpen, Star, Clock, List, Loader2, Heart, Sparkles, Search } from "lucide-react";
import { cn } from "../lib/utils";

interface MangaDetailsProps {
  manga: Manga;
  onBack: () => void;
  onChapterClick: (manga: Manga, chapter: Chapter, chapters: Chapter[]) => void;
}

export default function MangaDetails({ manga, onBack, onChapterClick }: MangaDetailsProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSource, setActiveSource] = useState<"mangapill" | "aquamanga">("aquamanga");
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [lastRead, setLastRead] = useState<any>(null);
  const [chapterSearch, setChapterSearch] = useState("");
  const [readChapters, setReadChapters] = useState<string[]>([]);

  useEffect(() => {
    const bookmarks = getBookmarks();
    setIsBookmarked(bookmarks.some((b: any) => b.mangaId === manga.id));

    const history = getHistory();
    const item = history.find((h: any) => h.mangaId === manga.id);
    setLastRead(item);

    setReadChapters(getReadChapters(manga.id));

    const fetchChapters = async () => {
      setLoading(true);
      setChapters([]);
      
      try {
        const searchPromises = [
          searchAquaManga(manga.title).then(res => ({ source: "aquamanga", data: res })),
          searchMangapillManga(manga.title).then(res => ({ source: "mangapill", data: res })),
        ];

        const searchResults = await Promise.allSettled(searchPromises);
        
        const validResults = searchResults
          .filter(r => r.status === "fulfilled" && r.value.data)
          .map(r => (r as any).value);

        if (validResults.length > 0) {
          // Fetch chapters for all available sources to compare counts
          const chapterPromises = validResults.map(async (res) => {
            try {
              if (res.source === "aquamanga" && res.data?.[0]) {
                const data = await getAquaMangaChapters(res.data[0].url);
                return { source: "aquamanga", chapters: data.chapters };
              } else if (res.source === "mangapill" && res.data) {
                const data = await getMangapillChapters(res.data.url);
                return { source: "mangapill", chapters: data.chapters };
              }
            } catch (e) {
              return null;
            }
            return null;
          });

          const chapterResults = (await Promise.all(chapterPromises)).filter(r => r !== null) as { source: string, chapters: Chapter[] }[];
          
          if (chapterResults.length > 0) {
            // Sort by chapter count descending
            chapterResults.sort((a, b) => b.chapters.length - a.chapters.length);
            
            setAvailableSources(chapterResults.map(r => r.source));
            setActiveSource(chapterResults[0].source as any);
            setChapters(chapterResults[0].chapters);
          }
        }
      } catch (error) {
        console.error("Error fetching chapters:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [manga.title]);

  const filteredChapters = chapters.filter(c => 
    c.chapter.toLowerCase().includes(chapterSearch.toLowerCase()) || 
    (c.title && c.title.toLowerCase().includes(chapterSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] pb-32">
      <div className="relative h-[40vh] w-full">
        <img
          src={manga.bannerImage || manga.coverImage}
          alt={manga.title}
          className="w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0f0f0f] to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-12 left-6 p-3 bg-white/80 dark:bg-black/20 backdrop-blur-xl rounded-2xl text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 shadow-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={() => {
            const newState = toggleBookmark(manga);
            setIsBookmarked(newState);
          }}
          className={`absolute top-12 right-6 p-3 backdrop-blur-xl rounded-2xl border shadow-lg transition-all ${
            isBookmarked 
              ? "bg-purple-600 border-purple-600 text-white" 
              : "bg-white/80 dark:bg-black/20 text-gray-900 dark:text-white border-gray-200 dark:border-white/10"
          }`}
        >
          <Heart size={20} className={isBookmarked ? "fill-white" : ""} />
        </button>
      </div>

      <div className="px-6 -mt-32 relative z-10">
        <div className="flex gap-6">
          <div className="w-32 sm:w-40 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-[#0f0f0f] flex-shrink-0">
            <img src={manga.coverImage} alt={manga.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col justify-end pb-4 gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                {manga.format}
              </span>
              <span className="text-gray-500 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest">
                {manga.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
              {manga.title}
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-black text-gray-900 dark:text-white">
                  {manga.averageScore ? (manga.averageScore / 10).toFixed(1) : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-500 dark:text-white/40">
                <Clock size={14} />
                <span className="text-xs font-bold uppercase tracking-tighter">
                  {manga.startDate || "Unknown"}
                </span>
              </div>
            </div>
            {lastRead && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const ch = chapters.find(c => c.id === lastRead.lastChapterId);
                  if (ch) onChapterClick(manga, ch, chapters);
                }}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-600/20 w-fit"
              >
                <BookOpen size={14} />
                Continue Ch. {lastRead.lastChapterNumber}
              </motion.button>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <BookOpen size={16} className="text-purple-600" />
              Synopsis
            </h2>
            <div 
              className="text-gray-600 dark:text-white/60 text-sm leading-relaxed font-medium"
              dangerouslySetInnerHTML={{ __html: manga.description }}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <List size={16} className="text-purple-600" />
                  Chapters
                </h2>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {chapters.length} Available
                </span>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  placeholder="Search chapters..."
                  className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-2xl py-3 pl-10 pr-4 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:ring-2 focus:ring-purple-600 transition-all font-medium"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/20" size={16} />
              </div>
            </div>

            {availableSources.length > 0 && (
              <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center gap-2 text-gray-400 dark:text-white/20">
                  <Sparkles size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Select Provider</span>
                </div>
                <div className="flex flex-wrap bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl w-fit">
                  {availableSources.map(src => (
                    <button
                      key={src}
                      onClick={async () => {
                        if (src === activeSource && chapters.length > 0) return;
                        setLoading(true);
                        setActiveSource(src as any);
                        try {
                          let chs: Chapter[] = [];
                          if (src === "aquamanga") {
                            const results = await searchAquaManga(manga.title);
                            if (results?.[0]) {
                              const res = await getAquaMangaChapters(results[0].url);
                              chs = res.chapters;
                            }
                          } else {
                            const mpManga = await searchMangapillManga(manga.title);
                            if (mpManga) {
                              const res = await getMangapillChapters(mpManga.url);
                              chs = res.chapters;
                            }
                          }
                          setChapters(chs);
                        } catch (err) {
                          console.error("Error switching source:", err);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeSource === src 
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                          : "text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      {src === "aquamanga" ? "Aqua" : "Pill"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-6">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-ping" />
                    </div>
                  </div>
                  <p className="text-gray-400 dark:text-white/40 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
                    Loading NoirScroll...
                  </p>
                </div>
              ) : filteredChapters.length > 0 ? (
                filteredChapters.map((chapter) => (
                  <motion.button
                    key={chapter.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onChapterClick(manga, chapter, chapters)}
                    className={cn(
                      "flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-purple-600/50 transition-colors group",
                      readChapters.includes(chapter.id) && "opacity-60"
                    )}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className={cn(
                        "text-xs font-black uppercase tracking-tighter",
                        readChapters.includes(chapter.id) ? "text-gray-400 dark:text-white/30" : "text-gray-900 dark:text-white"
                      )}>
                        Chapter {chapter.chapter}
                      </span>
                      {chapter.title && (
                        <span className={cn(
                          "text-[10px] font-medium line-clamp-1",
                          readChapters.includes(chapter.id) ? "text-gray-400/60 dark:text-white/20" : "text-gray-500 dark:text-white/40"
                        )}>
                          {chapter.title}
                        </span>
                      )}
                    </div>
                    <div className={cn(
                      "p-2 rounded-xl transition-colors",
                      readChapters.includes(chapter.id) 
                        ? "bg-gray-200 dark:bg-white/5 text-gray-400 dark:text-white/20" 
                        : "bg-purple-600/10 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
                    )}>
                      <BookOpen size={16} />
                    </div>
                  </motion.button>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                  <p className="text-gray-400 text-sm font-medium">
                    {chapterSearch ? `No chapters matching "${chapterSearch}"` : `No chapters found on ${activeSource}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
