from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from typing import List, Optional

from . import models, schemas, database, ai_service
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="EduFuture API")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth Settings
SECRET_KEY = "supersecretkey" # In production, use an environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Helper Functions ---
def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    # Hash a password for the first time
    # (bcrypt.hashpw returns bytes, we decode to string for storage)
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

# --- Auth Routes ---
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
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
    # 1. Profile
    db_profile = models.StudentProfile(username=current_user.username, **data.profile.dict())
    db.merge(db_profile)

    # 2. Academic History
    db_history = models.AcademicHistory(username=current_user.username, **data.academic_history.dict())
    db.merge(db_history)

    # 3. Learning DNA
    db_dna = models.LearningDNA(username=current_user.username, **data.learning_dna.dict())
    db.merge(db_dna)

    # 4. Study Context
    db_context = models.StudyContext(username=current_user.username, **data.study_context.dict())
    db.merge(db_context)

    # 5. Exam Psychology
    db_psych = models.ExamPsychology(username=current_user.username, **data.exam_psychology.dict())
    db.merge(db_psych)

    # 6. Interests
    db_interests = models.StudentInterest(username=current_user.username, **data.interests.dict())
    db.merge(db_interests)

    # 7. Chapter Mastery
    for chapter in data.chapter_mastery:
        db_mastery = models.ChapterMastery(username=current_user.username, **chapter.dict())
        db.add(db_mastery)

    db.commit()
    return {"message": "Onboarding complete"}

# --- Progress Routes ---
@app.get("/progress/", response_model=List[schemas.TopicProgress])
def get_progress(current_user: models.User = Depends(get_current_user)):
    return current_user.topic_progress

@app.post("/progress/")
def set_progress(progress_in: schemas.TopicProgressCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_progress = db.query(models.TopicProgress).filter(
        models.TopicProgress.username == current_user.username,
        models.TopicProgress.topic_key == progress_in.topic_key
    ).first()
    
    if db_progress:
        db_progress.is_completed = progress_in.is_completed
        if progress_in.confidence_score:
            db_progress.confidence_score = progress_in.confidence_score
        db_progress.last_studied = datetime.utcnow()
        db_progress.total_attempts += 1
    else:
        db_progress = models.TopicProgress(
            username=current_user.username,
            topic_key=progress_in.topic_key,
            is_completed=progress_in.is_completed,
            confidence_score=progress_in.confidence_score,
            last_studied=datetime.utcnow(),
            total_attempts=1
        )
        db.add(db_progress)
    
    db.commit()
    return {"message": "Progress updated"}

# --- Content Routes ---
# Strictly Class 10 CBSE NCERT Maths
SYLLABUS = {
    "Maths": {
        "Real Numbers": ["Fundamental Theorem of Arithmetic", "Revisiting Irrational Numbers"],
        "Polynomials": ["Geometrical Meaning of Zeroes", "Relationship between Zeroes and Coefficients"],
        "Linear Equations": ["Graphical Method of Solution", "Algebraic Methods (Substitution, Elimination)"],
        "Quadratic Equations": ["Solution by Factorisation", "Nature of Roots"],
        "Arithmetic Progressions": ["nth Term of an AP", "Sum of First n Terms of an AP"],
        "Triangles": ["Similarity of Triangles", "Criteria for Similarity", "Areas of Similar Triangles"],
        "Coordinate Geometry": ["Distance Formula", "Section Formula"],
        "Trigonometry": ["Trigonometric Ratios", "Trigonometric Ratios of Some Specific Angles", "Trigonometric Identities"],
        "Applications of Trigonometry": ["Heights and Distances"],
        "Circles": ["Tangent to a Circle", "Number of Tangents from a Point on a Circle"],
        "Surface Areas and Volumes": ["Surface Area of a Combination of Solids", "Volume of a Combination of Solids"],
        "Statistics": ["Mean of Grouped Data", "Mode of Grouped Data", "Median of Grouped Data"],
        "Probability": ["Probability - A Theoretical Approach"]
    }
}
@app.get("/syllabus/")
def get_syllabus():
    return SYLLABUS
@app.get("/chapter-details/{chapter_name}")
async def get_chapter_details(chapter_name: str, current_user: models.User = Depends(get_current_user)):
...
    }

@app.get("/topic-explanation/")
async def get_topic_info(chapter: str, topic: str, current_user: models.User = Depends(get_current_user)):
    user_context = {
        "primary_style": current_user.learning_dna.primary_style if current_user.learning_dna else "Visual",
        "interests": current_user.interests.hobbies if current_user.interests else "General"
    }
    content = ai_service.get_topic_explanation(chapter, topic, user_context)
    return content

        "primary_style": current_user.learning_dna.primary_style if current_user.learning_dna else "Visual",
        "preferred_teachers": current_user.learning_dna.preferred_teachers if current_user.learning_dna else "General",
        "interests": current_user.interests.hobbies if current_user.interests else "General"
    }
    
    # Get topics from static syllabus
    topics = []
    for subject in SYLLABUS:
        if chapter_name in SYLLABUS[subject]:
            topics = SYLLABUS[subject][chapter_name]
            break
            content = ai_service.get_chapter_content(chapter_name, user_context)

            # Get specific video data
            yt_video = youtube_service.search_youtube_videos(f"{chapter_name} class 10 maths {current_user.learning_dna.preferred_teachers if current_user.learning_dna else ''}")

            return {
                "chapter": chapter_name,
                "topics": topics,
                "ai_content": content.get("content", "Error generating content."),
                "video": yt_video if yt_video else {
                    "title": f"Search for {chapter_name}",
                    "url": f"https://www.youtube.com/results?search_query={chapter_name}+class+10+maths",
                    "thumbnail": "https://via.placeholder.com/320x180?text=No+Thumbnail",
                    "channel": "YouTube Search"
                }
            }

    from . import models, schemas, database, ai_service, youtube_service
    from .database import engine, get_db
    ...
    @app.get("/recommendations/")
    async def get_ai_recommendations(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
        # Identify weak chapters (rating <= 2)
        weak_chapters = [m.chapter_name for m in current_user.chapter_mastery if m.self_rating <= 2]

        # Get user DNA
        dna = current_user.learning_dna
        profile = current_user.profile

        # 1. Get smart queries from Gemini
        queries = ai_service.get_personalized_recommendations(
            user_profile=profile,
            weak_chapters=", ".join(weak_chapters) if weak_chapters else "None specifically, suggest advanced topics",
            favorite_teachers=dna.preferred_teachers if dna else "General",
            learning_speed=dna.learning_speed if dna else "Moderate"
        )

        # 2. Fetch real video data for each query
        final_recs = []
        for q in queries:
            yt_data = youtube_service.search_youtube_videos(q.get('title', '') + " " + (dna.preferred_teachers if dna else ""))
            if yt_data:
                final_recs.append({
                    "title": yt_data["title"],
                    "url": yt_data["url"],
                    "thumbnail": yt_data["thumbnail"],
                    "channel": yt_data["channel"],
                    "reason": q.get("reason", "Highly relevant to your profile.")
                })
            else:
                # Fallback to search link if API fails or no key
                final_recs.append(q)

        return final_recs

# --- AI Chat (Now Personalized) ---
@app.post("/chat/")
def chat(prompt: str, subject: str, current_user: models.User = Depends(get_current_user)):
    user_context = {
        "interests": current_user.interests.hobbies if current_user.interests else "General",
        "primary_style": current_user.learning_dna.primary_style if current_user.learning_dna else "Mixed",
        "fears_word_problems": current_user.exam_psychology.fears_word_problems if current_user.exam_psychology else False
    }
    
    response = ai_service.get_ai_doubt_solver(prompt, subject, user_context)
    return {
        "role": "assistant",
        "content": response
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
