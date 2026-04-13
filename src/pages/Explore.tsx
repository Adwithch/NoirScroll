import { useState } from "react";
import { Manga } from "../types";
import { searchMangaWithGemini } from "../services/geminiService";
import { fetchAniListManga } from "../services/anilist";
import MediaCard from "../components/MediaCard";
import { Search, Loader2, Sparkles, TrendingUp, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ExploreProps {
  onMangaClick: (manga: Manga) => void;
}

export default function Explore({ onMangaClick }: ExploreProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: any, retryCount = 0) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      // Use AniList for accurate data search
      const { manga: anilistData } = await fetchAniListManga({ 
        search: query,
        perPage: 20
      });
      
      if (anilistData.length === 0 && retryCount < 2) {
        console.log(`No search results, retrying... (${retryCount + 1})`);
        setTimeout(() => handleSearch(null, retryCount + 1), 1000);
        return;
      }

      setResults(anilistData);
    } catch (error) {
      console.error("Search error:", error);
      if (retryCount < 2) {
        setTimeout(() => handleSearch(null, retryCount + 1), 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenreSearch = async (genre: string, retryCount = 0) => {
    setLoading(true);
    setHasSearched(true);
    setQuery(genre);
    try {
      const { manga } = await fetchAniListManga({ genre, perPage: 20 });
      if (manga.length === 0 && retryCount < 2) {
        setTimeout(() => handleGenreSearch(genre, retryCount + 1), 1000);
        return;
      }
      setResults(manga);
    } catch (error) {
      console.error("Genre fetch error:", error);
      if (retryCount < 2) {
        setTimeout(() => handleGenreSearch(genre, retryCount + 1), 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 pt-12 pb-32">
      <div className="flex flex-col gap-8">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
              Explore
            </h1>
            <p className="text-gray-500 dark:text-white/40 text-sm font-medium uppercase tracking-widest">
              Discover your next obsession
            </p>
          </div>
        </div>

        <form onSubmit={(e) => handleSearch(e)} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manga, webtoons, or authors..."
            className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:ring-2 focus:ring-purple-600 transition-all font-medium"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/20" size={20} />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-purple-700 transition-colors"
          >
            Search
          </button>
        </form>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              <div className="flex items-center gap-2 text-purple-600 font-black uppercase tracking-tighter animate-pulse">
                <Sparkles size={18} />
                NoirScroll is searching...
              </div>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
            >
              {results.map((item, index) => (
                <MediaCard
                  key={item.id}
                  manga={item}
                  onClick={onMangaClick}
                  variant="search"
                  index={index}
                />
              ))}
            </motion.div>
          ) : hasSearched ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-gray-500 dark:text-white/40 font-black uppercase tracking-tighter">
                No results found for "{query}"
              </p>
            </motion.div>
          ) : (
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-white/20">
                    <TrendingUp size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Trending Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Solo Leveling", "One Piece", "Tower of God", "Berserk", "Lore Olympus"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setQuery(tag);
                          handleSearch(null);
                        }}
                        className="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-white/60 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-white/20">
                    <Sparkles size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Browse Genres</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"].map((genre) => (
                      <button
                        key={genre}
                        onClick={() => handleGenreSearch(genre)}
                        className="flex items-center justify-center p-4 bg-gray-100 dark:bg-white/5 hover:bg-purple-600 hover:text-white rounded-2xl text-xs font-black uppercase tracking-tighter transition-all group"
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
