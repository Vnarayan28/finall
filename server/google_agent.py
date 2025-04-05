from uagents import Agent, Context, Model
import google.generativeai as genai
from dotenv import load_dotenv
import os
import json
from langchain_community.utilities import GoogleSerperAPIWrapper
from langchain.agents import Tool, AgentExecutor, create_tool_calling_agent
from langchain.tools import tool
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Google Search API Wrapper
search = GoogleSerperAPIWrapper()

# Define Google Search Tool
google_search = Tool(
    name="google_search",
    func=search.results,
    description="Searches Google for the input query",
)

# Prompt for AI
AGENT_PROMPT = """
You are a lecture assistant. Find 1-2 high-quality, authoritative links related to the topic: {topic}.
Prioritize educational resources, research papers, or official documentation.
Provide the response in JSON format:
{
    "links": [
        {
            "url": "URL_HERE",
            "title": "TITLE_HERE"
        }
    ]
}
"""

# Define Message Model
class Message(Model):
    topic: str

# Initialize Google Agent
google = Agent(name="google", seed="google seed")

# Gemini AI Configuration
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-pro")

@google.on_message(model=Message)
async def google_message_handler(ctx: Context, sender: str, msg: Message):
    try:
        # Execute Google Search
        search_results = search.results(msg.topic)

        # Format search results into a string
        search_text = "\n".join(
            [f"{i+1}. {res['title']} - {res['link']}" for i, res in enumerate(search_results)]
        )

        # Construct prompt with search results
        prompt = AGENT_PROMPT.format(topic=msg.topic) + f"\n\nSearch Results:\n{search_text}"

        # Get response from Gemini
        response = model.generate_content(prompt)

        # Extract JSON from Gemini response
        try:
            json_response = json.loads(response.text.split("```json")[1].split("```")[0])
        except (IndexError, json.JSONDecodeError):
            json_response = {"error": "Failed to parse JSON response"}

        return json_response

    except Exception as e:
        logger.error(f"Google search failed: {e}")
        return {"error": "Search failed"}
