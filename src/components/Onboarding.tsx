import { motion } from "motion/react";

interface OnboardingProps {
  onContinue: () => void;
}

const MANGA_COVERS = [
  "https://picsum.photos/seed/manga1/200/300",
  "https://picsum.photos/seed/manga2/200/300",
  "https://picsum.photos/seed/manga3/200/300",
  "https://picsum.photos/seed/manga4/200/300",
  "https://picsum.photos/seed/manga5/200/300",
  "https://picsum.photos/seed/manga6/200/300",
  "https://picsum.photos/seed/manga7/200/300",
  "https://picsum.photos/seed/manga8/200/300",
  "https://picsum.photos/seed/manga9/200/300",
];

export default function Onboarding({ onContinue }: OnboardingProps) {
  return (
    <div className="fixed inset-0 bg-white dark:bg-[#0f0f0f] flex flex-col items-center justify-between p-8 z-[100] transition-colors duration-300">
      <div className="w-full grid grid-cols-3 gap-2 rotate-[-5deg] scale-110 mt-[-20px]">
        {MANGA_COVERS.map((src, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="aspect-[3/4] rounded-lg overflow-hidden shadow-md"
          >
            <img
              src={src}
              alt="Manga Cover"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
          Let's start your manga adventure!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm px-4">
          The best place to find and enjoy thousands of manga titles of various
          genres! We are glad you joined us. 🙌
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onContinue}
        className="w-full bg-purple-600 text-white font-bold py-4 rounded-2xl shadow-xl text-lg"
      >
        Continue
      </motion.button>
    </div>
  );
}
