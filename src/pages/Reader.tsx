import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Manga, Chapter, UserSettings } from "../types";
import { getMangapillPages } from "../services/mangapill";
import { getAquaMangaPages } from "../services/aquamanga";
import { getSettings, saveSettings, saveHistory, updateStats, markChapterAsRead, saveChapterProgress, getChapterProgress } from "../services/storage";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import { 
  TransformWrapper, 
  TransformComponent,
  useTransformContext
} from "react-zoom-pan-pinch";
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Loader2, 
  Maximize2, 
  Minimize2,
  Layout,
  Columns,
  AlignLeft,
  AlignRight,
  Zap,
  CheckCircle2,
  MoreVertical,
  List,
  Share2,
  Download,
  FileDown,
  AlertCircle
} from "lucide-react";
import { cn } from "../lib/utils";

interface ReaderProps {
  manga: Manga;
  chapter: Chapter;
  chapters: Chapter[];
  onBack: () => void;
  onChapterChange: (chapter: Chapter) => void;
}

export default function Reader({ manga, chapter, chapters, onBack, onChapterChange }: ReaderProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [currentPage, setCurrentPage] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [lastTap, setLastTap] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [pullAmount, setPullAmount] = useState(0);
  const [pullType, setPullType] = useState<"next" | "prev" | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [bulkDownloadCount, setBulkDownloadCount] = useState<number | null>(null);
  const startTime = useRef<number>(Date.now());
  const transformRef = useRef<any>(null);

  const [touchStart, setTouchStart] = useState<{ x: number, y: number, time: number } | null>(null);
  const wasPinching = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: any) => {
    if (e.touches.length > 1) {
      wasPinching.current = true;
      setTouchStart(null);
      return;
    }
    wasPinching.current = false;
    if (isZoomed) {
      setTouchStart(null);
      return;
    }
    setTouchStart({ 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY,
      time: Date.now()
    });
  };

  const handleTouchMove = (e: any) => {
    if (e.touches.length > 1) {
      wasPinching.current = true;
      setTouchStart(null);
    }
  };

  const handleTouchEnd = (e: any) => {
    if (!touchStart || isZoomed || wasPinching.current) {
      setTouchStart(null);
      return;
    }
    
    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;
    const dt = Date.now() - touchStart.time;
    
    // Quick swipe detection
    if (dt < 500 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) {
        settings.direction === "ltr" ? handlePrevPage() : handleNextPage();
      } else {
        settings.direction === "ltr" ? handleNextPage() : handlePrevPage();
      }
    }
    setTouchStart(null);
  };

  const downloadChapterAsPDF = async (targetChapter: Chapter, targetPages?: string[]) => {
    try {
      setDownloading(true);
      setDownloadProgress(0);
      
      let pagesToDownload = targetPages || (targetChapter.id === chapter.id ? pages : []);
      
      if (pagesToDownload.length === 0) {
        pagesToDownload = await (targetChapter.source === "mangapill" 
          ? getMangapillPages(targetChapter.id) 
          : getAquaMangaPages(targetChapter.id));
      }

      if (pagesToDownload.length === 0) throw new Error("No pages found");

      const pdf = new jsPDF();
      const total = pagesToDownload.length;

      for (let i = 0; i < total; i++) {
        setDownloadProgress(Math.round(((i + 1) / total) * 100));
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = pagesToDownload[i];
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error(`Failed to load image ${i}`));
        });

        const imgWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (img.height * imgWidth) / img.width;
        
        if (i > 0) pdf.addPage();
        pdf.addImage(img, 'JPEG', 0, 0, imgWidth, imgHeight);
      }

      pdf.save(`${manga.title} - Ch ${targetChapter.chapter}.pdf`);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Download failed. Some images might be protected or unavailable.");
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleBulkDownload = async (count: number) => {
    const currentIndex = chapters.findIndex(c => c.id === chapter.id);
    const chaptersToDownload = chapters.slice(currentIndex, currentIndex + count);
    
    setBulkDownloadCount(null);
    
    for (const ch of chaptersToDownload) {
      await downloadChapterAsPDF(ch);
    }
  };

  useEffect(() => {
    const reset = () => {
      const savedProgress = getChapterProgress(chapter.id);
      
      if (transformRef.current) {
        if (savedProgress > 0 && settings.readingMode === "webtoon") {
          // We'll handle this in the TransformWrapper's onInit or via a separate effect
          // because we need the content to be loaded to calculate the exact Y position
        } else {
          transformRef.current.resetTransform(0);
        }
      }
      window.scrollTo(0, 0);
      if (containerRef.current) containerRef.current.scrollTop = 0;
    };

    reset();
    
    // Small delay to ensure content is rendered and TransformWrapper can calculate bounds
    const timer = setTimeout(reset, 100);
    return () => clearTimeout(timer);
  }, [chapter.id, manga.id]);

  // Fetch pages
  useEffect(() => {
    const fetchPages = async () => {
      setLoading(true);
      setFailedImages(new Set());
      setLoadedImages(new Set());
      setCurrentPage(0);
      startTime.current = Date.now(); // Reset start time for new chapter
      try {
        let pgs: string[] = [];
        if (chapter.source === "aquamanga") {
          pgs = await getAquaMangaPages(chapter.id);
        } else {
          pgs = await getMangapillPages(chapter.id);
        }
        setPages(pgs);
        
        if (pgs.length > 0) {
          // Save to history
          saveHistory({
            mangaId: manga.id,
            manga,
            lastChapterId: chapter.id,
            lastChapterNumber: chapter.chapter,
            scrollPosition: 0,
            updatedAt: Date.now()
          });
        }
      } catch (error) {
        console.error("Error fetching pages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
    
    // Auto-hide controls after 3 seconds
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => {
      clearTimeout(timer);
      // Update stats on unmount or chapter change
      const duration = Math.round((Date.now() - startTime.current) / 60000); // minutes
      if (duration > 0 || pages.length > 0) {
        updateStats(1, duration, manga.genres);
      }
    };
  }, [chapter.id, manga]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      // No longer needed as TransformWrapper handles panning/scrolling
    }
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const nextChapter = chapters[chapters.findIndex(c => c.id === chapter.id) - 1];
  const prevChapter = chapters[chapters.findIndex(c => c.id === chapter.id) + 1];

  const handleNextChapter = () => {
    if (nextChapter) {
      setIsTransitioning(true);
      onChapterChange(nextChapter);
      setTimeout(() => setIsTransitioning(false), 1000);
    }
  };

  const handlePrevChapter = () => {
    if (prevChapter) {
      setIsTransitioning(true);
      onChapterChange(prevChapter);
      setTimeout(() => setIsTransitioning(false), 1000);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
      if (currentPage + 1 >= pages.length * 0.9) {
        markChapterAsRead(manga.id, chapter.id);
      }
    } else if (currentPage === pages.length - 1) {
      setCurrentPage(pages.length);
      markChapterAsRead(manga.id, chapter.id);
    } else if (settings.autoNext) {
      handleNextChapter();
    }
  };

  const handlePrevPage = () => {
    if (currentPage > -1) {
      setCurrentPage(prev => prev - 1);
    } else {
      handlePrevChapter();
    }
  };

  const handleTap = (e: any) => {
    if (settings.readingMode === "webtoon") {
      setShowControls(!showControls);
      return;
    }

    const width = window.innerWidth;
    const x = e.clientX;
    const leftZone = width * 0.3;
    const rightZone = width * 0.7;

    // If zoomed, only allow toggling controls
    if (isZoomed) {
      if (x >= leftZone && x <= rightZone) {
        setShowControls(!showControls);
      }
      return;
    }

    if (x < leftZone) {
      settings.direction === "ltr" ? handlePrevPage() : handleNextPage();
    } else if (x > rightZone) {
      settings.direction === "ltr" ? handleNextPage() : handlePrevPage();
    } else {
      setShowControls(!showControls);
    }
  };

  const handleImageError = (index: number) => {
    const currentUrl = pages[index];
    if (currentUrl && currentUrl.includes("url=") && !currentUrl.includes("/api/proxy/image")) {
      // Try falling back to the universal proxy which uses the URL's own domain as referer
      try {
        const urlParts = currentUrl.split("url=");
        const originalUrl = decodeURIComponent(urlParts[1]);
        const fallbackUrl = `/api/proxy/image?url=${encodeURIComponent(originalUrl)}`;
        
        setPages(prev => {
          const next = [...prev];
          next[index] = fallbackUrl;
          return next;
        });
        return; // Don't mark as failed yet
      } catch (e) {
        console.error("Error creating fallback URL:", e);
      }
    }
    setFailedImages(prev => new Set(prev).add(index));
  };

  const retryImage = (index: number) => {
    setFailedImages(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  // Prevent right-click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-[100] scrollbar-hide select-none transition-colors duration-500 overflow-hidden",
        "bg-white dark:bg-black"
      )}
      onClick={handleTap}
      onContextMenu={(e) => e.preventDefault()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 bg-gradient-to-b from-white dark:from-black/80 to-transparent p-6 flex items-center justify-between z-[110]"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={(e) => { e.stopPropagation(); onBack(); }}
                className="p-2 bg-white dark:bg-black/80 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 shadow-sm"
              >
                <ArrowLeft size={20} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowChapterList(true); }}
                className="flex flex-col text-left group"
              >
                <h1 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter line-clamp-1 max-w-[150px] sm:max-w-[300px] group-hover:text-purple-600 transition-colors">
                  {manga.title}
                </h1>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-white/60 font-bold uppercase tracking-widest group-hover:text-purple-600 transition-colors">
                  Chapter {chapter.chapter}
                  <ChevronRight size={12} className="rotate-90" />
                </div>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (navigator.share) {
                    navigator.share({
                      title: `${manga.title} - Chapter ${chapter.chapter}`,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard!");
                  }
                }}
                className="p-2 bg-white dark:bg-black/80 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 shadow-sm"
              >
                <Share2 size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); downloadChapterAsPDF(chapter); }}
                disabled={downloading}
                className="p-2 bg-white dark:bg-black/80 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 shadow-sm disabled:opacity-50"
              >
                {downloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="p-2 bg-white dark:bg-black/80 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 shadow-sm"
              >
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
                className="p-2 bg-white dark:bg-black/80 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 shadow-sm"
              >
                <Settings size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar (Always visible at top) */}
      {!loading && pages.length > 0 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200/20 dark:bg-white/5 z-[120] pointer-events-none">
          <motion.div 
            className="h-full bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.5)]"
            initial={{ width: 0 }}
            animate={{ 
              width: settings.readingMode === "webtoon" 
                ? `${scrollProgress}%` 
                : `${((currentPage + 1) / pages.length) * 100}%` 
            }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          />
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "flex flex-col items-center w-full mx-auto h-screen",
        settings.readingMode === "webtoon" ? "max-w-3xl" : "justify-center"
      )}>
        {loading ? (
          <div className="h-screen flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-ping" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-gray-400 dark:text-white/40 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
                Initializing NoirScroll...
              </p>
              <p className="text-gray-500 dark:text-white/20 text-[8px] font-bold uppercase tracking-widest">
                Fetching chapter content
              </p>
            </div>
            <button
              onClick={onBack}
              className="mt-4 px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : pages.length === 0 ? (
          <div className="h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
            <Zap className="text-red-500 w-12 h-12" />
            <div className="flex flex-col gap-2">
              <p className="text-gray-900 dark:text-white text-sm font-black uppercase tracking-widest">
                Failed to load chapter
              </p>
              <p className="text-gray-500 dark:text-white/40 text-xs font-medium max-w-xs">
                The content might be unavailable or the provider is currently down.
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-8 py-3 bg-purple-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-600/20"
            >
              Go Back
            </button>
          </div>
        ) : settings.readingMode === "webtoon" ? (
          <div className="relative w-full h-full overflow-hidden">
            {/* Pull Indicators */}
            <AnimatePresence>
              {pullType === "prev" && pullAmount > 10 && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-20 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full bg-white dark:bg-[#1a1a1a] shadow-xl flex items-center justify-center text-purple-600 transition-transform",
                    pullAmount >= 100 ? "scale-110" : "scale-100"
                  )}>
                    <ChevronLeft size={20} className="rotate-90" style={{ transform: `rotate(${90 + (pullAmount * 1.8)}deg)` }} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-white/80 dark:bg-black/80 px-3 py-1 rounded-full backdrop-blur-md shadow-sm border border-purple-600/20">
                    {pullAmount >= 100 ? "Release for Previous" : "Pull for Previous"}
                  </span>
                  {pullAmount >= 100 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-6 h-6 rounded-full border-2 border-purple-600 border-t-transparent animate-spin"
                    />
                  )}
                </motion.div>
              )}
              
              {pullType === "next" && pullAmount > 10 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-white/80 dark:bg-black/80 px-3 py-1 rounded-full backdrop-blur-md shadow-sm border border-purple-600/20">
                    {pullAmount >= 100 ? "Release for Next" : "Pull for Next"}
                  </span>
                  {pullAmount >= 100 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-6 h-6 rounded-full border-2 border-purple-600 border-t-transparent animate-spin"
                    />
                  )}
                  <div className={cn(
                    "w-10 h-10 rounded-full bg-white dark:bg-[#1a1a1a] shadow-xl flex items-center justify-center text-purple-600 transition-transform",
                    pullAmount >= 100 ? "scale-110" : "scale-100"
                  )}>
                    <ChevronRight size={20} className="rotate-90" style={{ transform: `rotate(${90 - (pullAmount * 1.8)}deg)` }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <TransformWrapper
            ref={transformRef}
            key={`webtoon-${chapter.id}`}
            initialScale={1}
            minScale={1}
            maxScale={4}
            centerOnInit={false}
            initialPositionY={0}
            limitToBounds={false}
            centerZoomedOut={true}
            wheel={{ disabled: false, step: 0.2 }}
            panning={{ 
              velocityDisabled: false,
              lockAxisX: !isZoomed,
            }}
            onPanningStop={(ref) => {
              if (pullAmount >= 100) {
                if (pullType === "next") handleNextChapter();
                if (pullType === "prev") handlePrevChapter();
              }
              setPullAmount(0);
              setPullType(null);
              
              // Bounce back if not transitioning
              const content = ref.instance.contentComponent;
              const wrapper = ref.instance.wrapperComponent;
              if (content && wrapper) {
                const totalHeight = content.offsetHeight * ref.state.scale;
                const visibleHeight = wrapper.offsetHeight;
                const maxScroll = -(totalHeight - visibleHeight);
                
                if (ref.state.positionY > 0) {
                  ref.setTransform(ref.state.positionX, 0, ref.state.scale, 200);
                } else if (ref.state.positionY < maxScroll) {
                  ref.setTransform(ref.state.positionX, maxScroll, ref.state.scale, 200);
                }
              }
            }}
            onInit={(ref) => {
              const savedProgress = getChapterProgress(chapter.id);
              if (savedProgress > 0) {
                setTimeout(() => {
                  const content = ref.instance.contentComponent;
                  const wrapper = ref.instance.wrapperComponent;
                  if (content && wrapper) {
                    const totalHeight = content.offsetHeight;
                    const visibleHeight = wrapper.offsetHeight;
                    const maxScroll = totalHeight - visibleHeight;
                    if (maxScroll > 0) {
                      ref.setTransform(0, -(maxScroll * savedProgress), 1, 0);
                    }
                  }
                }, 500); // Give it some time to load images
              }
            }}
            onTransform={(ref) => {
              const zoomed = ref.state.scale > 1.01;
              if (zoomed !== isZoomed) setIsZoomed(zoomed);
              
              const content = ref.instance.contentComponent;
              const wrapper = ref.instance.wrapperComponent;
              if (content && wrapper) {
                const totalHeight = content.offsetHeight * ref.state.scale;
                const visibleHeight = wrapper.offsetHeight;
                const currentY = ref.state.positionY;
                const maxScroll = -(totalHeight - visibleHeight);
                
                if (currentY > 0) {
                  setPullType("prev");
                  setPullAmount(Math.min(100, (currentY / 100) * 100));
                } else if (currentY < maxScroll) {
                  setPullType("next");
                  setPullAmount(Math.min(100, ((maxScroll - currentY) / 100) * 100));
                } else {
                  setPullType(null);
                  setPullAmount(0);
                }

                if (maxScroll < 0) {
                  const progress = Math.abs(currentY) / Math.abs(maxScroll);
                  setScrollProgress(Math.min(100, Math.max(0, progress * 100)));
                  // Save progress
                  if (progress > 0.01) {
                    saveChapterProgress(chapter.id, progress);
                  }
                  // Mark as fully read if progress > 90%
                  if (progress > 0.9) {
                    markChapterAsRead(manga.id, chapter.id);
                  }
                }
              }
            }}
            onPanning={() => {
              if (showControls) setShowControls(false);
            }}
          >
            <TransformComponent 
              wrapperClass="!w-full !h-full" 
              contentClass="!w-full flex flex-col items-center"
            >
              <div className="w-full max-w-3xl flex flex-col items-center bg-white dark:bg-black min-h-full">
                {prevChapter && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePrevChapter(); }}
                    className="w-full py-12 flex flex-col items-center gap-4 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/40 hover:text-purple-600 transition-colors pointer-events-auto"
                  >
                    <ChevronLeft size={24} className="rotate-90" />
                    <span className="text-xs font-black uppercase tracking-widest">Previous Chapter</span>
                  </button>
                )}
                
                {pages.map((page, index) => (
                  <div key={index} className="w-full relative flex items-center justify-center min-h-[400px]">
                    {failedImages.has(index) ? (
                      <div className="w-full aspect-[2/3] flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl m-4 pointer-events-auto">
                        <Zap className="text-red-500" size={32} />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Failed to load page {index + 1}</p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); retryImage(index); }}
                          className="px-4 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <div className="w-full relative">
                        {!loadedImages.has(index) && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-white/5 animate-pulse">
                            <div className="w-12 h-12 rounded-full border-2 border-purple-600/20 border-t-purple-600 animate-spin" />
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Page {index + 1}</p>
                          </div>
                        )}
                        <img
                          src={page}
                          alt={`Page ${index + 1}`}
                          className={cn(
                            "w-full h-auto object-contain block transition-opacity duration-500",
                            loadedImages.has(index) ? "opacity-100" : "opacity-0"
                          )}
                          loading={index < 5 ? "eager" : "lazy"}
                          referrerPolicy="no-referrer"
                          onLoad={() => setLoadedImages(prev => new Set(prev).add(index))}
                          onError={() => handleImageError(index)}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {nextChapter && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleNextChapter(); }}
                    className="w-full py-12 flex flex-col items-center gap-4 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/40 hover:text-purple-600 transition-colors pointer-events-auto"
                  >
                    <span className="text-xs font-black uppercase tracking-widest">Next Chapter</span>
                    <ChevronRight size={24} className="rotate-90" />
                  </button>
                )}
              </div>
            </TransformComponent>
          </TransformWrapper>
        </div>
      ) : (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none">
            {/* Preload adjacent images */}
            {pages[currentPage + 1] && <img src={pages[currentPage + 1]} className="hidden" aria-hidden="true" />}
            {pages[currentPage + 2] && <img src={pages[currentPage + 2]} className="hidden" aria-hidden="true" />}
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: settings.direction === "ltr" ? 100 : -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: settings.direction === "ltr" ? -100 : 100 }}
                transition={{ type: "spring", damping: 30, stiffness: 250 }}
                className="w-full h-full flex items-center justify-center"
              >
                {currentPage === -1 ? (
                  <motion.div 
                    drag="x"
                    dragConstraints={{ left: 0, right: 200 }}
                    onDrag={(e, info) => {
                      const amount = Math.min(100, (info.offset.x / 150) * 100);
                      setPullAmount(amount);
                      setPullType("prev");
                    }}
                    onDragEnd={(e, info) => {
                      if (info.offset.x > 150) handlePrevChapter();
                      setPullAmount(0);
                      setPullType(null);
                    }}
                    className="flex flex-col items-center gap-6 pointer-events-auto"
                  >
                    <div className="relative">
                      <AnimatePresence>
                        {pullAmount > 10 && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-full bg-purple-600 text-white shadow-lg flex items-center justify-center transition-transform",
                              pullAmount >= 100 ? "scale-110" : "scale-100"
                            )}>
                              <ChevronLeft size={20} style={{ transform: `rotate(${pullAmount * 3.6}deg)` }} />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-purple-600 whitespace-nowrap">
                              {pullAmount >= 100 ? "Release for Previous" : "Pull to Previous"}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <p className="text-gray-400 dark:text-white/40 text-xs font-black uppercase tracking-widest">End of previous chapter</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePrevChapter(); }}
                      className="px-8 py-4 bg-purple-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-600/20"
                    >
                      Previous Chapter
                    </button>
                  </motion.div>
                ) : currentPage === pages.length ? (
                  <motion.div 
                    drag="x"
                    dragConstraints={{ left: -200, right: 0 }}
                    onDrag={(e, info) => {
                      const amount = Math.min(100, (Math.abs(info.offset.x) / 150) * 100);
                      setPullAmount(amount);
                      setPullType("next");
                    }}
                    onDragEnd={(e, info) => {
                      if (info.offset.x < -150) handleNextChapter();
                      setPullAmount(0);
                      setPullType(null);
                    }}
                    className="flex flex-col items-center gap-6 pointer-events-auto"
                  >
                    <div className="relative">
                      <AnimatePresence>
                        {pullAmount > 10 && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-full bg-purple-600 text-white shadow-lg flex items-center justify-center transition-transform",
                              pullAmount >= 100 ? "scale-110" : "scale-100"
                            )}>
                              <ChevronRight size={20} style={{ transform: `rotate(${-pullAmount * 3.6}deg)` }} />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-purple-600 whitespace-nowrap">
                              {pullAmount >= 100 ? "Release for Next" : "Pull to Next"}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <p className="text-gray-400 dark:text-white/40 text-xs font-black uppercase tracking-widest">You've reached the end</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleNextChapter(); }}
                      className="px-8 py-4 bg-purple-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-600/20"
                    >
                      Next Chapter
                    </button>
                  </motion.div>
                ) : failedImages.has(currentPage) ? (
                  <div className="w-full max-w-md aspect-[2/3] flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl pointer-events-auto">
                    <Zap className="text-red-500" size={32} />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Failed to load page {currentPage + 1}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); retryImage(currentPage); }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TransformWrapper
                      key={`${chapter.id}-${currentPage}`}
                      initialScale={1}
                      minScale={1}
                      maxScale={4}
                      centerOnInit
                      wheel={{ disabled: true }}
                      panning={{ 
                        velocityDisabled: false,
                      }}
                      onTransform={(ref) => {
                        const zoomed = ref.state.scale > 1.05;
                        if (zoomed !== isZoomed) setIsZoomed(zoomed);
                      }}
                    >
                      <TransformComponent 
                        wrapperClass="!w-full !h-full" 
                        contentClass="!w-full !h-full flex items-center justify-center"
                      >
                        <div className="relative w-full h-full flex items-center justify-center">
                          {!loadedImages.has(currentPage) && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-white/5 animate-pulse">
                              <div className="w-12 h-12 rounded-full border-2 border-purple-600/20 border-t-purple-600 animate-spin" />
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Page {currentPage + 1}</p>
                            </div>
                          )}
                          <img
                            src={pages[currentPage]}
                            alt={`Page ${currentPage + 1}`}
                            className={cn(
                              "max-w-full max-h-full object-contain pointer-events-auto transition-opacity duration-500",
                              loadedImages.has(currentPage) ? "opacity-100" : "opacity-0"
                            )}
                            referrerPolicy="no-referrer"
                            onLoad={() => setLoadedImages(prev => new Set(prev).add(currentPage))}
                            onError={() => handleImageError(currentPage)}
                            onDragStart={(e) => e.preventDefault()}
                          />
                        </div>
                      </TransformComponent>
                    </TransformWrapper>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            
            {/* Page Indicator */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest z-[110]">
              {currentPage === -1 ? "START" : currentPage === pages.length ? "END" : `${currentPage + 1} / ${pages.length}`}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <AnimatePresence>
        {showControls && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-black/80 to-transparent p-8 flex flex-col items-center gap-4 z-[110] pointer-events-none"
          >
            <div className="flex items-center justify-center gap-8 pointer-events-auto">
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrevChapter(); }}
                disabled={!prevChapter}
                className={cn(
                  "p-3 rounded-2xl transition-colors",
                  prevChapter ? "text-gray-900 dark:text-white hover:bg-purple-600/10" : "text-gray-300 dark:text-white/10 cursor-not-allowed"
                )}
              >
                <ChevronLeft size={32} />
              </button>
              
              <div className="bg-white dark:bg-black/80 px-6 py-2 rounded-full border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs font-black uppercase tracking-widest shadow-sm">
                Chapter {chapter.chapter}
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); handleNextChapter(); }}
                disabled={!nextChapter}
                className={cn(
                  "p-3 rounded-2xl transition-colors",
                  nextChapter ? "text-gray-900 dark:text-white hover:bg-purple-600/10" : "text-gray-300 dark:text-white/10 cursor-not-allowed"
                )}
              >
                <ChevronRight size={32} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div 
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60"
            onClick={(e) => { e.stopPropagation(); setShowSettings(false); }}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full max-w-md bg-white dark:bg-[#111] rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Reader Settings</h2>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <Maximize2 size={20} className="rotate-45" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Reading Mode */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Reading Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => updateSetting("readingMode", "webtoon")}
                      className={cn(
                        "flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all",
                        settings.readingMode === "webtoon" 
                          ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20" 
                          : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-500 dark:text-white/40"
                      )}
                    >
                      <Layout size={18} />
                      <span className="text-xs font-black uppercase tracking-tighter">Webtoon</span>
                    </button>
                    <button 
                      onClick={() => updateSetting("readingMode", "manga")}
                      className={cn(
                        "flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all",
                        settings.readingMode === "manga" 
                          ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20" 
                          : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-500 dark:text-white/40"
                      )}
                    >
                      <Columns size={18} />
                      <span className="text-xs font-black uppercase tracking-tighter">Manga</span>
                    </button>
                  </div>
                </div>

                {/* Direction (Only for Manga mode) */}
                {settings.readingMode === "manga" && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Direction</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => updateSetting("direction", "ltr")}
                        className={cn(
                          "flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all",
                          settings.direction === "ltr" 
                            ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20" 
                            : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-500 dark:text-white/40"
                        )}
                      >
                        <AlignLeft size={18} />
                        <span className="text-xs font-black uppercase tracking-tighter">LTR</span>
                      </button>
                      <button 
                        onClick={() => updateSetting("direction", "rtl")}
                        className={cn(
                          "flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all",
                          settings.direction === "rtl" 
                            ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20" 
                            : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-500 dark:text-white/40"
                        )}
                      >
                        <AlignRight size={18} />
                        <span className="text-xs font-black uppercase tracking-tighter">RTL</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Auto Next */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <Zap size={18} className="text-purple-600" />
                    <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">Auto Next Chapter</span>
                  </div>
                  <button 
                    onClick={() => updateSetting("autoNext", !settings.autoNext)}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                      settings.autoNext ? "bg-purple-600" : "bg-gray-300 dark:bg-white/10"
                    )}
                  >
                    <motion.div 
                      animate={{ x: settings.autoNext ? 24 : 0 }}
                      className="w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chapter List Modal */}
      <AnimatePresence>
        {bulkDownloadCount !== null && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-xs bg-white dark:bg-[#111] rounded-[2rem] p-8 shadow-2xl border border-gray-100 dark:border-white/10"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 rounded-full bg-purple-600/10 flex items-center justify-center text-purple-600">
                  <FileDown size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Bulk Download</h3>
                  <p className="text-xs font-medium text-gray-500 dark:text-white/40">How many chapters would you like to download starting from the current one?</p>
                </div>
                <div className="grid grid-cols-3 gap-3 w-full">
                  {[3, 5, 10, 15, 20, 50].map(num => (
                    <button
                      key={num}
                      onClick={() => handleBulkDownload(num)}
                      className="py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-black text-gray-900 dark:text-white hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all"
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setBulkDownloadCount(null)}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/20 hover:text-red-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {downloading && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-xs bg-white dark:bg-[#111] rounded-[2rem] p-8 shadow-2xl border border-gray-100 dark:border-white/10"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black text-purple-600">{downloadProgress}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Downloading...</h3>
                  <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest animate-pulse">Generating PDF</p>
                  <p className="text-[9px] font-medium text-gray-400 dark:text-white/20">Please don't close the app while we prepare your file.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showChapterList && (
          <div 
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60"
            onClick={(e) => { e.stopPropagation(); setShowChapterList(false); }}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full max-w-md bg-white dark:bg-[#111] rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <List size={20} className="text-purple-600" />
                  <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Chapters</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setBulkDownloadCount(5)}
                    className="p-2 text-purple-600 hover:bg-purple-600/10 rounded-xl transition-colors"
                    title="Bulk Download"
                  >
                    <FileDown size={20} />
                  </button>
                  <button onClick={() => setShowChapterList(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <Maximize2 size={20} className="rotate-45" />
                  </button>
                </div>
              </div>

              <div className="mb-4 flex-shrink-0">
                <input 
                  type="text"
                  placeholder="Search chapter..."
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-purple-600 transition-colors"
                />
              </div>

              <div className="overflow-y-auto space-y-1 pr-2 custom-scrollbar flex-1 overscroll-contain">
                {chapters
                  .filter(ch => ch.chapter.toLowerCase().includes(chapterSearch.toLowerCase()) || (ch.title && ch.title.toLowerCase().includes(chapterSearch.toLowerCase())))
                  .slice(0, 100) // Only show first 100 matches for performance
                  .map((ch) => (
                    <ChapterItem 
                      key={ch.id} 
                      ch={ch} 
                      currentId={chapter.id} 
                      onClick={() => {
                        onChapterChange(ch);
                        setShowChapterList(false);
                        setChapterSearch("");
                      }} 
                    />
                  ))}
                {chapters.length > 100 && !chapterSearch && (
                  <div className="text-[10px] text-gray-400 dark:text-white/20 mt-4 text-center font-bold uppercase tracking-widest">
                    Showing first 100 of {chapters.length} chapters. Use search to find more.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center gap-6"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-purple-600/20 border-t-purple-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="text-purple-600 animate-pulse" size={32} />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Loading Chapter</h2>
              <p className="text-xs font-medium text-white/40 uppercase tracking-widest">NoirScroll is fetching the next adventure...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Separate component for chapter item to prevent re-rendering the whole list
const ChapterItem = memo(({ ch, currentId, onClick }: { ch: Chapter, currentId: string, onClick: () => void }) => {
  const isActive = ch.id === currentId;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
        isActive 
          ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20" 
          : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-900 dark:text-white"
      )}
    >
      <div className="flex flex-col">
        <span className="text-[11px] font-black uppercase tracking-tighter">Chapter {ch.chapter}</span>
        {ch.title && <span className={cn("text-[9px] font-medium line-clamp-1", isActive ? "text-white/80" : "text-gray-500 dark:text-white/40")}>{ch.title}</span>}
      </div>
      {isActive && <CheckCircle2 size={14} />}
    </button>
  );
});
