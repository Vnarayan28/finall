export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");
    const topic = searchParams.get("topic");
  
    if (!videoId || !topic) {
      return new Response("Missing videoId or topic", { status: 400 });
    }
  
    const response = await fetch(`http://localhost:8000/generate-lecture?videoId=${videoId}&topic=${topic}`);
    const data = await response.json();
  
    return Response.json(data);
  }
  