'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { RetellWebClient } from 'retell-client-js-sdk'
import { Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Slide, Lecture } from '../types/index'

import Voice, { MessageTranscript } from '../components/Voice'
import Slideshow, { skipToSlide } from '../components/Slideshow'
import Sidebar from '../components/Sidebar'
import { cn } from '../lib/utils'

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
          className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors duration-200"
        >
          Back to Videos
        </button>
      </div>
    )
  }

  return (
    <main className="flex flex-col h-full w-full bg-gradient-to-br from-gray-50 to-gray-100">
      <PanelGroup direction="vertical" className="h-full">
        <Panel defaultSize={40} minSize={30}>
          <div className="h-full p-6 bg-gray-900 rounded-b-2xl shadow-xl">
            <div className="relative h-full overflow-hidden rounded-xl border-2 border-gray-700/50 hover:border-purple-500/30 transition-all duration-300">
              <LiteYouTubeEmbed
                id={lecture.video_id}
                title={lecture.title}
                wrapperClass="yt-lite rounded-lg overflow-hidden"
                playerClass="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="h-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:h-3 transition-all duration-200 group">
          <div className="w-8 h-full mx-auto bg-gray-200/50 group-hover:bg-white rounded-full transition-colors" />
        </PanelResizeHandle>

        <Panel defaultSize={60}>
          <PanelGroup direction="horizontal">
            <Panel minSize={25} defaultSize={75}>
              <div className="flex flex-col h-full p-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-5xl mx-auto"
                >
                  <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 mb-6">
                    {lecture.title}
                  </h1>
                  <div className="relative h-[700px] rounded-xl shadow-lg border border-gray-200 bg-white">
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
                      <div className="absolute z-10 inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-xl">
                        <motion.div
                          initial={{ scale: 0.5 }}
                          animate={{ scale: 1 }}
                          className="text-center space-y-4"
                        >
                          <Loader2 className="h-16 w-16 animate-spin text-purple-600" />
                          <p className="text-gray-600 font-medium">
                            Initializing lecture session...
                          </p>
                        </motion.div>
                      </div>
                    )}

                    <Slideshow
                      lecture={lecture}
                      onSlideChange={(index) => {
                        const slide = lecture.slides[index];
                        funcCallSocket?.send(slide.speaker_notes || slide.title);
                      }}
                    />

                    <p className="rounded-xl">
                      {/* Add your paragraph content here */}
                    </p>
                  </div> {}
                </motion.div>
              </div>
            </Panel>


            <PanelResizeHandle className="w-2 bg-gradient-to-b from-purple-500 to-blue-500 hover:w-3 transition-all duration-200 group">
              <div className="h-8 w-full my-auto bg-gray-200/50 group-hover:bg-white rounded-full transition-colors" />
            </PanelResizeHandle>

            <Panel
              defaultSize={25}
              minSize={25}
              className="border-l border-gray-200/50 bg-gradient-to-b from-gray-50 to-white"
            >
              <Sidebar
                messages={messages}
                className="p-6 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
              />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </main>
  )
}