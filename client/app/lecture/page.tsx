'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ChatBot from '../components/ChatBot'

interface Lecture {
  video_id: string
  content: string
  slides?: Array<{
    title: string
    content: string
    duration: string
  }>
}

export default function LecturePage() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('videoId')
  const topic = searchParams.get('topic')

  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!videoId || !topic) {
      setError('Missing videoId or topic')
      setLoading(false)
      return
    }

    const fetchLecture = async () => {
      try {
        const res = await fetch(
          `/api/generate-lecture?videoId=${videoId}&topic=${encodeURIComponent(topic)}`
        )
        
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
        
        const data = await res.json()
        setLecture(data)
      } catch (err) {
        console.error('Error fetching lecture:', err)
        setError(err instanceof Error ? err.message : 'Failed to load lecture')
      } finally {
        setLoading(false)
      }
    }

    fetchLecture()
  }, [videoId, topic])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Video Player */}
        <div className="bg-black rounded-lg overflow-hidden">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={`${topic} lecture`}
            allowFullScreen
          ></iframe>
        </div>

        {/* Lecture Content */}
        <div className="bg-white rounded-lg shadow-md p-6 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-4">{topic} Lecture</h1>
          {lecture?.content && (
            <div className="prose max-w-none">
              {lecture.content}
            </div>
          )}
        </div>
      </div>

      {/* ChatBot */}
      <div className="border-t border-gray-200 p-4 h-96">
        {lecture && (
          <ChatBot 
            videoId={lecture.video_id}
            topic={topic || "unknown topic"}
          />
        )}
      </div>
    </div>
  )
}