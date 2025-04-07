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
    <div className="h-screen bg-gray-50">
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
      >
        {isChatOpen ? <FiX size={24} /> : <FiMessageCircle size={24} />}
      </button>

      <div className="max-w-7xl mx-auto p-6 h-full">
        <div className="flex flex-col h-full">
          {/* Header */}
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{topic} Lecture</h1>
          
          {/* Main Content */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video Player */}
            <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden aspect-video">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title={`${topic} lecture`}
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 ease-in-out transform ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Lecture Assistant</h2>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>
          
          {/* Chat Content */}
          <div className="flex-1 overflow-y-auto p-4">
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