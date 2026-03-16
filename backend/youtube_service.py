import os
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def search_youtube_videos(query, max_results=1):
    if not YOUTUBE_API_KEY:
        print("YouTube API Key is missing. Please set YOUTUBE_API_KEY in your .env file.")
        return {"error": "YouTube API Key missing"}

    try:
        youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
        request = youtube.search().list(
            q=query,
            part="snippet",
            type="video",
            maxResults=max_results
        )
        response = request.execute()

        videos = []
        for item in response.get("items", []):
            videos.append({
                "id": item["id"]["videoId"],
                "title": item["snippet"]["title"],
                "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
                "channel": item["snippet"]["channelTitle"],
                "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}"
            })
        if videos:
            return videos[0]
        else:
            print(f"No YouTube video found for query: '{query}'")
            return {"error": f"No video found for '{query}'"}
    except HttpError as e:
        print(f"YouTube API HTTP Error: {e.resp.status} - {e.content.decode()}")
        return {"error": f"YouTube API error: {e.resp.status}"}
    except Exception as e:
        print(f"General YouTube API Error: {e}")
        return {"error": f"General YouTube API error: {e}"}
