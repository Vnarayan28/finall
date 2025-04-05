from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
import wikipedia

# Configure Wikipedia tool with error handling
class CustomWikipediaTool(WikipediaQueryRun):
    def _run(self, query: str) -> str:
        try:
            # Get summary with 3 sentences by default
            result = wikipedia.summary(
                query, 
                sentences=3,
                auto_suggest=False
            )
        except wikipedia.exceptions.PageError:
            result = "No relevant Wikipedia page found. Try another search term."
        except wikipedia.exceptions.DisambiguationError as e:
            options = "\n".join(e.options[:3])
            result = f"Multiple matches found. Please be more specific:\n{options}"
        except wikipedia.exceptions.WikipediaException as e:
            result = f"Wikipedia API error: {str(e)}"
            
        return result

# Initialize tool with custom configuration
wikipedia_tool = CustomWikipediaTool(
    api_wrapper=WikipediaAPIWrapper(
        top_k_results=3,
        doc_content_chars_max=400
    )
)