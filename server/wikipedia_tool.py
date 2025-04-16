import wikipedia

def get_wikipedia_content(topic: str) -> str:
    try:
        return wikipedia.summary(topic, sentences=3, auto_suggest=False)
    except wikipedia.exceptions.PageError:
        return "No relevant Wikipedia page found."
    except wikipedia.exceptions.DisambiguationError as e:
        return f"Multiple matches found. Please be more specific: {', '.join(e.options[:3])}"
    except wikipedia.exceptions.WikipediaException as e:
        return f"Wikipedia API error: {str(e)}"