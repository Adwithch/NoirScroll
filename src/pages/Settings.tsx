import { 
  Info, 
  ChevronRight,
  FileText,
  Shield,
  Instagram,
  Github,
  ExternalLink,
  BarChart3,
  Clock,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { getStats } from "../services/storage";
import { ReadingStats } from "../types";

interface SettingsProps {
  onNavigate?: (type: string, params?: any) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<"settings" | "stats">("settings");
  const [stats, setStats] = useState<ReadingStats | null>(null);

  useEffect(() => {
    if (activeTab === "stats") {
      setStats(getStats());
    }
  }, [activeTab]);
  
  const sections = [
    {
      title: "Social",
      items: [
        { 
          id: "instagram", 
          label: "Follow A.dwith", 
          icon: Instagram, 
          value: "@a.dwith",
          action: () => window.open("https://www.instagram.com/a.dwith?igsh=MXdyeXU5cDM5YW5oeQ==", "_blank")
        },
        { 
          id: "github", 
          label: "GitHub Profile", 
          icon: Github, 
          value: "adwithch",
          action: () => window.open("http://github.com/adwithch", "_blank")
        },
      ]
    },
    {
      title: "About",
      items: [
        { id: "version", label: "Version", icon: Info, value: "1.0.0 (Build 1)" },
        { 
          id: "privacy", 
          label: "Privacy Policy", 
          icon: Shield,
          action: () => onNavigate?.("legal", { type: "privacy" })
        },
        { 
          id: "tos", 
          label: "Terms of Service", 
          icon: FileText,
          action: () => onNavigate?.("legal", { type: "tos" })
        },
      ]
    }
  ];

  return (
    <div className="pt-12 px-6 pb-32 bg-white dark:bg-[#0f0f0f] min-h-screen transition-colors duration-500">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
          {activeTab === "settings" ? "Settings" : "Statistics"}
        </h1>
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "settings" ? "bg-purple-600 text-white shadow-lg" : "text-gray-400"
            }`}
          >
            General
          </button>
          <button 
            onClick={() => setActiveTab("stats")}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "stats" ? "bg-purple-600 text-white shadow-lg" : "text-gray-400"
            }`}
          >
            Stats
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "settings" ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {/* Instagram Promotion Card */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open("https://www.instagram.com/a.dwith?igsh=MXdyeXU5cDM5YW5oeQ==", "_blank")}
              className="w-full relative overflow-hidden rounded-[2rem] p-6 bg-gradient-to-br from-purple-600 to-pink-500 text-white text-left shadow-xl shadow-purple-500/20"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Instagram size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Connect with Creator</span>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-1">Follow A.dwith</h3>
                <p className="text-xs font-medium opacity-90">Get updates on NoirScroll and more.</p>
              </div>
              <ExternalLink size={64} className="absolute -bottom-4 -right-4 opacity-10 rotate-12" />
            </motion.button>

            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] mb-4 px-1">
                  {section.title}
                </h2>
                <div className="bg-gray-50 dark:bg-white/5 rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm">
                  {section.items.map((item, iIdx) => (
                    <motion.button
                      key={item.id}
                      whileTap={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                      onClick={item.action}
                      className={`w-full flex items-center justify-between p-5 text-left transition-colors active:bg-gray-100 dark:active:bg-white/10 ${
                        iIdx !== section.items.length - 1 ? "border-b border-gray-100 dark:border-white/10" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center text-purple-600 shadow-sm border border-gray-100 dark:border-white/5">
                          <item.icon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {item.label}
                          </p>
                          {item.value && (
                            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">
                              {item.value}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="stats"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-[2rem] border border-gray-200 dark:border-white/10">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-600 mb-4">
                  <BookOpen size={20} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Chapters Read</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                  {stats?.totalChaptersRead || 0}
                </h3>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-[2rem] border border-gray-200 dark:border-white/10">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 mb-4">
                  <Clock size={20} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Time Spent</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                  {stats?.totalTimeSpent ? `${stats.totalTimeSpent}m` : "0m"}
                </h3>
              </div>
            </div>

            {/* Favorite Genres */}
            <div className="bg-gray-50 dark:bg-white/5 p-8 rounded-[2rem] border border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="text-purple-600" size={20} />
                <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Favorite Genres</h2>
              </div>
              <div className="space-y-4">
                {stats && Object.entries(stats.genreCounts).length > 0 ? (
                  Object.entries(stats.genreCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([genre, count]) => {
                      const percentage = Math.round((count / stats.totalChaptersRead) * 100);
                      return (
                        <div key={genre} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-700 dark:text-white/80 uppercase tracking-tight">{genre}</span>
                            <span className="text-[10px] font-black text-purple-600">{count} chs</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className="h-full bg-purple-600 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">No reading data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Card */}
            <div className="bg-purple-600 p-8 rounded-[2rem] text-white shadow-xl shadow-purple-600/20">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 size={20} />
                <h2 className="text-sm font-black uppercase tracking-widest">Activity Status</h2>
              </div>
              <p className="text-xs font-medium opacity-80 leading-relaxed">
                {stats?.totalChaptersRead && stats.totalChaptersRead > 0 
                  ? `You've been quite active! Your last reading session was ${new Date(stats.lastReadAt).toLocaleDateString()}. Keep it up!`
                  : "Start reading to see your activity insights here. NoirScroll tracks your progress automatically."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-12 text-center">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          NoirScroll v1.0.0 • MADE WITH LOVE ❤️ by A.dwith
        </p>
      </div>
    </div>
  );
}
