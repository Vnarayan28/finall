import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { question, transcript, topic } = await req.json();

    if (!question || !transcript || !topic) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Step 1: Get Wikipedia summary
    const wikipediaRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`
    );
    const wikipediaJson = await wikipediaRes.json();
    const wikipediaSummary = wikipediaJson.extract || '';

    // Step 2: Build prompt
    const prompt = `You are a helpful assistant. 
Use the following video transcript and Wikipedia article to answer the user's question clearly and accurately.

Transcript:
${transcript}

Wikipedia Info:
${wikipediaSummary}

User Question:
${question}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error in /api/ask-bot:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
