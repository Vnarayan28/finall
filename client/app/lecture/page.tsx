'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ChatBot from '../components/ChatBot'
import { FiMessageCircle, FiX } from 'react-icons/fi'

export default function LecturePage() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('videoId')
  const topic = searchParams.get('topic')
  const [isChatOpen, setIsChatOpen] = useState(false)

  if (!videoId || !topic) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md text-center space-y-4 border border-gray-700/50 backdrop-blur-sm">
          <div className="text-purple-400 text-4xl animate-pulse">⚠️</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Missing Parameters
          </h2>
          <p className="text-gray-400">Please ensure both videoId and topic are provided.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl hover:scale-105 transition-transform font-medium text-white shadow-lg shadow-purple-500/20"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-sm z-40 p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          {topic} Lecture
        </h1>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative group">
        <div className="absolute inset-0 bg-black rounded-xl overflow-hidden shadow-2xl m-2">
          <iframe
            className="w-full h-full rounded-xl"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={`${topic} lecture`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Animated overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent pointer-events-none opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed bottom-6 right-6 bg-gradient-to-br from-purple-500 to-blue-500 text-white p-4 rounded-2xl shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 z-50 ${
          isChatOpen ? 'rotate-90 scale-95' : 'rotate-0 scale-100'
        } hover:scale-105`}
        aria-label={isChatOpen ? "Close chat" : "Open chat"}
      >
        {isChatOpen ? (
          <FiX size={24} className="transform transition-transform hover:rotate-180" />
        ) : (
          <FiMessageCircle size={24} className="transform transition-transform hover:scale-110" />
        )}
      </button>

      {/* Chat Backdrop */}
      {isChatOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsChatOpen(false)}
        />
      )}

      {/* Chat Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-gray-800/90 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-out ${
          isChatOpen ? 'translate-x-0' : 'translate-x-full'
        } z-50 border-l border-gray-700/50`}
      >
        <div className="flex flex-col h-full">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 bg-gray-800/80 border-b border-gray-700/50">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Lecture Assistant
            </h2>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-700/50 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
          
          {/* Chat Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/30">
            <ChatBot 
              videoId={videoId}
              topic={topic}
            />
          </div>
        </div>
      </div>
    </div>
  )
}