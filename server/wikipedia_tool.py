from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper

wikipedia_tool = WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper())


# try:
#     result = wikipedia.summary(query, sentences=3)
# except wikipedia.exceptions.PageError:
#     result = "No Wikipedia page found for this topic."
# except wikipedia.exceptions.DisambiguationError as e:
#     result = f"Too many results. Try being more specific: {e.options[:3]}"
