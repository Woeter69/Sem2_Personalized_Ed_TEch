from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class TopicProgressBase(BaseModel):
    topic_key: str
    is_completed: bool
    confidence_score: Optional[int] = None

class TopicProgressCreate(TopicProgressBase):
    pass

class TopicProgress(TopicProgressBase):
    id: int
    username: str
    last_studied: Optional[datetime] = None
    total_attempts: int

    class Config:
        from_attributes = True

class StudentProfileBase(BaseModel):
    full_name: str
    target_percentage: int
    math_fear_factor: int
    genuine_interest_level: int
    intended_11th_stream: str
    dream_career: str

class AcademicHistoryBase(BaseModel):
    grade_9_math_score: int
    weak_9th_grade_topics: str # JSON
    calculation_speed_rating: int

class LearningDNABase(BaseModel):
    learning_speed: str
    best_ability: str
    primary_style: str
    attention_span_minutes: int
    memory_type: str
    language_pref: str
    preferred_teachers: str # JSON

class StudyContextBase(BaseModel):
    study_location: str
    noise_level: str
    focus_time: str
    distractions: str # JSON
    session_length_pref: int
    studies_with_partner: bool
    has_mentor_at_home: bool

class ExamPsychologyBase(BaseModel):
    starts_paper_from: str
    fears_word_problems: bool
    calculation_error_freq: str
    test_anxiety_level: int

class StudentInterestBase(BaseModel):
    hobbies: str # JSON
    motivation_source: str

class ChapterMasteryBase(BaseModel):
    chapter_name: str
    self_rating: int
    interest_in_chapter: int
    status: Optional[str] = "Not Started"

class OnboardingData(BaseModel):
    profile: StudentProfileBase
    academic_history: AcademicHistoryBase
    learning_dna: LearningDNABase
    study_context: StudyContextBase
    exam_psychology: ExamPsychologyBase
    interests: StudentInterestBase
    chapter_mastery: List[ChapterMasteryBase]

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    profile: Optional[StudentProfileBase] = None
    academic_history: Optional[AcademicHistoryBase] = None
    learning_dna: Optional[LearningDNABase] = None
    study_context: Optional[StudyContextBase] = None
    exam_psychology: Optional[ExamPsychologyBase] = None
    interests: Optional[StudentInterestBase] = None
    chapter_mastery: List[ChapterMasteryBase] = []
    topic_progress: List[TopicProgress] = []
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
