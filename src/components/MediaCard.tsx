import React from "react";
import { Manga } from "../types";
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import { Star, BookOpen } from "lucide-react";

interface MediaCardProps {
  key?: React.Key;
  manga: Manga;
  onClick: (manga: Manga) => void;
  variant?: "trending" | "recommended" | "search";
  index?: number;
}

export default function MediaCard({ manga, onClick, variant = "trending", index }: MediaCardProps) {
  const isTrending = variant === "trending";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index ? Math.min(index * 0.05, 0.3) : 0,
        ease: [0.23, 1, 0.32, 1]
      }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(manga)}
      className={cn(
        "flex-shrink-0 cursor-pointer group",
        isTrending ? "w-[140px]" : "w-full"
      )}
    >
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-white/5">
        <img
          src={manga.coverImage}
          alt={manga.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {manga.averageScore && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-black text-white">
              {(manga.averageScore / 10).toFixed(1)}
            </span>
          </div>
        )}

        {isTrending && index !== undefined && (
          <div className="absolute -bottom-2 -left-2 text-6xl font-black text-white/20 italic select-none pointer-events-none">
            {index + 1}
          </div>
        )}
      </div>
      <div className="mt-3 px-1">
        <h3 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 transition-colors">
          {manga.title}
        </h3>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium uppercase tracking-wider">
          {manga.chapters ? `${manga.chapters} Chapters` : manga.status}
        </p>
      </div>
    </motion.div>
  );
}
