import { Manga } from "../types";
import { BookOpen, Info } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface HeroSectionProps {
  manga: Manga;
  onRead: (manga: Manga) => void;
  onViewInfo: (manga: Manga) => void;
}

export default function HeroSection({ manga, onRead, onViewInfo }: HeroSectionProps) {
  return (
    <div className="relative w-full h-[550px] overflow-hidden">
      <img
        src={manga.bannerImage || manga.coverImage}
        alt={manga.title}
        className="w-full h-full object-cover brightness-[0.6] scale-105"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0f0f0f] via-transparent to-transparent" />

      <div className="absolute bottom-12 left-0 right-0 px-8 flex flex-col items-start gap-6">
        <div className="flex flex-col gap-2 max-w-[80%]">
          <div className="flex items-center gap-2">
            <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
              Trending
            </span>
            <span className="text-gray-900/60 dark:text-white/60 text-[10px] font-bold uppercase tracking-widest">
              {manga.type}
            </span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white drop-shadow-sm uppercase tracking-tighter leading-none">
            {manga.title}
          </h1>
          <div 
            className="text-gray-700 dark:text-white/80 text-sm line-clamp-2 font-medium max-w-md"
            dangerouslySetInnerHTML={{ __html: manga.description }}
          />
        </div>

        <div className="flex w-full gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onRead(manga)}
            className="flex-1 bg-purple-600 text-white font-black py-4 rounded-2xl shadow-xl text-sm uppercase tracking-tighter flex items-center justify-center gap-2"
          >
            <BookOpen size={18} fill="currentColor" />
            Read Now
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewInfo(manga)}
            className="flex-1 bg-gray-100 dark:bg-white/10 backdrop-blur-xl text-gray-900 dark:text-white font-black py-4 rounded-2xl shadow-sm text-sm uppercase tracking-tighter flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10"
          >
            <Info size={18} />
            Details
          </motion.button>
        </div>
      </div>
    </div>
  );
}
