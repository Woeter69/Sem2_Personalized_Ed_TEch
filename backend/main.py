from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from typing import List, Optional

from . import models, schemas, database, ai_service, youtube_service
from .database import engine, get_db
import asyncio

# --- Cache Setup ---
response_cache = {}

def get_cached_response(key):
    return response_cache.get(key)

def set_cached_response(key, value):
    response_cache[key] = value

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="EduFuture API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow()}

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None: raise credentials_exception
        user = db.query(models.User).filter(models.User.username == username).first()
        if user is None: raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    new_user = models.User(username=user.username, password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/onboarding/")
async def complete_onboarding(data: schemas.OnboardingData, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.merge(models.StudentProfile(username=current_user.username, **data.profile.dict()))
    db.merge(models.AcademicHistory(username=current_user.username, **data.academic_history.dict()))
    db.merge(models.LearningDNA(username=current_user.username, **data.learning_dna.dict()))
    db.merge(models.StudyContext(username=current_user.username, **data.study_context.dict()))
    db.merge(models.ExamPsychology(username=current_user.username, **data.exam_psychology.dict()))
    db.merge(models.StudentInterest(username=current_user.username, **data.interests.dict()))
    for chapter in data.chapter_mastery:
        db.add(models.ChapterMastery(username=current_user.username, **chapter.dict()))
    db.commit()
    return {"message": "Onboarding complete"}

@app.get("/progress/", response_model=List[schemas.TopicProgress])
def get_progress(current_user: models.User = Depends(get_current_user)):
    return current_user.topic_progress

@app.post("/progress/")
def set_progress(progress_in: schemas.TopicProgressCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_progress = db.query(models.TopicProgress).filter_by(username=current_user.username, topic_key=progress_in.topic_key).first()
    if db_progress:
        db_progress.is_completed = progress_in.is_completed
        db_progress.confidence_score = progress_in.confidence_score
        db_progress.last_studied = datetime.utcnow()
        db_progress.total_attempts += 1
    else:
        db.add(models.TopicProgress(username=current_user.username, **progress_in.dict(), last_studied=datetime.utcnow(), total_attempts=1))
    db.commit()
    return {"message": "Progress updated"}

SYLLABUS = { "Maths": { "Real Numbers": ["Fundamental Theorem of Arithmetic", "Revisiting Irrational Numbers"], "Polynomials": ["Geometrical Meaning of Zeroes", "Relationship between Zeroes and Coefficients"], "Linear Equations": ["Graphical Method of Solution", "Algebraic Methods (Substitution, Elimination)"], "Quadratic Equations": ["Solution by Factorisation", "Nature of Roots"], "Arithmetic Progressions": ["nth Term of an AP", "Sum of First n Terms of an AP"], "Triangles": ["Similarity of Triangles", "Criteria for Similarity", "Areas of Similar Triangles"], "Coordinate Geometry": ["Distance Formula", "Section Formula"], "Trigonometry": ["Trigonometric Ratios", "Trigonometric Ratios of Some Specific Angles", "Trigonometric Identities"], "Applications of Trigonometry": ["Heights and Distances"], "Circles": ["Tangent to a Circle", "Number of Tangents from a Point on a Circle"], "Surface Areas and Volumes": ["Surface Area of a Combination of Solids", "Volume of a Combination of Solids"], "Statistics": ["Mean of Grouped Data", "Mode of Grouped Data", "Median of Grouped Data"], "Probability": ["Probability - A Theoretical Approach"] } }

@app.get("/syllabus/")
def get_syllabus():
    return SYLLABUS

@app.get("/chapter-details/{chapter_name}")
async def get_chapter_details(chapter_name: str, current_user: models.User = Depends(get_current_user)):
    cache_key = f"details_{current_user.username}_{chapter_name}"
    cached = get_cached_response(cache_key)
    if cached: return cached

    dna = current_user.learning_dna
    user_context = {
        "primary_style": dna.primary_style if dna else "Visual",
        "preferred_teachers": dna.preferred_teachers if dna else "General",
        "interests": current_user.interests.hobbies if current_user.interests else "General",
        "learning_speed": dna.learning_speed if dna else "Moderate"
    }
    topics = SYLLABUS["Maths"].get(chapter_name, [])
    
    # Concurrent Execution
    content_task = ai_service.get_chapter_content(chapter_name, user_context)
    yt_task = asyncio.to_thread(youtube_service.search_youtube_videos, f"{chapter_name} class 10 maths {user_context['preferred_teachers']}")
    
    content, yt_video = await asyncio.gather(content_task, yt_task)
    
    if yt_video and not yt_video.get("error"):
        video_data = {
            "id": yt_video["id"], "title": yt_video["title"], "url": yt_video["url"],
            "thumbnail": yt_video["thumbnail"], "channel": yt_video["channel"]
        }
    else:
        video_data = {
            "id": None, "title": yt_video.get("error", f"No video found for {chapter_name}"),
            "url": f"https://www.youtube.com/results?search_query={chapter_name}+class+10+maths",
            "thumbnail": "https://via.placeholder.com/320x180?text=No+Thumbnail", "channel": "YouTube Search"
        }
    
    result = { "chapter": chapter_name, "topics": topics, "ai_content": content.get("content", ""), "video": video_data }
    set_cached_response(cache_key, result)
    return result

@app.get("/topic-explanation/")
async def get_topic_info(chapter: str, topic: str, current_user: models.User = Depends(get_current_user)):
    cache_key = f"topic_{chapter}_{topic}"
    cached = get_cached_response(cache_key)
    if cached: return cached

    user_context = {
        "primary_style": current_user.learning_dna.primary_style if current_user.learning_dna else "Visual",
        "interests": current_user.interests.hobbies if current_user.interests else "General"
    }
    content = await ai_service.get_topic_explanation(chapter, topic, user_context)
    set_cached_response(cache_key, content)
    return content

@app.get("/recommendations/")
async def get_ai_recommendations(current_user: models.User = Depends(get_current_user)):
    weak_chapters = [m.chapter_name for m in current_user.chapter_mastery if m.self_rating <= 2]
    profile = current_user.profile
    dna = current_user.learning_dna
    interests = current_user.interests

    # Optimized Query Generation
    queries = await ai_service.get_personalized_recommendations(
        user_profile=profile,
        interests=interests.hobbies if interests else "General",
        weak_chapters=", ".join(weak_chapters) if weak_chapters else "None",
        favorite_teachers=dna.preferred_teachers if dna else "General",
        learning_speed=dna.learning_speed if dna else "Moderate"
    )
    
    # Concurrent YouTube searches
    yt_tasks = [asyncio.to_thread(youtube_service.search_youtube_videos, q.get('title', '')) for q in queries]
    yt_results = await asyncio.gather(*yt_tasks)
    
    final_recs = []
    for idx, yt_data in enumerate(yt_results):
        q = queries[idx]
        if yt_data and not yt_data.get("error"):
            final_recs.append({
                "id": yt_data["id"], "title": yt_data["title"], "url": yt_data["url"], "thumbnail": yt_data["thumbnail"],
                "channel": yt_data["channel"], "reason": q.get("reason", "")
            })
        else:
            final_recs.append({
                "id": None, "title": yt_data.get("error", q.get("title", "No video found")), "url": q.get("url", "#"),
                "thumbnail": "https://via.placeholder.com/120x90?text=No+Thumbnail", "channel": "Search Result"
            })
    return final_recs

@app.post("/chat/")
async def chat(prompt: str, subject: str, current_user: models.User = Depends(get_current_user)):
    user_context = {
        "interests": current_user.interests.hobbies if current_user.interests else "General",
        "primary_style": current_user.learning_dna.primary_style if current_user.learning_dna else "Mixed",
        "learning_speed": current_user.learning_dna.learning_speed if current_user.learning_dna else "Moderate",
        "fears_word_problems": current_user.exam_psychology.fears_word_problems if current_user.exam_psychology else False
    }
    response = await ai_service.get_ai_doubt_solver(prompt, subject, user_context)
    return {"role": "assistant", "content": response}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)