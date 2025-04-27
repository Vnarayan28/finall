import { NextResponse, NextRequest } from 'next/server'
import { z } from 'zod'

const querySchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
  topic: z.string().min(1, "Topic is required")
})

export async function GET(req: Request) {

  const token = req.headers.get('Authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
  }
  
  const verificationUrl = new URL('http://localhost:8000/decode');

  try {
    console.log('Request received:', req.url)
    const verificationResponse = await fetch(verificationUrl.toString(), {
      method: 'POST',
      headers: {
        'token': token,
      },
      signal: AbortSignal.timeout(5000),
    });
    console.log('Verification status:', verificationResponse.status)
    if (!verificationResponse.ok) {
      let errorBody
      try {
        errorBody = await verificationResponse.json()
      } catch {
        errorBody = await verificationResponse.text()
      }
      console.error('Verification error response:', errorBody)
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    const verificationData = await verificationResponse.json();
    console.log('Verification data:', verificationData)
    
    
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

    const backendUrl = new URL('http://localhost:8000/generate-lecture')
    backendUrl.searchParams.set('videoId', videoId)
    backendUrl.searchParams.set('topic', topic)

    console.log('Backend URL:', backendUrl.toString())

    const response = await fetch(backendUrl.toString(), {
      signal: AbortSignal.timeout(5000) 
    })

    console.log('Backend response status:', response.status)
    
    if (!response.ok) {
      let errorBody
      try {
        errorBody = await response.json()
      } catch {
        errorBody = await response.text()
      }
      console.error('Backend error response:', errorBody)
      throw new Error(`Backend error: ${response.status} - ${JSON.stringify(errorBody)}`)
    }

    const data = await response.json()
    console.log('Backend response data:', data)

    return NextResponse.json(data)

  } catch (error) {
    console.error('Full error details:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}