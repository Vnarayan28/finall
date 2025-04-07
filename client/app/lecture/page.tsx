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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center space-y-4">
          <div className="text-red-500 text-4xl">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800">Missing Parameters</h2>
          <p className="text-gray-600">Please ensure both videoId and topic are provided.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">{topic} Lecture</h1>
      </div>

      {/* Main Content - Full Page Video */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-black">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={`${topic} lecture`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Gradient overlay at bottom for controls */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
      </div>

      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-xl hover:bg-purple-700 transition-all z-50 transform ${isChatOpen ? 'rotate-90' : 'rotate-0'}`}
        aria-label={isChatOpen ? "Close chat" : "Open chat"}
      >
        {isChatOpen ? <FiX size={24} /> : <FiMessageCircle size={24} />}
      </button>

      {/* Chat Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-gray-800 shadow-2xl transition-all duration-300 ease-in-out ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Lecture Assistant</h2>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700"
            >
              <FiX size={20} />
            </button>
          </div>
          
          {/* Chat Content */}
          <div className="flex-1 overflow-y-auto">
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