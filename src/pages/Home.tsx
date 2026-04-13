import { useState, useEffect } from "react";
import { Manga, ReadingHistory, Bookmark } from "../types";
import { fetchAniListManga } from "../services/anilist";
import { getHistory, getBookmarks } from "../services/storage";
import HeroSection from "../components/HeroSection";
import MediaCard from "../components/MediaCard";
import { Loader2, Sparkles, TrendingUp, LayoutGrid, Moon, Sun, Clock, Heart } from "lucide-react";
import { motion } from "motion/react";

interface HomeProps {
  onMangaClick: (manga: Manga) => void;
  onRead: (manga: Manga) => void;
}

export default function Home({ onMangaClick, onRead }: HomeProps) {
  const [trending, setTrending] = useState<Manga[]>([]);
  const [popularList, setPopularList] = useState<Manga[]>([]);
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    try {
      // Load local data
      setHistory(getHistory());
      setBookmarks(getBookmarks());

      // Fetch trending (mix of all formats)
      const { manga: trendingData } = await fetchAniListManga({ 
        perPage: 10,
        format: ["MANGA", "ONE_SHOT"] 
      });
      
      // Fetch popular (mix of all formats)
      const { manga: popularData } = await fetchAniListManga({ 
        perPage: 24,
        page: 2 
      });

      if (trendingData.length === 0 && popularData.length === 0 && retryCount < 2) {
        console.log(`No results, retrying... (${retryCount + 1})`);
        setTimeout(() => loadData(retryCount + 1), 1000);
        return;
      }

      setTrending(trendingData);
      setPopularList(popularData);
    } catch (err) {
      console.error("Error loading home data:", err);
      if (retryCount < 2) {
        setTimeout(() => loadData(retryCount + 1), 1000);
      } else {
        setError("Failed to load content. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && trending.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-[#0f0f0f]">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
        <p className="text-purple-600 font-black uppercase tracking-tighter animate-pulse">
          Loading NoirScroll...
        </p>
      </div>
    );
  }

  if (error && trending.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-[#0f0f0f] px-6 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-2">
          <Sparkles className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Oops! Something went wrong</h2>
        <p className="text-gray-500 dark:text-white/60 text-sm max-w-xs">{error}</p>
        <button 
          onClick={() => loadData()}
          className="mt-4 px-8 py-3 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32 relative bg-white dark:bg-[#0f0f0f]">
      <div className="absolute top-8 left-8 z-50">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
          Noir<span className="text-purple-600">Scroll</span>
        </h1>
      </div>

      {trending.length > 0 && (
        <HeroSection 
          manga={trending[0]} 
          onRead={onRead} 
          onViewInfo={onMangaClick} 
        />
      )}

      <div className="px-6 mt-12 flex flex-col gap-12">
        {/* Continue Reading Section */}
        {history.length > 0 && (
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="text-purple-600" size={20} />
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                  Continue Reading
                </h2>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
              {history.map((item, index) => (
                <MediaCard
                  key={item.mangaId}
                  manga={item.manga}
                  onClick={onMangaClick}
                  variant="trending"
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {/* Favorites Section */}
        {bookmarks.length > 0 && (
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="text-purple-600" size={20} />
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                  Your Favorites
                </h2>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
              {bookmarks.map((item, index) => (
                <MediaCard
                  key={item.mangaId}
                  manga={item.manga}
                  onClick={onMangaClick}
                  variant="trending"
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {/* Trending Section */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-purple-600" size={20} />
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                Trending Now
              </h2>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
            {trending.slice(1).map((manga, index) => (
              <MediaCard
                key={manga.id}
                manga={manga}
                onClick={onMangaClick}
                variant="trending"
                index={index}
              />
            ))}
          </div>
        </section>

        {/* Popular Section */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="text-purple-600" size={20} />
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                Most Popular
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {popularList.map((manga, index) => (
              <MediaCard
                key={manga.id}
                manga={manga}
                onClick={onMangaClick}
                variant="recommended"
                index={index}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Legal Footer */}
      <div className="mt-20 px-6 py-12 border-t border-gray-100 dark:border-white/5 text-center">
        <p className="text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em] mb-4">
          NoirScroll • Content Aggregator
        </p>
        <p className="text-[9px] font-bold text-gray-400 dark:text-white/20 max-w-xs mx-auto leading-relaxed uppercase tracking-widest">
          We do not host any content. All images are provided by third-party sources.
        </p>
      </div>
    </div>
  );
}
