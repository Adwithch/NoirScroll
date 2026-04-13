import { useState, useEffect } from "react";
import { Manga, Bookmark, ReadingHistory } from "../types";
import { getBookmarks, getHistory, updateBookmarkTags } from "../services/storage";
import MediaCard from "../components/MediaCard";
import { Library, Clock, Heart, Tag, Plus, X, Search, FolderHeart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface LibraryProps {
  onMangaClick: (manga: Manga) => void;
}

export default function LibraryPage({ onMangaClick }: LibraryProps) {
  const [activeTab, setActiveTab] = useState<"favorites" | "recent">("favorites");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [mangaForTag, setMangaForTag] = useState<Bookmark | null>(null);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    setBookmarks(getBookmarks());
    setHistory(getHistory());
  }, []);

  const allTags = Array.from(new Set(bookmarks.flatMap(b => b.tags || [])));

  const filteredBookmarks = bookmarks.filter(b => 
    selectedTags.length === 0 || selectedTags.every(t => b.tags?.includes(t))
  );

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddTag = () => {
    if (mangaForTag && newTag.trim()) {
      const currentTags = mangaForTag.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        const updatedTags = [...currentTags, newTag.trim()];
        updateBookmarkTags(mangaForTag.mangaId, updatedTags);
        setBookmarks(getBookmarks());
      }
      setNewTag("");
    }
  };

  const handleRemoveTag = (mangaId: string | number, tag: string) => {
    const bookmark = bookmarks.find(b => b.mangaId === mangaId);
    if (bookmark) {
      const updatedTags = (bookmark.tags || []).filter(t => t !== tag);
      updateBookmarkTags(mangaId, updatedTags);
      setBookmarks(getBookmarks());
    }
  };

  return (
    <div className="pt-12 px-6 pb-32 bg-white dark:bg-[#0f0f0f] min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
          Library
        </h1>
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab("favorites")}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === "favorites" ? "bg-purple-600 text-white shadow-lg" : "text-gray-400"
            )}
          >
            Favorites
          </button>
          <button 
            onClick={() => setActiveTab("recent")}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === "recent" ? "bg-purple-600 text-white shadow-lg" : "text-gray-400"
            )}
          >
            Recent
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "favorites" ? (
          <motion.div
            key="favorites"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
                <button
                  onClick={() => setSelectedTags([])}
                  className={cn(
                    "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                    selectedTags.length === 0 
                      ? "bg-purple-600 border-purple-600 text-white" 
                      : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-400"
                  )}
                >
                  All
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className={cn(
                      "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                      selectedTags.includes(tag)
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-400"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {filteredBookmarks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredBookmarks.map((bookmark, index) => (
                  <div key={bookmark.mangaId} className="relative group">
                    <MediaCard
                      manga={bookmark.manga}
                      onClick={onMangaClick}
                      variant="recommended"
                      index={index}
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setMangaForTag(bookmark);
                          setIsTagModalOpen(true);
                        }}
                        className="p-2 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-purple-600 transition-colors shadow-lg"
                        title="Manage Tags"
                      >
                        <Tag size={14} />
                      </button>
                    </div>
                    {bookmark.tags && bookmark.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {bookmark.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-purple-600/10 text-purple-600 text-[8px] font-black uppercase tracking-widest rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-300 dark:text-white/10">
                  <FolderHeart size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">No favorites yet</p>
                  <p className="text-xs text-gray-500 dark:text-white/40 font-medium">Start exploring and bookmark your favorite manga!</p>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="recent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {history.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {history.map((item, index) => (
                  <div key={item.mangaId} className="flex flex-col gap-2">
                    <MediaCard
                      manga={item.manga}
                      onClick={onMangaClick}
                      variant="recommended"
                      index={index}
                    />
                    <div className="flex items-center gap-2 text-[9px] font-black text-purple-600 uppercase tracking-widest">
                      <Clock size={10} />
                      Ch. {item.lastChapterNumber}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-300 dark:text-white/10">
                  <Clock size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">No history yet</p>
                  <p className="text-xs text-gray-500 dark:text-white/40 font-medium">Your recently read manga will appear here.</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tag Management Modal */}
      <AnimatePresence>
        {isTagModalOpen && mangaForTag && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-[#111] rounded-[2rem] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Manage Tags</h3>
                <button onClick={() => setIsTagModalOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {mangaForTag.tags?.map(tag => (
                    <span key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">
                      {tag}
                      <button onClick={() => handleRemoveTag(mangaForTag.mangaId, tag)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add new tag (e.g. Finished)"
                    className="flex-1 bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:ring-2 focus:ring-purple-600"
                  />
                  <button 
                    onClick={handleAddTag}
                    className="p-2 bg-purple-600 text-white rounded-xl"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quick Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {["Plan to Read", "Reading", "Finished", "On Hold", "Dropped", "Masterpiece"].map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          setNewTag(tag);
                          // We need to wait for state update or just call add directly
                          const currentTags = mangaForTag.tags || [];
                          if (!currentTags.includes(tag)) {
                            updateBookmarkTags(mangaForTag.mangaId, [...currentTags, tag]);
                            setBookmarks(getBookmarks());
                            setMangaForTag(prev => prev ? { ...prev, tags: [...currentTags, tag] } : null);
                          }
                        }}
                        className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 hover:bg-purple-600/10 hover:text-purple-600 text-[10px] font-bold text-gray-500 dark:text-white/40 rounded-xl transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
