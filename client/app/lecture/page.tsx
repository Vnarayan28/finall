'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation' 
import ChatBot from '../components/ChatBot'
import { FiMessageCircle, FiX } from 'react-icons/fi'

 const THIRTY_MINUTES_MS = 30 * 60 * 1000;
// const THIRTY_MINUTES_MS = 10 * 1000; // For testing 10 seconds

export default function LecturePage() {
  const searchParams = useSearchParams()
  const router = useRouter() 
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isAlertVisible, setIsAlertVisible] = useState(false)

  const videoId = searchParams.get('videoId')
  const topic = searchParams.get('topic')

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (videoId && topic && !isAlertVisible) {
      timerId = setTimeout(() => {
        setIsAlertVisible(true);
      }, THIRTY_MINUTES_MS);
    }

    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [isAlertVisible, videoId, topic]);

  const handleCheckStress = () => {
    console.log("Check your stress button clicked.");
    setIsAlertVisible(false);
    // router.push('/stress-check');
  };

  const handleExitLecture = () => {
    setIsAlertVisible(false); // Close the alert first
    // Option 1: Go back to the previous page
    // window.history.back();

    // Option 2: Navigate to a specific page (e.g., home)
    router.push('/');
  };

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
      <div className="bg-gray-900 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">{topic} Lecture</h1>
      </div>

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
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-gray-800 shadow-2xl transition-all duration-300 ease-in-out ${isChatOpen ? 'translate-x-0' : 'translate-x-full'} z-40`}>
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

      {/* Screen Time Alert Box */}
      {isAlertVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-sm sm:max-w-md text-center space-y-5 sm:space-y-6 mx-4">
            <div className="text-purple-500 text-5xl">⏰</div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Time Check!</h2>
            <p className="text-gray-700 text-sm sm:text-base">
              You've been viewing for 30 minutes.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mt-5 sm:mt-6">
              <button
                onClick={handleCheckStress}
                className="px-5 py-2.5 sm:px-6 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium w-full sm:w-auto text-sm sm:text-base"
              >
                Check Your Stress
              </button>
              <button
                onClick={handleExitLecture} 
                className="px-5 py-2.5 sm:px-6 sm:py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium w-full sm:w-auto text-sm sm:text-base" // Changed style to red for exit
              >
                Exit Lecture 
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}