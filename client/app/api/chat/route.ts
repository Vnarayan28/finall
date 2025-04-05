import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run";

import { z } from 'zod'
import { getVideoTranscript } from '../../lib/transcript';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY!)
const wikipedia = new WikipediaQueryRun({
  topKResults: 3,
  maxDocContentLength: 4000
})

// Input validation schema
const requestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  videoId: z.string().min(1, "Video ID cannot be empty"),
  topic: z.string().min(1, "Topic cannot be empty")
})

export async function POST(req: Request) {
  try {
    // Validate request body
    const body = await req.json()
    const validation = requestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { message, videoId, topic } = validation.data

    // Get knowledge sources in parallel
    const [transcript, wikiResults] = await Promise.allSettled([
      getVideoTranscript(videoId),
      wikipedia.call(`${topic}: ${message}`)
    ])

    // Handle potential errors in knowledge gathering
    const transcriptContent = transcript.status === 'fulfilled' ? transcript.value : ''
    const wikiContent = wikiResults.status === 'fulfilled' ? wikiResults.value : ''

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    
    const prompt = `As an educational assistant, synthesize this information:
    
    **Lecture Topic**: ${topic}
    **Video Transcript**: ${transcriptContent}
    **Wikipedia Context**: ${wikiContent}
    
    **Student Question**: ${message}
    
    Guidelines for response:
    1. Prioritize video transcript information
    2. Use Wikipedia for supplementary context
    3. Explain concepts clearly and simply
    4. Highlight key points from lecture
    5. If information conflicts, note this explicitly
    6. Format with clear paragraphs and bullet points when helpful
    7. Include relevant timestamps if available`

    const result = await model.generateContent(prompt)
    const response = await result.response.text()

    return NextResponse.json({ 
      response,
      sources: {
        videoId,
        wikipedia: wikiContent ? "Wikipedia" : null
      }
    })

  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    )
  }
}