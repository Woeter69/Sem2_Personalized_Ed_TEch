import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini with the new SDK
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    client = genai.Client(api_key=api_key)
    MODEL_ID = "gemini-2.5-flash"  # Flash is stable and fast
else:
    client = None

def clean_markdown(text):
    """Deep clean markdown to ensure react-markdown renders it correctly."""
    if not text: return ""
    # Remove code block wrappers if AI sends them
    text = text.replace('```markdown', '').replace('```json', '').replace('```', '')
    return text.strip()

async def get_personalized_recommendations(user_profile, interests, weak_chapters, favorite_teachers, learning_speed):
    if not client:
        return [{"title": "API Key Missing", "url": "#", "reason": "Please set GEMINI_API_KEY in .env"}]

    prompt = f"""
    You are an expert educational consultant for a 10th-grade CBSE NCERT student.
    
    Student Profile:
    - Interests: {interests}
    - Weak Chapters: {weak_chapters}
    - Favorite Teachers/Channels: {favorite_teachers}
    - Learning Speed: {learning_speed}
    - Dream Career: {user_profile.dream_career if user_profile else 'Professional'}
    
    Based on this, generate 5-6 highly specific YouTube search queries that would help this student.
    Return ONLY a raw JSON list of objects:
    [{{"title": "...", "url": "...", "reason": "..."}}]
    """

    try:
        response = await client.aio.models.generate_content(model=MODEL_ID, contents=prompt)
        text = clean_markdown(response.text)
        return json.loads(text)
    except Exception as e:
        print(f"Gemini Recommendation Error: {e}")
        return [{"title": "Check NCERT Solutions", "url": "https://www.youtube.com/results?search_query=ncert+class+10+maths", "reason": "Fallback: A great starting point for all students."}]

async def get_chapter_content(chapter_name, user_context):
    if not client: return {"error": "API Key Missing"}

    style = user_context.get('primary_style', 'Visual')
    teachers = user_context.get('preferred_teachers', 'General')
    interests = user_context.get('interests', 'General')

    prompt = f"""
    Teach the Class 10 NCERT Maths chapter: "{chapter_name}".
    
    STUDENT CONTEXT:
    - Style: {style}
    - Interests: {interests}
    
    INSTRUCTIONS:
    1. Use proper Markdown: ALWAYS put a space after # for headers.
    2. Start with a vivid introduction.
    3. Provide a "Concept Breakdown".
    4. MANDATORY: Provide at least 2 "Master Solved Examples" with step-by-step logic.
    5. Use {interests} analogies.
    
    Return the response in raw MARKDOWN format. Do not use code blocks like ```markdown.
    """

    try:
        response = await client.aio.models.generate_content(model=MODEL_ID, contents=prompt)
        return {"content": clean_markdown(response.text)}
    except Exception as e:
        return {"error": str(e)}

async def get_topic_explanation(chapter_name, topic_name, user_context):
    if not client: return {"error": "API Key Missing"}

    style = user_context.get('primary_style', 'Visual')
    interests = user_context.get('interests', 'General')

    prompt = f"""
    Explain the specific topic "{topic_name}" from the chapter "{chapter_name}" (Class 10 NCERT Maths).
    
    STUDENT CONTEXT:
    - Style: {style}
    - Interests: {interests}
    
    STRUCTURE:
    1. Use proper Markdown: ALWAYS put a space after # for headers.
    2. **What is it?**: Simple definition.
    3. **How it works**: Deep conceptual logic.
    4. **Solved Example**: Provide 1-2 actual math problems solved step-by-step.
    5. **Pro-Tip**: A shortcut or common mistake to avoid.
    
    Use {interests} analogies. Return ONLY raw MARKDOWN.
    """

    try:
        response = await client.aio.models.generate_content(model=MODEL_ID, contents=prompt)
        return {"content": clean_markdown(response.text)}
    except Exception as e:
        return {"error": str(e)}

async def get_ai_doubt_solver(prompt, subject, user_context):
    if not client: return "Gemini API key missing."

    system_prompt = f"""
    You are a friendly, expert tutor for Class 10 Maths. 
    Loves: {user_context.get('interests')}. Style: {user_context.get('primary_style')}.
    Answer briefly and clearly using analogies. Always include a small solved example if relevant.
    """

    try:
        response = await client.aio.models.generate_content(model=MODEL_ID, contents=system_prompt + "\n\nUser Question: " + prompt)
        return clean_markdown(response.text)
    except Exception as e:
        return f"Error: {str(e)}"
