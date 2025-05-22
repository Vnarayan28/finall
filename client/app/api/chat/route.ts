import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { WikipediaQueryRun } from '@langchain/community/tools/wikipedia_query_run';
import { z } from 'zod';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const wikipedia = new WikipediaQueryRun({
  topKResults: 3,
  maxDocContentLength: 4000,
});

const requestSchema = z.object({
  message: z.string(),
  videoId: z.string(),
  topic: z.string(),
});

async function fetchTranscript(videoId: string): Promise<string> {
  try {
    const res = await fetch(`https://yt.lemnoslife.com/videos?part=transcript&id=${videoId}`);
    if (!res.ok) return '';
    const data = await res.json();
    return data?.transcript?.map((t: any) => t.text).join(' ') || '';
  } catch (err) {
    console.error('Transcript fetch error:', err);
    return '';
  }
}

async function getWikipediaContent(topic: string): Promise<string> {
  try {
    return await wikipedia.call(topic);
  } catch (err) {
    console.error('Wikipedia fetch error:', err);
    return 'No relevant Wikipedia information found.';
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, videoId, topic } = requestSchema.parse(body);

    // Fetch data from multiple sources independently
    const [transcript, wikiContent] = await Promise.all([
      fetchTranscript(videoId),
      getWikipediaContent(topic),
    ]);

    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });


    const prompt = `
You are an educational assistant. Answer the user's question based on the following information:

${transcript ? `Video Transcript (${topic}):\n${transcript}\n` : ''}
Wikipedia Content (${topic}):\n${wikiContent}

User Question: ${message}

Provide a detailed answer using ${transcript ? 'the video transcript and ' : ''}Wikipedia knowledge.
If information conflicts, mention both perspectives. Format your response in clear markdown.
    `.trim();

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error('Bot error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate answer' },
      { status: 500 }
    );
  }
}
