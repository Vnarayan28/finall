"use client"
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, AlertCircle, Moon, Sun, ArrowLeft, SearchX } from "lucide-react";
import Image from "next/image";

type VideoResource = {
  title: string;
  videoId: string;
  description: string;
  thumbnails: string;
  channel: string;
  duration: string;
  status: "todo" | "inprogress" | "done";
};

// Consistent Theme Toggle Button
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

// Consistent Back Button
const BackButton = ({ onClick, isDarkMode }: { onClick: () => void; isDarkMode: boolean; }) => (
  <motion.button
    onClick={onClick}
    className={`fixed top-4 left-4 md:top-6 md:left-6 p-2.5 md:p-3 rounded-full z-50 transition-colors duration-300 ${isDarkMode
        ? "text-gray-200 hover:bg-gray-700"
        : "text-gray-700 hover:bg-gray-200"
      }`}
    whileHover={{ scale: 1.1, x: -2 }}
    whileTap={{ scale: 0.9 }}
    aria-label="Go back"
  >
    <ArrowLeft size={24} />
  </motion.button>
);


const LoadingState = ({ isDarkMode, topic, onGoHome, toggleTheme }: { isDarkMode: boolean; topic: string; onGoHome: () => void; toggleTheme: () => void; }) => (
  <motion.div
    className={`min-h-screen flex flex-col items-center justify-center relative ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <BackButton onClick={onGoHome} isDarkMode={isDarkMode} />
    <ThemeToggleButton isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
    <div className={`absolute inset-0 ${isDarkMode
        ? "bg-gradient-to-br from-purple-900/30 via-gray-900 to-blue-900/30"
        : "bg-gradient-to-br from-purple-100/30 via-gray-50 to-blue-100/30"
      }`}>
      <motion.div
        className="absolute inset-0 bg-[length:100px_100px] opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at center, ${isDarkMode ? "#fff" : "#000"
            } 10%, transparent 20%)`,
        }}
      />
    </div>

    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className="mb-8 z-10"
    >
      <Loader2 className={`h-16 w-16 ${isDarkMode ? "text-purple-400" : "text-purple-600"
        }`} />
    </motion.div>

    <motion.h1
      className={`text-3xl md:text-4xl font-bold bg-clip-text text-transparent ${
        isDarkMode
          ? "bg-gradient-to-r from-purple-300 to-blue-300"
          : "bg-gradient-to-r from-purple-600 to-blue-600"
      } z-10 text-center px-4`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      Curating Videos for "{topic}"...
    </motion.h1>

    <motion.p
      className={`mt-4 text-lg z-10 ${isDarkMode ? "text-gray-300/80" : "text-gray-600/80"
        } text-center px-4`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      Scanning top educational resources, please wait.
    </motion.p>
  </motion.div>
);

const ErrorState = ({ isDarkMode, error, onRetry, onGoHome, toggleTheme }: { isDarkMode: boolean; error: string; onRetry: () => void; onGoHome: () => void; toggleTheme: () => void; }) => (
  <motion.div
    className={`min-h-screen flex flex-col items-center justify-center relative p-4 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <BackButton onClick={onGoHome} isDarkMode={isDarkMode} />
    <ThemeToggleButton isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
    <div className={`absolute inset-0 ${isDarkMode
        ? "bg-gradient-to-br from-red-900/30 via-gray-900 to-orange-900/30"
        : "bg-gradient-to-br from-red-100/30 via-gray-50 to-orange-100/30"
      }`} />

    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`p-5 rounded-full mb-6 z-10 ${isDarkMode ? "bg-red-500/20" : "bg-red-400/20"
        }`}
    >
      <AlertCircle className={`h-12 w-12 md:h-16 md:w-16 ${isDarkMode ? "text-red-400" : "text-red-500"
        }`} />
    </motion.div>

    <h1 className={`text-3xl md:text-4xl font-bold mb-3 z-10 text-center ${isDarkMode ? "text-red-300" : "text-red-500"
      }`}>
      Oops! Something Went Wrong
    </h1>

    <p className={`mt-2 max-w-lg text-center text-md md:text-lg z-10 ${isDarkMode ? "text-gray-200/90" : "text-gray-700/90"
      }`}>
      {error || "An unknown error occurred."}
    </p>

    <motion.button
      onClick={onRetry}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`mt-8 px-6 py-3 md:px-8 md:py-3.5 rounded-xl font-semibold text-md md:text-lg transition-all duration-200 shadow-lg z-10 ${isDarkMode
          ? "bg-purple-500/90 hover:bg-purple-600 text-white shadow-purple-500/20"
          : "bg-purple-400 hover:bg-purple-500 text-gray-900 shadow-purple-200/20"
        }`}
    >
      Try Again
    </motion.button>
  </motion.div>
);

const NoVideosDisplay = ({ isDarkMode, topic, onGoHome, toggleTheme }: { isDarkMode: boolean; topic: string; onGoHome: () => void; toggleTheme: () => void; }) => (
  <motion.main
    className={`min-h-screen flex flex-col items-center justify-center relative p-4 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8 }}
  >
    <BackButton onClick={onGoHome} isDarkMode={isDarkMode} />
    <ThemeToggleButton isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
    <div className={`absolute inset-0 ${isDarkMode
        ? "bg-gradient-to-br from-purple-900/30 via-gray-900 to-blue-900/30"
        : "bg-gradient-to-br from-purple-100/30 via-gray-50 to-blue-100/30"
      }`}>
      <motion.div
        className="absolute inset-0 bg-[length:100px_100px] opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at center, ${isDarkMode ? "#fff" : "#000"} 10%, transparent 20%)`,
        }}
      />
    </div>
    
    <div className="container mx-auto p-6 md:p-12 lg:p-16 relative z-10 flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl"
      >
        <SearchX className={`h-16 w-16 mb-6 mx-auto ${isDarkMode ? "text-purple-400" : "text-purple-500"}`} />
        <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
          No Videos Found for "{topic}"
        </h1>
        <p className={`mt-2 text-md md:text-lg ${isDarkMode ? "text-gray-300/80" : "text-gray-600/80"}`}>
          We couldn't find any videos matching your criteria after filtering.
        </p>
        <p className={`mt-1 text-sm md:text-base ${isDarkMode ? "text-gray-400/70" : "text-gray-500/70"}`}>
          This might be because the topic is very specific, or available videos didn't meet requirements like minimum length or embeddability.
        </p>
        <motion.button
          onClick={onGoHome}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`mt-8 px-6 py-3 md:px-8 md:py-3.5 rounded-xl font-semibold text-md md:text-lg transition-all duration-200 shadow-lg z-10 ${isDarkMode
              ? "bg-purple-500/90 hover:bg-purple-600 text-white shadow-purple-500/20"
              : "bg-purple-400 hover:bg-purple-500 text-gray-900 shadow-purple-200/20"
            }`}
        >
          Try a Different Topic
        </motion.button>
      </motion.div>
    </div>
  </motion.main>
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

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const goHome = () => push('/');

  const fetchAndSetVideos = async (currentTopic: string) => {
    setLoading(true);
    setError(null);
    setVideos([]); 
    try {
      const response = await fetch(`/api/generate-lecture?topic=${encodeURIComponent(currentTopic)}`);

      if (!response.ok) {
        let errorDetail = `Failed to fetch videos (status: ${response.status})`;
        try {
            const errorData = await response.json();
            if (typeof errorData === 'object' && errorData !== null && typeof errorData.detail === 'string' && errorData.detail.trim() !== "") {
                errorDetail = errorData.detail;
            } else if (typeof errorData === 'object' && errorData !== null) {
                errorDetail = `Server error (status: ${response.status}): ${JSON.stringify(errorData)}`;
            }
        } catch (e) {
             errorDetail = `Failed to fetch videos (status: ${response.status}, could not parse error response).`;
        }
        throw new Error(errorDetail);
      }

      const data = await response.json();
      if (data && Array.isArray(data.videos)) {
        setVideos(data.videos);
      } else {
        // IMPORTANT: Check your browser's developer console for this log when the error occurs.
        // The content of `data` here is crucial for diagnosing the issue.
        console.error("API Success, but videos field is not an array or data is malformed. Data received:", data);
        throw new Error("Received an unexpected video format from the server. Please check console for details.");
      }
    } catch (err: any) {
      setError(err.message || "An unknown error occurred while fetching videos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
        setIsDarkMode(storedTheme === 'dark');
    } else if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDarkMode(true);
    } else {
        setIsDarkMode(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        }
    }
  }, [isDarkMode]);


  useEffect(() => {
    const topicParam = decodeURIComponent(searchParams.get("topic") || "");
    setTopic(topicParam); 

    if (!topicParam) {
      setError("No topic provided. Please go back and enter a topic.");
      setLoading(false);
      return;
    }
    fetchAndSetVideos(topicParam);
  }, [searchParams]);


 if (loading) return <LoadingState isDarkMode={isDarkMode} topic={topic || "your topic"} onGoHome={goHome} toggleTheme={toggleTheme} />;
  if (error) return <ErrorState isDarkMode={isDarkMode} error={error} onRetry={() => topic && fetchAndSetVideos(topic)} onGoHome={goHome} toggleTheme={toggleTheme} />;
  
  if (!loading && !error && videos.length === 0 && topic) { 
    return <NoVideosDisplay isDarkMode={isDarkMode} topic={topic} onGoHome={goHome} toggleTheme={toggleTheme} />;
  }


    return (
    <motion.main
      className={`min-h-screen relative overflow-hidden ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background elements and theme/back buttons remain the same */}
      <div className={`absolute inset-0 ${isDarkMode
          ? "bg-gradient-to-br from-purple-900/30 via-gray-900 to-blue-900/30"
          : "bg-gradient-to-br from-purple-100/30 via-gray-50 to-blue-100/30"
        }`}>
        <motion.div
          className="absolute inset-0 bg-[length:100px_100px] opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at center, ${isDarkMode ? "#fff" : "#000"
              } 10%, transparent 20%)`,
          }}
        />
      </div>

      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 md:w-1.5 md:h-1.5 rounded-full blur-[0.5px] md:blur-[1px] ${isDarkMode
                ? "bg-gradient-to-r from-purple-400 to-blue-400"
                : "bg-gradient-to-r from-purple-300 to-blue-300"
              }`}
            initial={{
              scale: 0,
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
            }}
            animate={{
              scale: [0, Math.random() * 0.5 + 0.5, 0],
              opacity: [0, Math.random() * 0.5 + 0.3, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 6,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <BackButton onClick={goHome} isDarkMode={isDarkMode} />
      <ThemeToggleButton isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      {/* Add padding-bottom to the main content area to prevent overlap with the fixed button */}
      <div className="container mx-auto p-4 pt-20 sm:p-6 md:p-12 lg:p-16 lg:pt-24 relative z-10 pb-28 md:pb-32"> {/* MODIFIED: Added pb-28 / md:pb-32 */}
        <motion.div
          className="mb-8 md:mb-12 text-center space-y-3 md:space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            className={`inline-flex p-3 md:p-4 rounded-xl md:rounded-2xl mb-3 md:mb-4 ${isDarkMode
                ? "bg-gradient-to-r from-purple-500 to-blue-500"
                : "bg-gradient-to-r from-purple-400 to-blue-400"
              }`}
            animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className={`w-6 h-6 md:w-8 md:h-8 ${isDarkMode ? 'text-white' : 'text-gray-100'
              }`} />
          </motion.div>

          <h1 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent ${isDarkMode
              ? "bg-gradient-to-r from-purple-200 via-blue-200 to-purple-300"
              : "bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700"
            }`}>
            Explore "{topic}"
          </h1>

          <p className={`text-md sm:text-lg md:text-xl max-w-2xl mx-auto ${isDarkMode ? "text-gray-300/90" : "text-gray-600/90"
            }`}>
            Select a video to begin your immersive learning journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {videos.map((video, index) => (
            <motion.div
              key={video.videoId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 + 0.3 }} 
              className={`relative group cursor-pointer rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 ease-in-out ${isDarkMode
                  ? "bg-gray-800/60 border border-purple-500/30 shadow-xl shadow-purple-900/20"
                  : "bg-white/90 border border-purple-600/20 shadow-xl shadow-purple-200/20"
                } ${selectedVideo === video.videoId
                  ? "ring-2 ring-offset-2 ring-offset-transparent ring-purple-400 dark:ring-purple-500 scale-[1.03]"
                  : "hover:scale-[1.02] hover:shadow-2xl hover:border-purple-500/50 dark:hover:border-purple-400/50"
                }`}
              onClick={() => setSelectedVideo(video.videoId)}
            >
              <div className="relative aspect-video">
                <Image
                  src={video.thumbnails || `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`}
                  alt={`Thumbnail of ${video.title}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  priority={index < 3} 
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode
                    ? "from-black/80 via-black/30 to-transparent"
                    : "from-black/70 via-black/20 to-transparent"
                  }`} />
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                  <h3 className={`font-semibold text-md md:text-lg line-clamp-2 text-white drop-shadow-md`}>
                    {video.title}
                  </h3>
                  <p className={`text-xs md:text-sm mt-1 font-medium text-gray-200 dark:text-gray-300 drop-shadow-sm`}>
                    {video.channel}
                  </p>
                </div>
                <div className={`absolute top-2 right-2 md:top-3 md:right-3 px-2 py-1 rounded-md md:rounded-full text-xs font-medium ${isDarkMode
                    ? "bg-black/70 text-gray-100"
                    : "bg-black/70 text-gray-100"
                  }`}>
                  {video.duration}
                </div>
              </div>

              <div className={`p-3 md:p-4 border-t ${isDarkMode
                  ? "bg-gray-800/50 border-white/10"
                  : "bg-white/70 border-gray-200/60"
                }`}>
                <p className={`text-xs md:text-sm line-clamp-3 leading-relaxed ${isDarkMode ? "text-gray-300/90" : "text-gray-700/90"
                  }`}>
                  {video.description || "No description available."}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Fixed "Start Lecture" button area - MOVED OUTSIDE of the main scrollable content flow */}
      </div>

      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            // MODIFIED: Styling for fixed bottom bar
            className={`fixed bottom-0 left-0 right-0 p-4 z-30 text-center ${
              isDarkMode ? 'bg-gray-800/90 border-t border-gray-700/50 backdrop-blur-sm' : 'bg-white/90 border-t border-gray-200/50 backdrop-blur-sm'
            } shadow-2xl_upwards`} // shadow-2xl_upwards is a conceptual name for an upward shadow
            initial={{ y: "100%" }} // Start off-screen below
            animate={{ y: "0%" }}   // Animate to on-screen
            exit={{ y: "100%" }}    // Animate off-screen below
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <motion.button
              onClick={() => push(`/lecture?videoId=${selectedVideo}&topic=${encodeURIComponent(topic)}`)}
              whileHover={{ scale: 1.03 }} // Slightly less aggressive hover for a fixed button
              whileTap={{ scale: 0.97 }}
              className={`inline-flex items-center px-8 py-3 md:px-10 md:py-3.5 rounded-xl text-md md:text-lg font-semibold shadow-lg transition-all duration-200 ${isDarkMode
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-purple-900/40"
                  : "bg-gradient-to-r from-purple-400 to-blue-400 hover:from-purple-500 hover:to-blue-500 text-gray-900 shadow-purple-300/40"
                }`}
            >
              <Sparkles className={`mr-2 md:mr-3 h-5 w-5 md:h-6 md:h-6 ${isDarkMode ? 'text-white' : 'text-gray-900'
                } opacity-80 group-hover:opacity-100 transition-opacity`} />
              Start Interactive Lecture
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
