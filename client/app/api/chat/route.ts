import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { WikipediaQueryRun } from '@langchain/community/tools/wikipedia_query_run'
import { z } from 'zod'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const wikipedia = new WikipediaQueryRun({
  topKResults: 3,
  maxDocContentLength: 4000,
})

const requestSchema = z.object({
  message: z.string(),
  videoId: z.string(),
  topic: z.string(),
})

async function fetchTranscript(videoId: string): Promise<string> {
  try {
    const res = await fetch(`https://yt.lemnoslife.com/videos?part=transcript&id=${videoId}`)

    const contentType = res.headers.get("content-type") || ""
    if (!res.ok || !contentType.includes("application/json")) {
      console.error(`Transcript fetch failed for video ${videoId}:`, await res.text())
      return ''
    }

    const data = await res.json()
    const text = data?.transcript?.map((t: any) => t.text).join(' ') || ''
    return text
  } catch (err) {
    console.error('Transcript fetch error:', err)
    return ''
  }
}


export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, videoId, topic } = requestSchema.parse(body)

    const [transcript, wikiContent] = await Promise.all([
      fetchTranscript(videoId),
      wikipedia.call(topic),
    ])

    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro-latest' })

    const prompt = `
You are an educational assistant. Answer the user's question based on the topic, video transcript, and Wikipedia content.

Topic: ${topic}

Video Transcript:
${transcript || 'Not available'}

Wikipedia:
${wikiContent}

User's Question:
${message}

Answer:
    `.trim()

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ text })
  } catch (err: any) {
    console.error('Bot error:', err)
    return NextResponse.json({ error: err.message || 'Something went wrong' }, { status: 500 })
  }
}
