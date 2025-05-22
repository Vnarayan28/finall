"use client";
import React, { useState } from "react";
import { motion, useTransform, useScroll, AnimatePresence } from "framer-motion";
import { Search, Zap, Link as LinkIcon, Play, BookOpen, Youtube } from "lucide-react"; 
import Link from "next/link";
import { useRouter } from "next/navigation";
import AnimatedGradientBg from "../components/AnimatedGradientBg"; 
import NavBarLanding from "../NavBarLanding"; 

// Helper function to extract YouTube Video ID
function getYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  return null;
}

type InputType = 'topic' | 'url';

export default function InputPage() {
  const [topic, setTopic] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isTopicFocused, setIsTopicFocused] = useState(false);
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); 
  const [activeInputType, setActiveInputType] = useState<InputType>('topic');

  const { scrollY } = useScroll(); 
  const { push } = useRouter();

  const rotateIcon = useTransform(scrollY, [0, 100], [0, 15], { clamp: false });
  const scalePage = useTransform(scrollY, [0, 100], [1, 0.98], { clamp: false });

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleGenerateFromTopicClick = async () => {
    if (!topic.trim()) return;
    try {
      push(`/research?topic=${encodeURIComponent(topic.trim())}`);
    } catch (error) {
      console.error("Failed to navigate for topic: ", error);
    }
  };

  const handleWatchFromUrlClick = async () => {
    const videoId = getYoutubeVideoId(youtubeUrl);
    if (!videoId) {
      console.error("Invalid YouTube URL or could not extract Video ID.");
      return;
    }
    try {
      push(`/lecture?videoId=${videoId}&topic=${encodeURIComponent("YouTube Video")}`);
    } catch (error) {
      console.error("Failed to navigate for YouTube URL: ", error);
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

  const inputSectionVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeInOut" } },
  };

  const isValidTopic = topic.trim() !== "";
  const isValidYoutubeUrl = getYoutubeVideoId(youtubeUrl) !== null;

  const commonInputClasses = `w-full pl-12 pr-4 py-4 text-base sm:text-lg rounded-xl outline-none transition-all duration-300 shadow-lg border ${
    isDarkMode
      ? "bg-gray-800/70 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 hover:border-gray-600"
      : "bg-white/80 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 hover:border-gray-400"
  }`;

  const commonButtonClasses = "font-semibold px-8 py-4 rounded-xl text-lg relative group overflow-hidden shadow-lg transition-all duration-300 ease-out w-full";
  
  const getButtonActiveGradient = (isActive: boolean, type: InputType) => {
    if (!isActive) {
      return isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-400 cursor-not-allowed';
    }
    if (type === 'topic') {
      return isDarkMode
        ? "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 text-white hover:shadow-pink-500/40"
        : "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white hover:shadow-pink-500/30";
    }
    // type === 'url'
    return isDarkMode
      ? "bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 text-white hover:shadow-cyan-500/40"
      : "bg-gradient-to-br from-teal-400 via-cyan-400 to-sky-400 text-white hover:shadow-cyan-400/30";
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
        className="flex flex-col items-center justify-center space-y-6 sm:space-y-8 z-10 w-full max-w-2xl mt-12 sm:mt-0" 
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
            How do you want to 
          </span>
          <span className={`block mt-1 sm:mt-2
            ${isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400' 
                         : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500'}
          `}>
            start learning?
          </span>
        </motion.h1>

        {/* Input Type Switcher */}
        <motion.div className="flex space-x-3 p-1 rounded-xl bg-gray-500/20 dark:bg-gray-700/30" variants={itemVariants}>
          {(['topic', 'url'] as InputType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveInputType(type)}
              className={`px-4 py-2.5 sm:px-6 rounded-lg text-sm sm:text-base font-medium transition-colors relative
                ${activeInputType === type 
                  ? (isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white')
                  : (isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-900')}
              `}
            >
              {activeInputType === type && (
                <motion.div
                  layoutId="activeInputTypeIndicator"
                  className={`absolute inset-0 rounded-lg ${isDarkMode ? 'bg-purple-600' : 'bg-purple-500'} z-[-1]`}
                  initial={false}
                  transition={{ type: "spring", stiffness: 250, damping: 25 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {type === 'topic' ? <BookOpen size={18} /> : <Youtube size={18} />}
                {type === 'topic' ? 'Enter Topic' : 'YouTube URL'}
              </span>
            </button>
          ))}
        </motion.div>
        
        <div className="w-full h-[150px] sm:h-[140px]"> 
          <AnimatePresence mode="wait">
            {activeInputType === 'topic' && (
              <motion.div
                key="topic-input"
                className="w-full space-y-4"
                variants={inputSectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div className="relative group">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 pointer-events-none 
                                      ${isDarkMode ? (isTopicFocused ? 'text-purple-400' : 'text-gray-500') 
                                                  : (isTopicFocused ? 'text-purple-600' : 'text-gray-400')}`} 
                            size={20} />
                  <input
                    type="text"
                    placeholder="e.g., The History of Ancient Rome..."
                    className={commonInputClasses}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onFocus={() => setIsTopicFocused(true)}
                    onBlur={() => setIsTopicFocused(false)}
                    onKeyDown={(e) => e.key === 'Enter' && isValidTopic && handleGenerateFromTopicClick()}
                  />
                </div>
                <motion.button
                  onClick={handleGenerateFromTopicClick}
                  disabled={!isValidTopic}
                  className={`${commonButtonClasses} ${getButtonActiveGradient(isValidTopic, 'topic')}`}
                  whileHover={isValidTopic ? { scale: 1.02, y: -1, boxShadow: `0px 7px 20px -5px ${isDarkMode ? 'rgba(192, 132, 252, 0.3)' : 'rgba(147, 51, 234, 0.2)'}` } : {}}
                  whileTap={isValidTopic ? { scale: 0.98, y: 0 } : {}}
                >
                  {isValidTopic && (
                    <span className="absolute w-0 h-0 transition-all duration-300 ease-out bg-white/20 group-hover:w-full group-hover:h-full opacity-0 group-hover:opacity-100 rounded-xl"></span>
                  )}
                  <span className="relative flex items-center justify-center gap-2.5">
                    <Zap className={`w-5 h-5 ${isValidTopic ? 'group-hover:animate-pulse' : 'opacity-50'}`} />
                    Generate Lecture
                  </span>
                </motion.button>
              </motion.div>
            )}

            {activeInputType === 'url' && (
              <motion.div
                key="url-input"
                className="w-full space-y-4"
                variants={inputSectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div className="relative group">
                  <LinkIcon className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 pointer-events-none 
                                    ${isDarkMode ? (isUrlFocused ? 'text-purple-400' : 'text-gray-500') 
                                                : (isUrlFocused ? 'text-purple-600' : 'text-gray-400')}`} 
                              size={20} />
                  <input
                    type="text"
                    placeholder="Paste a YouTube video URL..."
                    className={commonInputClasses}
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    onFocus={() => setIsUrlFocused(true)}
                    onBlur={() => setIsUrlFocused(false)}
                    onKeyDown={(e) => e.key === 'Enter' && isValidYoutubeUrl && handleWatchFromUrlClick()}
                  />
                </div>
                <motion.button
                  onClick={handleWatchFromUrlClick}
                  disabled={!isValidYoutubeUrl}
                  className={`${commonButtonClasses} ${getButtonActiveGradient(isValidYoutubeUrl, 'url')}`}
                  whileHover={isValidYoutubeUrl ? { scale: 1.02, y: -1, boxShadow: `0px 7px 20px -5px ${isDarkMode ? 'rgba(20, 184, 166, 0.3)' : 'rgba(6, 182, 212, 0.2)'}` } : {}}
                  whileTap={isValidYoutubeUrl ? { scale: 0.98, y: 0 } : {}}
                >
                  {isValidYoutubeUrl && (
                    <span className="absolute w-0 h-0 transition-all duration-300 ease-out bg-white/20 group-hover:w-full group-hover:h-full opacity-0 group-hover:opacity-100 rounded-xl"></span>
                  )}
                  <span className="relative flex items-center justify-center gap-2.5">
                    <Play className={`w-5 h-5 ${isValidYoutubeUrl ? 'group-hover:animate-bounce' : 'opacity-50'}`} />
                    Start from URL
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}