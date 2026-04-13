/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import BottomNav from "./components/BottomNav";
import HomePage from "./pages/Home";
import Explore from "./pages/Explore";
import LibraryPage from "./pages/Library";
import SettingsPage from "./pages/Settings";
import MangaDetails from "./pages/MangaDetails";
import Reader from "./pages/Reader";
import Legal from "./pages/Legal";
import ErrorBoundary from "./components/ErrorBoundary";
import { Manga, Chapter } from "./types";

type ScreenType = "home" | "explore" | "library" | "settings" | "details" | "reader" | "legal";

interface Screen {
  type: ScreenType;
  params?: any;
}

export default function App() {
  const [stack, setStack] = useState<Screen[]>([{ type: "home" }]);
  const [activeTab, setActiveTab] = useState<"home" | "explore" | "library" | "settings">("home");
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [chapterList, setChapterList] = useState<Chapter[]>([]);
  const theme = "dark";

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add("dark");
    root.style.colorScheme = "dark";
    localStorage.setItem("theme", "dark");
  }, []);

  const currentScreen = stack[stack.length - 1];

  const push = useCallback((type: ScreenType, params?: any) => {
    if (params?.manga) setSelectedManga(params.manga);
    if (params?.chapter) setSelectedChapter(params.chapter);
    if (params?.chapters) setChapterList(params.chapters);
    setStack((prev) => [...prev, { type, params }]);
  }, []);

  const pop = useCallback(() => {
    if (stack.length > 1) {
      setStack((prev) => prev.slice(0, -1));
    }
  }, [stack.length]);

  const handleMangaClick = (manga: Manga) => {
    push("details", { manga });
  };

  const handleRead = (manga: Manga, chapter?: Chapter, chapters?: Chapter[]) => {
    if (chapter) {
      push("reader", { manga, chapter, chapters });
    } else {
      push("details", { manga });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
    setStack([{ type: tab as ScreenType }]);
  };

  const renderScreen = (screen: Screen) => {
    switch (screen.type) {
      case "home":
        return (
          <HomePage 
            onMangaClick={handleMangaClick} 
            onRead={handleRead} 
          />
        );
      case "explore":
        return (
          <Explore 
            onMangaClick={handleMangaClick} 
          />
        );
      case "library":
        return (
          <LibraryPage 
            onMangaClick={handleMangaClick} 
          />
        );
      case "details":
        return selectedManga ? (
          <MangaDetails
            manga={selectedManga}
            onBack={pop}
            onChapterClick={handleRead}
          />
        ) : null;
      case "reader":
        return selectedManga && selectedChapter ? (
          <Reader 
            manga={selectedManga} 
            chapter={selectedChapter}
            chapters={chapterList}
            onBack={pop} 
            onChapterChange={(newChapter) => setSelectedChapter(newChapter)}
          />
        ) : null;
      case "settings":
        return (
          <SettingsPage onNavigate={(type, params) => push(type as ScreenType, params)} />
        );
      case "legal":
        return (
          <Legal 
            type={screen.params?.type || "privacy"} 
            onBack={pop} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white font-sans selection:bg-purple-500/30 overflow-hidden transition-colors duration-500">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={`${stack.length}-${selectedManga?.id || ""}-${selectedChapter?.id || ""}`}
          initial={{ x: "100%", opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0.5 }}
          transition={{ 
            type: "spring", 
            damping: 30, 
            stiffness: 300,
            mass: 0.8
          }}
          className="fixed inset-0 bg-white dark:bg-[#0f0f0f] overflow-y-auto"
        >
          <ErrorBoundary>
            {renderScreen(currentScreen)}
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>

      {["home", "explore", "library", "settings"].includes(currentScreen.type) && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  );
}

