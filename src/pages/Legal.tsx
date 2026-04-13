import { ArrowLeft, Shield, FileText, Info } from "lucide-react";
import { motion } from "motion/react";

interface LegalProps {
  type: "privacy" | "tos";
  onBack: () => void;
}

export default function Legal({ type, onBack }: LegalProps) {
  const content = {
    privacy: {
      title: "Privacy Policy",
      icon: Shield,
      sections: [
        {
          title: "Data Collection",
          text: "NoirScroll is designed as a client-side application. We do not collect, store, or share any personal information. Your reading history and bookmarks are stored locally on your device."
        },
        {
          title: "Third-Party Services",
          text: "The application fetches content from third-party sources. These external sites may have their own privacy policies and data collection practices. We recommend reviewing them when accessing their content."
        },
        {
          title: "Cookies",
          text: "We do not use tracking cookies. Local storage is used solely to enhance your experience by saving your preferences and reading progress."
        }
      ]
    },
    tos: {
      title: "Terms of Service",
      icon: FileText,
      sections: [
        {
          title: "Content Disclaimer",
          text: "NoirScroll is a content aggregator. We do not host, store, or upload any manga, webtoons, or images on our servers. All content is provided by third-party sources via public APIs and web scraping."
        },
        {
          title: "Usage Policy",
          text: "This application is intended for personal, non-commercial use only. Users are responsible for ensuring their use of the application complies with local laws and regulations."
        },
        {
          title: "Intellectual Property",
          text: "All intellectual property rights for the manga and webtoons belong to their respective creators and publishers. NoirScroll does not claim ownership over any content accessed through the app."
        },
        {
          title: "Limitation of Liability",
          text: "NoirScroll is provided 'as is' without warranties of any kind. We are not liable for any damages arising from the use or inability to use the application."
        }
      ]
    }
  };

  const active = content[type];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] transition-colors duration-500">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-md z-50 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-4 px-6 h-16">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">
            {active.title}
          </h1>
        </div>
      </div>

      <div className="pt-24 px-6 pb-20 max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 rounded-3xl bg-purple-600/10 flex items-center justify-center text-purple-600 mb-6">
            <active.icon size={32} />
          </div>
          <p className="text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.3em] text-center">
            Legal Information
          </p>
        </div>

        <div className="space-y-10">
          {active.sections.map((section, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <h2 className="text-xs font-black text-purple-600 uppercase tracking-widest mb-3">
                {section.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                {section.text}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10">
          <div className="flex items-start gap-4">
            <Info className="text-purple-600 shrink-0 mt-1" size={18} />
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
              NoirScroll is an open-source project dedicated to providing a clean reading experience. We respect the hard work of creators and encourage users to support official releases whenever possible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
