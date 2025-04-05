import asyncio
import json
import os
from typing import List
from dotenv import load_dotenv
from tenacity import retry, wait_exponential, stop_after_attempt
from langchain import hub
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.tools import Tool
from langchain_community.utilities import GoogleSerperAPIWrapper
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.tools import tool

# Load environment variables
load_dotenv()

# Initialize Gemini with LangChain
llm = ChatGoogleGenerativeAI(
    model="gemini-pro",
    temperature=0.7,
    google_api_key=os.getenv("GEMINI_API_KEY")  # ✅ Corrected API Key reference
)

# Define Agent Prompt
AGENT_PROMPT = """
You are an agent that finds high-quality images for lecture slides based on a given topic.
You have access to the following tools:

**Tools:** {tools}
**Tool Names:** {tool_names}

**Instructions:**
- Find {num_images} images relevant to: {input}
- Use the `get_descriptions` tool to explain each image
- Return a JSON object with image URLs and descriptions.

{agent_scratchpad}
"""

# Define Tool for Image Descriptions
@tool
async def get_descriptions(images: List[str]) -> str:
    """Takes a list of images and explains why each image is relevant."""
    vision_model = ChatGoogleGenerativeAI(model="gemini-pro-vision", temperature=0.5)

    async def get_one_description(image: str) -> str:
        try:
            response = await vision_model.ainvoke([
                {"text": "Describe this image in two sentences."},
                {"url": image}
            ])
            return response.content
        except Exception as e:
            return f"Error: {str(e)}"

    image_descriptions = await asyncio.gather(*[get_one_description(image) for image in images])
    return json.dumps([
        {"image": img, "description": desc}
        for img, desc in zip(images, image_descriptions)
    ])

# Define Image Search Function with Retry Mechanism
@retry(wait=wait_exponential(multiplier=1, min=2, max=10), stop=stop_after_attempt(3))
async def get_images(topic: str, num_images=4):
    try:
        # Initialize Google Image Search
        search = GoogleSerperAPIWrapper(type="images")

        tools = [
            Tool(name="image_search", func=search.results, description="Finds images"),
            get_descriptions,
        ]

        # Create Prompt Template
        prompt_template = PromptTemplate.from_template(AGENT_PROMPT)
        
        # Create Agent
        agent = create_tool_calling_agent(
            llm,
            tools,
            prompt_template.partial(
                tools="\n".join([f"- {t.name}: {t.description}" for t in tools]),
                tool_names=", ".join([t.name for t in tools]),
                num_images=num_images
            )
        )

        # Execute Agent
        executor = AgentExecutor(agent=agent, tools=tools)
        response = await executor.ainvoke(
            {"input": f"Topic: {topic}. Find {num_images} images."}
        )

        return json.loads(response["output"])

    except json.JSONDecodeError:
        return {"error": "Failed to parse image response"}
    except Exception as e:
        raise RuntimeError(f"Image search failed: {str(e)}")
