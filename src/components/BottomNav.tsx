import { Home, Search, Settings, Library } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "explore", label: "Explore", icon: Search },
    { id: "library", label: "Library", icon: Library },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0f0f0f] border-t border-gray-100 dark:border-white/10 px-6 py-3 flex justify-around items-center z-50 pb-safe transition-colors duration-300">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-purple-600" : "text-gray-400"
            )}
          >
            <Icon size={24} />
            <span className="text-[10px] font-black uppercase tracking-tighter">{tab.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
