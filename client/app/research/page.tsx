"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, AlertCircle, Moon, Sun, ArrowLeft } from "lucide-react";
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

const LoadingState = ({ isDarkMode, topic }: { isDarkMode: boolean; topic: string }) => (
  <motion.div
    className={`min-h-screen flex flex-col items-center justify-center relative ${
      isDarkMode ? "bg-gray-900" : "bg-gray-50"
    }`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className={`absolute inset-0 ${
      isDarkMode 
        ? "bg-gradient-to-br from-purple-900/30 via-gray-900 to-blue-900/30"
        : "bg-gradient-to-br from-purple-100/30 via-gray-50 to-blue-100/30"
    }`}>
      <motion.div 
        className="absolute inset-0 bg-[length:100px_100px] opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at center, ${
            isDarkMode ? "#fff" : "#000"
          } 10%, transparent 20%)`,
        }}
      />
    </div>

    <motion.div
      animate={{ rotate: 360, scale: [1, 1.2, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="mb-8 z-10"
    >
      <Loader2 className={`h-16 w-16 ${
        isDarkMode ? "text-purple-400" : "text-purple-600"
      } animate-pulse`} />
    </motion.div>
    
    <motion.h1 
      className={`text-4xl font-bold bg-clip-text text-transparent ${
        isDarkMode
          ? "bg-gradient-to-r from-purple-300 to-blue-300"
          : "bg-gradient-to-r from-purple-600 to-blue-600"
      } z-10`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      Curating Videos for {topic}...
    </motion.h1>
    
    <motion.p 
      className={`mt-4 text-lg z-10 ${
        isDarkMode ? "text-gray-300/80" : "text-gray-600/80"
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      Scanning top educational resources
    </motion.p>
  </motion.div>
);

const ErrorState = ({ isDarkMode, error, onRetry }: { isDarkMode: boolean; error: string; onRetry: () => void }) => (
  <motion.div
    className={`min-h-screen flex flex-col items-center justify-center relative ${
      isDarkMode ? "bg-gray-900" : "bg-gray-50"
    }`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className={`absolute inset-0 ${
      isDarkMode 
        ? "bg-gradient-to-br from-purple-900/30 via-gray-900 to-blue-900/30"
        : "bg-gradient-to-br from-purple-100/30 via-gray-50 to-blue-100/30"
    }`} />

    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`p-6 rounded-full mb-6 z-10 ${
        isDarkMode ? "bg-red-500/20" : "bg-red-400/20"
      }`}
    >
      <AlertCircle className={`h-16 w-16 ${
        isDarkMode ? "text-red-400" : "text-red-500"
      }`} />
    </motion.div>
    
    <h1 className={`text-4xl font-bold mb-4 z-10 ${
      isDarkMode ? "text-red-300" : "text-red-500"
    }`}>
      Oops!
    </h1>
    
    <p className={`mt-2 max-w-lg text-center text-lg z-10 ${
      isDarkMode ? "text-gray-200/90" : "text-gray-700/90"
    }`}>
      {error}
    </p>
    
    <motion.button
      onClick={onRetry}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`mt-8 px-8 py-3.5 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg z-10 ${
        isDarkMode
          ? "bg-purple-500/90 hover:bg-purple-600 text-white shadow-purple-500/20"
          : "bg-purple-400 hover:bg-purple-500 text-gray-900 shadow-purple-200/20"
      }`}
    >
      Try Again
    </motion.button>
  </motion.div>
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

  const fetchAndSetVideos = async (topicParam: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/generate-lecture?topic=${encodeURIComponent(topicParam)}`);
      
      if (!response.ok) throw new Error(`Failed to fetch videos: ${response.status}`);
      
      const data = await response.json();
      if (!data?.videos) throw new Error("No videos found for this topic");
      
      const storageKey = `videoResources-${topicParam}`;
      localStorage.setItem(storageKey, JSON.stringify(data.videos));
      setVideos(data.videos);
    } catch (error: any) {
      setError(error.message || "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };  
    

  useEffect(() => {
    const topicParam = decodeURIComponent(searchParams.get("topic") || "");
    setTopic(topicParam);

    if (!topicParam) {
      setError("No topic provided");
      setLoading(false);
      return;
    }

    const storageKey = `videoResources-${topicParam}`;
    const storedVideos = localStorage.getItem(storageKey);
    if (storedVideos) {
      setVideos(JSON.parse(storedVideos));
      setLoading(false);
    } else {
      fetchAndSetVideos(topicParam);
    }
  }, [searchParams]);

  if (loading) return <LoadingState isDarkMode={isDarkMode} topic={topic} />;
  if (error) return <ErrorState isDarkMode={isDarkMode} error={error} onRetry={() => fetchAndSetVideos(topic)} />;

  return (
    <motion.main
      className={`min-h-screen relative overflow-hidden ${
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className={`absolute inset-0 ${
        isDarkMode 
          ? "bg-gradient-to-br from-purple-900/30 via-gray-900 to-blue-900/30"
          : "bg-gradient-to-br from-purple-100/30 via-gray-50 to-blue-100/30"
      }`}>
        <motion.div 
          className="absolute inset-0 bg-[length:100px_100px] opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at center, ${
              isDarkMode ? "#fff" : "#000"
            } 10%, transparent 20%)`,
          }}
        />
      </div>

      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1.5 h-1.5 rounded-full blur-[1px] ${
              isDarkMode
                ? "bg-gradient-to-r from-purple-400 to-blue-400"
                : "bg-gradient-to-r from-purple-200 to-blue-200"
            }`}
            initial={{
              scale: 0,
              x: Math.random() * 100 - 50 + "%",
              y: Math.random() * 100 - 50 + "%",
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <motion.button
        onClick={() => push('/')}
        className={`absolute top-6 left-6 p-2 rounded-full z-50 ${
          isDarkMode ? 'text-purple-400 hover:bg-purple-900/50' : 'text-purple-600 hover:bg-purple-100'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ArrowLeft size={24} />
      </motion.button>

      <motion.button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 p-3 rounded-full z-50 ${
          isDarkMode 
            ? "bg-purple-600 hover:bg-purple-700" 
            : "bg-yellow-400 hover:bg-yellow-500"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isDarkMode ? (
          <Moon className="w-6 h-6 text-white" />
        ) : (
          <Sun className="w-6 h-6 text-gray-900" />
        )}
      </motion.button>

      <div className="container mx-auto p-6 md:p-12 lg:p-16 relative z-10">
        <motion.div 
          className="mb-12 text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            className={`inline-flex p-4 rounded-2xl mb-4 ${
              isDarkMode
                ? "bg-gradient-to-r from-purple-500 to-blue-500"
                : "bg-gradient-to-r from-purple-400 to-blue-400"
            }`}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Sparkles className={`w-8 h-8 ${
              isDarkMode ? 'text-white' : 'text-gray-100'
            }`} />
          </motion.div>
          
          <h1 className={`text-5xl font-extrabold bg-clip-text text-transparent ${
            isDarkMode
              ? "bg-gradient-to-r from-purple-200 to-blue-200"
              : "bg-gradient-to-r from-purple-600 to-blue-600"
          }`}>
            Explore {topic}
          </h1>
          
          <p className={`text-xl max-w-2xl mx-auto ${
            isDarkMode ? "text-gray-300/90" : "text-gray-600/90"
          }`}>
            Select a video to begin your immersive learning journey
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <motion.div
              key={video.videoId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative group cursor-pointer rounded-2xl overflow-hidden transition-transform ${
                isDarkMode
                  ? "bg-gray-800/50 border border-purple-500/20 shadow-lg shadow-purple-900/10"
                  : "bg-white/80 border border-purple-600/20 shadow-lg shadow-purple-200/10"
              } ${
                selectedVideo === video.videoId 
                  ? "ring-2 ring-purple-400/90 scale-[1.02]" 
                  : "hover:ring-1 hover:ring-purple-400/40"
              }`}
              onClick={() => setSelectedVideo(video.videoId)}
            >
              <div className="relative aspect-video">
                <Image
                  src={`https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`}
                  alt={`Thumbnail of ${video.title}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${
                  isDarkMode
                    ? "from-black/90 via-transparent to-transparent"
                    : "from-black/70 via-transparent to-transparent"
                }`} />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className={`font-bold text-lg line-clamp-2 ${
                    isDarkMode ? "text-white" : "text-white"
                  } drop-shadow-lg`}>
                    {video.title}
                  </h3>
                  <p className={`text-sm mt-1.5 font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-200"
                  }`}>
                    {video.channel}
                  </p>
                </div>
                <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isDarkMode
                    ? "bg-black/70 text-gray-100"
                    : "bg-black/70 text-gray-100"
                }`}>
                  {video.duration}
                </div>
              </div>
              
              <div className={`p-4 border-t ${
                isDarkMode
                  ? "bg-gray-800/40 border-white/5"
                  : "bg-white/60 border-gray-200/50"
              }`}>
                <p className={`text-sm line-clamp-3 leading-relaxed ${
                  isDarkMode ? "text-gray-200/90" : "text-gray-700/90"
                }`}>
                  {video.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {selectedVideo && (
            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <motion.button
                onClick={() => push(`/lecture?videoId=${selectedVideo}&topic=${encodeURIComponent(topic)}`)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold shadow-lg transition-all ${
                  isDarkMode
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-purple-900/30"
                    : "bg-gradient-to-r from-purple-400 to-blue-400 hover:from-purple-500 hover:to-blue-500 text-gray-900 shadow-purple-200/30"
                }`}
              >
                <Sparkles className={`mr-3 h-6 w-6 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                } animate-pulse`} />
                Start Interactive Lecture
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}