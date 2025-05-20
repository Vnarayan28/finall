"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, AlertTriangle, Moon, Sun, ArrowLeft, SearchX, PlayCircle } from "lucide-react"; 
import Image from "next/image";

import AnimatedGradientBg from "../components/AnimatedGradientBg"; 
import NavBarLanding from "../NavBarLanding"; 

type VideoResource = {
  title: string;
  videoId: string;
  description: string;
  thumbnails: string;
  channel: string;
  duration: string;
  status: "todo" | "inprogress" | "done"; 
};

const ThemeToggleButton = ({ isDarkMode, toggleTheme }: { isDarkMode: boolean; toggleTheme: () => void }) => (
  <motion.button
    onClick={toggleTheme}
    className={`fixed top-4 right-4 md:top-6 md:right-6 p-2.5 md:p-3 rounded-full z-50 transition-colors duration-300 ${isDarkMode
        ? "bg-gray-700 hover:bg-gray-600 text-yellow-300"
        : "bg-yellow-400 hover:bg-yellow-500 text-gray-900"
      }`}
    whileHover={{ scale: 1.1, rotate: isDarkMode ? -15 : 15 }}
    whileTap={{ scale: 0.9 }}
    aria-label="Toggle theme"
  >
    {isDarkMode ? (
      <Moon className="w-5 h-5 md:w-6 md:h-6" />
    ) : (
      <Sun className="w-5 h-5 md:w-6 md:h-6" />
    )}
  </motion.button>
);

const FullPageStatusDisplay = ({ 
    isDarkMode, 
    children,
    gradientFrom = isDarkMode ? "from-purple-900/30" : "from-purple-100/30",
    gradientVia = isDarkMode ? "via-gray-900" : "via-gray-50",
    gradientTo = isDarkMode ? "to-blue-900/30" : "to-blue-100/30",
 } : { 
    isDarkMode: boolean; 
    children: React.ReactNode;
    gradientFrom?: string;
    gradientVia?: string;
    gradientTo?: string;
}) => (
  <motion.div
    className={`min-h-screen flex flex-col items-center justify-center relative p-4 text-center ${isDarkMode ? "text-white" : "text-gray-900"}`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.5, ease: "easeInOut" }}
  >
    {/* Using AnimatedGradientBg for consistent background effects might be better if it supports dynamic gradients */}
    <div className={`absolute inset-0 ${gradientFrom} ${gradientVia} ${gradientTo} bg-gradient-to-br`}>
      <motion.div
        className="absolute inset-0 bg-[length:80px_80px] opacity-5 dark:opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at center, ${isDarkMode ? "#ffffff30" : "#00000020"} 0.5px, transparent 0.5px)`,
        }}
      />
    </div>
    <div className="relative z-10 max-w-lg w-full">{children}</div>
  </motion.div>
);


const LoadingState = ({ isDarkMode, topic }: { isDarkMode: boolean; topic: string; }) => (
  <FullPageStatusDisplay isDarkMode={isDarkMode}>
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      className="mb-6 sm:mb-8"
    >
      <Loader2 className={`h-14 w-14 sm:h-16 sm:w-16 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
    </motion.div>
    <h1 className={`font-heading text-2xl sm:text-3xl font-bold mb-3 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
      Curating Lectures for "{topic}"
    </h1>
    <p className={`text-sm sm:text-base ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
      Scanning top educational resources. This might take a moment...
    </p>
  </FullPageStatusDisplay>
);

const ErrorState = ({ isDarkMode, error, onRetry }: { isDarkMode: boolean; error: string; onRetry: () => void; }) => (
  <FullPageStatusDisplay 
    isDarkMode={isDarkMode} 
    gradientFrom={isDarkMode ? "from-red-900/40" : "from-red-100/40"}
    gradientTo={isDarkMode ? "to-orange-900/40" : "to-orange-100/40"}
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className={`p-3.5 sm:p-4 rounded-full mb-5 sm:mb-6 inline-block ${isDarkMode ? "bg-red-500/10" : "bg-red-100"}`}
    >
      <AlertTriangle className={`h-10 w-10 sm:h-12 sm:w-12 ${isDarkMode ? "text-red-400" : "text-red-500"}`} />
    </motion.div>
    <h1 className={`font-heading text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? "text-red-300" : "text-red-600"}`}>
      Something Went Wrong
    </h1>
    <p className={`text-sm sm:text-base max-w-md mx-auto ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
      {error || "An unknown error occurred. Please try refreshing."}
    </p>
    <motion.button
      onClick={onRetry}
      whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
      className={`mt-6 sm:mt-8 px-6 py-2.5 sm:px-7 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 shadow-lg 
                  ${isDarkMode ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-purple-500 hover:bg-purple-600 text-white"}`}
    >
      Try Again
    </motion.button>
  </FullPageStatusDisplay>
);

const NoVideosDisplay = ({ isDarkMode, topic, onGoHome }: { isDarkMode: boolean; topic: string; onGoHome: () => void; }) => (
  <FullPageStatusDisplay isDarkMode={isDarkMode}>
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className={`p-3.5 sm:p-4 rounded-full mb-5 sm:mb-6 inline-block ${isDarkMode ? "bg-sky-500/10" : "bg-sky-100"}`}
    >
      <SearchX className={`h-10 w-10 sm:h-12 sm:w-12 ${isDarkMode ? "text-sky-400" : "text-sky-500"}`} />
    </motion.div>
    <h1 className={`font-heading text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
      No Lectures Found for "{topic}"
    </h1>
    <p className={`text-sm sm:text-base max-w-md mx-auto ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
      We couldn't find suitable videos for this topic after filtering. Try a broader search term or check back later.
    </p>
    <motion.button
      onClick={onGoHome}
      whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
      className={`mt-6 sm:mt-8 px-6 py-2.5 sm:px-7 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 shadow-lg 
                  ${isDarkMode ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-purple-500 hover:bg-purple-600 text-white"}`}
    >
      Search Another Topic
    </motion.button>
  </FullPageStatusDisplay>
);


export default function ResearchPage() {
  const [videos, setVideos] = useState<VideoResource[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true); 
  const { push } = useRouter();
  const searchParams = useSearchParams();

  const toggleTheme = () => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', newMode);
      }
      return newMode;
    });
  };

  const goHome = () => push('/input'); // Or '/' if that's your main input/home

  const fetchAndSetVideos = async (currentTopic: string) => {
    setLoading(true);
    setError(null);
    setVideos([]); 
    setSelectedVideo(null); 
    try {
      const response = await fetch(`/api/generate-lecture?topic=${encodeURIComponent(currentTopic)}`);
      if (!response.ok) {
        let errorDetail = `Error ${response.status}`;
        try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } 
        catch (e) { console.error("Could not parse error JSON", e); }
        throw new Error(errorDetail);
      }
      const data = await response.json();
      if (data && Array.isArray(data.videos)) {
        setVideos(data.videos);
        if (data.videos.length === 0) {
          // setError will be caught by the NoVideosDisplay check later if needed,
          // but we could set a specific flag or message here if desired.
        }
      } else {
        console.error("API Success, but videos field is not an array or data is malformed. Data:", data);
        throw new Error("Unexpected response format from server.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch lectures.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { // Handles initial theme loading
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialIsDark = storedTheme ? storedTheme === 'dark' : systemPrefersDark;
      setIsDarkMode(initialIsDark);
      document.documentElement.classList.toggle('dark', initialIsDark);
    }
  }, []);

  useEffect(() => { // Fetches videos based on URL param
    const topicParam = decodeURIComponent(searchParams.get("topic") || "");
    setTopic(topicParam); 
    if (!topicParam) {
      setError("No topic specified. Please go back and enter a topic.");
      setLoading(false);
      return;
    }
    fetchAndSetVideos(topicParam);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);


  // --- Render full-page status displays if applicable ---
  if (loading) return (
    <>
      <NavBarLanding isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <LoadingState isDarkMode={isDarkMode} topic={topic || "your topic"} />
    </>
  );
  if (error) return (
    <>
      <NavBarLanding isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <ErrorState isDarkMode={isDarkMode} error={error} onRetry={() => topic && fetchAndSetVideos(topic)} />
    </>
  );
  if (!loading && !error && videos.length === 0 && topic) { 
    return (
      <>
        <NavBarLanding isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        <NoVideosDisplay isDarkMode={isDarkMode} topic={topic} onGoHome={goHome} />
      </>
    );
  }

  // --- Main content display if videos are available ---
  return (
    <div className={`min-h-screen relative overflow-x-hidden ${isDarkMode ? "dark" : ""}`}>
      <AnimatedGradientBg isDarkMode={isDarkMode} />
      <NavBarLanding isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      <main className="container mx-auto p-4 pt-24 sm:pt-28 md:pt-32 pb-28 md:pb-32 relative z-10">
        <motion.div
          className="mb-8 md:mb-12 text-center"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <motion.div
            className={`inline-flex p-2.5 sm:p-3 rounded-xl mb-3 sm:mb-4 shadow-lg
              bg-gradient-to-br ${isDarkMode ? "from-purple-600 via-pink-500 to-orange-500" : "from-purple-500 via-pink-500 to-orange-400"}`}
            animate={{ scale: [1, 1.05, 1], rotate: [0,5,-5,0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </motion.div>
          <h1 className={`font-heading text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
            Explore Lectures on "{topic}"
          </h1>
          <p className={`mt-2 text-sm sm:text-base max-w-xl mx-auto ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Select a video below to start your interactive learning experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 xl:gap-7">
          {videos.map((video, index) => (
            <motion.div
              key={video.videoId}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.07 + 0.3, duration: 0.4, ease: "easeOut" }} 
              className={`relative group cursor-pointer rounded-xl md:rounded-2xl overflow-hidden 
                          transition-all duration-300 ease-in-out backdrop-blur-md
                          border ${isDarkMode
                            ? "bg-gray-800/50 border-white/10 shadow-xl shadow-black/20"
                            : "bg-white/60 border-black/10 shadow-xl shadow-gray-500/10"
                          } 
                          ${selectedVideo === video.videoId
                            ? (isDarkMode ? "ring-2 ring-purple-400 scale-[1.02]" : "ring-2 ring-purple-500 scale-[1.02]")
                            : "hover:scale-[1.02] hover:shadow-2xl " + (isDarkMode ? "hover:border-purple-400/50" : "hover:border-purple-500/50")
                          }`}
              onClick={() => setSelectedVideo(video.videoId)}
            >
              <div className="relative aspect-[16/9.5] overflow-hidden"> {/* Slightly taller aspect ratio for content */}
                <Image
                  src={video.thumbnails || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`} // hqdefault is a good fallback
                  alt={video.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  priority={index < 3} 
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-opacity`} />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <h3 className="font-semibold text-sm sm:text-base md:text-lg line-clamp-2 text-white drop-shadow-sm">
                    {video.title}
                  </h3>
                  <p className="text-xs sm:text-sm mt-0.5 font-medium text-gray-200 dark:text-gray-300 opacity-90 drop-shadow-sm">
                    {video.channel}
                  </p>
                </div>
                <div className={`absolute top-2 right-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-medium shadow
                                ${isDarkMode ? "bg-black/60 text-gray-100" : "bg-black/70 text-gray-100"}`}>
                  {video.duration}
                </div>
                {selectedVideo === video.videoId && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                       <PlayCircle className={`w-12 h-12 text-white/80 ${isDarkMode ? 'group-hover:text-purple-300' : 'group-hover:text-purple-400'}`} />
                   </div>
                )}
              </div>

              <div className={`p-3 sm:p-4 border-t ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                <p className={`text-xs sm:text-sm line-clamp-3 leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {video.description || "No description available for this video."}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            className={`fixed bottom-0 left-0 right-0 p-3 sm:p-4 z-30 text-center 
                       border-t backdrop-blur-lg shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.2)]
                       ${isDarkMode 
                          ? 'bg-gray-800/80 border-gray-700/60' 
                          : 'bg-white/80 border-gray-200/60'
                        }`}
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
          >
            <motion.button
              onClick={() => push(`/lecture?videoId=${selectedVideo}&topic=${encodeURIComponent(topic)}`)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`inline-flex items-center px-7 py-3 sm:px-8 sm:py-3.5 rounded-xl text-sm sm:text-base md:text-lg font-semibold shadow-lg transition-all duration-200 group
                          ${isDarkMode
                            ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-purple-900/30"
                            : "bg-gradient-to-r from-purple-400 to-blue-400 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-300/30" // Changed text color for light mode button
                          }`}
            >
              <Sparkles className="mr-2 sm:mr-2.5 h-4 w-4 sm:h-5 sm:h-5 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
              Start Interactive Lecture
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
