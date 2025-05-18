"use client";
import React, { useState } from "react";
import { motion, useTransform, useScroll } from "framer-motion";
import { Sparkles, Search, Zap } from "lucide-react"; // Removed unused icons
import Link from "next/link";
import { useRouter } from "next/navigation";
// Assuming these components are correctly pathed
import AnimatedGradientBg from "../components/AnimatedGradientBg"; 
import NavBarLanding from "../NavBarLanding"; // Adjust path if your landing page is in a group like (landing) or a different location

export default function InputPage() {
  const [topic, setTopic] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); 
  const { scrollY } = useScroll(); 
  const { push } = useRouter();

  const rotateIcon = useTransform(scrollY, [0, 100], [0, 15], { clamp: false });
  const scalePage = useTransform(scrollY, [0, 100], [1, 0.98], { clamp: false });

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleGenerateClick = async () => {
    if (!topic.trim()) return;
    try {
      push(`/research?topic=${encodeURIComponent(topic.trim())}`);
    } catch (error) {
      console.error("Failed to navigate: ", error);
    }
  };
  
  const pageVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15, delay: 0.2 } },
  };

  return (
    <motion.div 
      className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-4 selection:bg-pink-500 selection:text-white ${
        isDarkMode ? "dark" : ""
      }`}
      style={{ scale: scalePage }} 
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <AnimatedGradientBg isDarkMode={isDarkMode} />
      <NavBarLanding isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      <motion.div 
        className="flex flex-col items-center justify-center space-y-8 sm:space-y-10 z-10 w-full max-w-2xl mt-16 sm:mt-0" 
      >
        <motion.div
          className="relative group"
          whileHover={{ y: -8, scale: 1.05 }}
          transition={{ type: "spring", stiffness: 250, damping: 10 }}
          variants={itemVariants}
        >
          <Link href="/" passHref aria-label="Intellect AI Logo">
             <motion.div 
              className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center shadow-2xl
                         bg-gradient-to-br ${isDarkMode 
                            ? "from-purple-600 via-pink-500 to-orange-500 hover:shadow-pink-500/40" 
                            : "from-purple-500 via-pink-500 to-orange-400 hover:shadow-pink-400/30"
                         } transition-all duration-300`}
              style={{ rotate: rotateIcon }} 
             >
                <Zap size={50} className="text-white opacity-90 group-hover:opacity-100 transition-opacity" />
             </motion.div>
          </Link>
        </motion.div>

        <motion.h1 
          className="font-heading text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-center"
          variants={itemVariants}
        >
          <span className={`${isDarkMode ? "text-white" : "text-black"}`}>
            What do you want to 
          </span>
          <span className={`block mt-1 sm:mt-2
            ${isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400' 
                         : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500'}
          `}>
            master today?
          </span>
        </motion.h1>

        <motion.div 
          className="relative w-full"
          variants={itemVariants}
        >
          <div className="relative group">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 pointer-events-none 
                                ${isDarkMode ? (isFocused ? 'text-purple-400' : 'text-gray-500') 
                                             : (isFocused ? 'text-purple-600' : 'text-gray-400')}`} 
                      size={20} />
            <input
              type="text"
              placeholder="e.g., The History of Ancient Rome, Basics of Rust Programming..."
              className={`w-full pl-12 pr-4 py-4 text-base sm:text-lg rounded-xl outline-none transition-all duration-300 shadow-lg
                          border ${isDarkMode
                            ? "bg-gray-800/70 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 hover:border-gray-600"
                            : "bg-white/80 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 hover:border-gray-400"
                          }`}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && topic.trim() && handleGenerateClick()}
            />
          </div>
          {!topic && !isFocused && (
            <motion.div 
              className="absolute inset-y-0 left-12 flex items-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className={`text-sm sm:text-base animate-pulse ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
                Explore any concept...
              </span>
            </motion.div>
          )}
        </motion.div>

        <motion.button
          onClick={handleGenerateClick}
          disabled={!topic.trim()}
          className={`font-semibold px-8 py-4 rounded-xl text-lg relative group overflow-hidden shadow-lg
                      transition-all duration-300 ease-out w-full sm:w-auto
                      ${!topic.trim() 
                          ? (isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-400 cursor-not-allowed')
                          : (isDarkMode
                            ? "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 text-white hover:shadow-pink-500/40"
                            : "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white hover:shadow-pink-500/30")
                      }`}
          whileHover={topic.trim() ? { scale: 1.05, y: -2, boxShadow: `0px 10px 30px -5px ${isDarkMode ? 'rgba(192, 132, 252, 0.3)' : 'rgba(147, 51, 234, 0.2)'}` } : {}}
          whileTap={topic.trim() ? { scale: 0.95, y: 0 } : {}}
          variants={itemVariants}
        >
          {topic.trim() && (
             <span className="absolute w-0 h-0 transition-all duration-300 ease-out bg-white/20 group-hover:w-full group-hover:h-full opacity-0 group-hover:opacity-100 rounded-xl"></span>
          )}
          <span className="relative flex items-center gap-2.5">
            <Zap className={`w-5 h-5 ${topic.trim() ? 'group-hover:animate-pulse' : 'opacity-50'}`} />
            Generate Lecture
          </span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}