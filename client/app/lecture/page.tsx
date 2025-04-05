'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { RetellWebClient } from 'retell-client-js-sdk'
import { Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Slide, Lecture } from '../types/index';

import Voice, { MessageTranscript } from '../components/Voice'
import Slideshow, { skipToSlide } from '../components/Slideshow'
import Sidebar from '../components/Sidebar'

export default function Page() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('videoId')
  const topic = searchParams.get('topic')
  
  const [lecture, setLecture] = useState<Lecture | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retellClient, setRetellClient] = useState<RetellWebClient | undefined>(undefined)
  const [funcCallSocket, setFuncCallSocket] = useState<WebSocket | undefined>(undefined)
  const [messages, setMessages] = useState<MessageTranscript[]>([])

  useEffect(() => {
    if (!videoId || !topic) {
      setError('Missing video ID or topic')
      setLoading(false)
      return
    }

    const fetchLecture = async () => {
      try {
        const response = await fetch(
          `/api/generate-lecture?videoId=${videoId}&topic=${encodeURIComponent(topic)}`
        )
        
        if (!response.ok) throw new Error('Failed to generate lecture')
        
        const data = await response.json()
        setLecture(data.lecture)
      } catch (err) {
        console.error('Lecture generation error:', err)
        setError(err instanceof Error ? err.message : 'Failed to generate lecture')
      } finally {
        setLoading(false)
      }
    }

    fetchLecture()

    return () => {
      if (funcCallSocket) {
        funcCallSocket.close()
      }
    }
  }, [videoId, topic])

  const getSlideIndex = () => {
    const slide_index = searchParams.get('slideIndex')
    return slide_index ? parseInt(slide_index) : 0
  }

  const handleFuncCallResult = (result: any) => {
    if (!lecture) return

    const curr_slide = getSlideIndex()
    switch (result.name) {
      case 'next_slide':
        if (curr_slide + 1 < lecture.slides.length) {
          skipToSlide(curr_slide + 1)
        }
        break
      case 'prev_slide':
        if (curr_slide - 1 >= 0) {
          skipToSlide(curr_slide - 1)
        }
        break
      case 'goto_slide':
        const slide_number = result.arguments['slide_number']
        if (slide_number >= 0 && slide_number < lecture.slides.length) {
          skipToSlide(slide_number)
        }
        break
      case 'new_slide':
        const newSlide: Slide = {
          title: result.arguments.lecture.slides[0].title,
          template_id: result.arguments.lecture.slides[0].template_id,
          images: result.arguments.lecture.slides[0].images,
          texts: result.arguments.lecture.slides[0].texts,
          speaker_notes: result.arguments.lecture.slides[0].speaker_notes,
        }
        const updatedLecture = { ...lecture }
        updatedLecture.slides.splice(curr_slide + 1, 0, newSlide)
        setLecture(updatedLecture)
        skipToSlide(curr_slide + 1)
        break
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-12 w-12 text-purple-500" />
        </motion.div>
        <p className="text-gray-500">Generating lecture for: {topic}</p>
      </div>
    )
  }

  if (error || !lecture) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error || 'Failed to generate lecture'}</p>
        <button
          onClick={() => window.history.back()}
          className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white"
        >
          Back to Videos
        </button>
      </div>
    )
  }

  return (
    <main className="flex flex-col h-full w-full bg-gray-50">
      <PanelGroup direction="vertical">
        <Panel defaultSize={40} minSize={30}>
          <div className="h-full p-4 bg-black">
            <LiteYouTubeEmbed
              id={lecture.video_id}
              title={lecture.title}
              wrapperClass="yt-lite rounded-xl overflow-hidden"
              playerClass="absolute inset-0 w-full h-full"
            />
          </div>
        </Panel>

        <PanelResizeHandle className="h-2 bg-gray-200 hover:bg-purple-500 transition-colors" />

        <Panel defaultSize={60}>
          <PanelGroup direction="horizontal">
            <Panel minSize={25} defaultSize={75}>
              <div className="flex flex-col items-center h-full">
                <div className="w-full max-w-4xl p-4">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {lecture.title}
                  </h1>
                  <div className="relative h-[600px]">
                    <div className="absolute z-20 inset-0 flex items-center justify-center">
                      <Voice
                        onFuncCallResult={handleFuncCallResult}
                        funcCallSocket={funcCallSocket}
                        retellClient={retellClient}
                        setFuncCallSocket={setFuncCallSocket}
                        setRetellClient={setRetellClient}
                        onUpdate={(update) => setMessages(update.transcript)}
                      />
                    </div>
                    {!funcCallSocket && (
                      <div className="absolute z-10 inset-0 bg-white/75 flex items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
                      </div>
                    )}
                    <Slideshow
                      lecture={lecture}
                      onSlideChange={(index) => {
                        const slide = lecture.slides[index]
                        funcCallSocket?.send(slide.speaker_notes || slide.title)
                      }}
                    />
                  </div>
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-purple-500 transition-colors" />

            <Panel
              defaultSize={25}
              minSize={25}
              className="border-l border-gray-200"
            >
              <Sidebar messages={messages} />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </main>
  )
}