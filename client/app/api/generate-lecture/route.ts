import { NextResponse } from 'next/server'
import { z } from 'zod'

const querySchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
  topic: z.string().min(1, "Topic is required")
})

export async function GET(req: Request) {
  try {
    console.log('Request received:', req.url)

    const { searchParams } = new URL(req.url)
    const validation = querySchema.safeParse({
      videoId: searchParams.get("videoId"),
      topic: searchParams.get("topic")
    })

    if (!validation.success) {
      console.error('Validation failed:', validation.error)
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { videoId, topic } = validation.data
    console.log('Fetching data for:', { videoId, topic })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const backendUrl = `http://localhost:8000/generate-lecture?videoId=${encodeURIComponent(videoId)}&topic=${encodeURIComponent(topic)}`
    console.log('Backend URL:', backendUrl)

    const response = await fetch(backendUrl, { signal: controller.signal })
    clearTimeout(timeout)

    console.log('Backend response status:', response.status)
    
    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Backend error response:', errorBody)
      throw new Error(`Backend error: ${response.status} - ${errorBody}`)
    }

    const data = await response.json()
    console.log('Backend response data:', data)

    return NextResponse.json(data)

  } catch (error) {
    console.error('Full error details:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}