"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, AlertCircle, ChevronRight } from "lucide-react";

type VideoResource = {
  title: string;
  videoId: string;
  description: string;
  channel: string;
  duration: string;
  status: "todo" | "inprogress" | "done";
};

export default function ResearchPage() {
  const [videos, setVideos] = useState<VideoResource[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const { push } = useRouter();
  const searchParams = useSearchParams();

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
      return;
    }

    setLoading(true);
    
    fetch("http://localhost:8000/get_videos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic: topicParam }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!data?.videos) {
          throw new Error("Invalid video data received");
        }
    
        localStorage.setItem(storageKey, JSON.stringify(data.videos));
        setVideos(data.videos);
      })
      .catch((error) => {
        console.error("Error:", error);
        setError(error.message);
      })
      .finally(() => setLoading(false));
  }, [searchParams]); 

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/10 to-blue-900/10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-6"
        >
          <Loader2 className="h-12 w-12 text-purple-500" />
        </motion.div>
        <motion.h1 
          className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Searching Videos for {topic}...
        </motion.h1>
        <motion.p 
          className="mt-4 text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Analyzing top educational content
        </motion.p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/10 to-blue-900/10">
        <AlertCircle className="h-12 w-12 text-red-500 mb-6" />
        <h1 className="text-3xl font-bold text-red-500">Error</h1>
        <p className="mt-4 text-gray-300 max-w-md text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900/10 to-blue-900/10">
      <div className="container mx-auto p-8 md:p-20">
        <motion.div 
          className="mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mb-4">
            Recommended Videos for {topic}
          </h1>
          <p className="text-gray-300 text-lg">
            Select a video to start your interactive learning experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video, index) => (
            <motion.div
              key={video.videoId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`relative group cursor-pointer rounded-xl overflow-hidden transition-all
                ${selectedVideo === video.videoId 
                  ? "ring-4 ring-purple-500/80 shadow-xl" 
                  : "hover:ring-2 hover:ring-purple-500/50"}`}
              onClick={() => setSelectedVideo(video.videoId)}
            >
              <div className="relative aspect-video">
                <Image
                  src={`https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`}
                  alt={video.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="text-white font-semibold line-clamp-2">{video.title}</h3>
                  <p className="text-gray-300 text-sm mt-1">{video.channel}</p>
                </div>
                <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-sm text-white">
                  {video.duration}
                </div>
              </div>
              
              <div className="p-4 bg-gray-800/50 backdrop-blur-sm">
                <p className="text-gray-300 text-sm line-clamp-3">{video.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {selectedVideo && (
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => push(`/lecture?videoId=${selectedVideo}&topic=${encodeURIComponent(topic)}`)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 rounded-xl text-lg font-semibold
                hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              <Sparkles className="inline-block mr-2 h-5 w-5" />
              Start Interactive Lecture
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}