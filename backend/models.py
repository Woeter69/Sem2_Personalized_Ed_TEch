from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Time
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    username = Column(String, primary_key=True, index=True)
    password = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("StudentProfile", back_populates="owner", uselist=False)
    academic_history = relationship("AcademicHistory", back_populates="owner", uselist=False)
    learning_dna = relationship("LearningDNA", back_populates="owner", uselist=False)
    study_context = relationship("StudyContext", back_populates="owner", uselist=False)
    exam_psychology = relationship("ExamPsychology", back_populates="owner", uselist=False)
    interests = relationship("StudentInterest", back_populates="owner", uselist=False)
    chapter_mastery = relationship("ChapterMastery", back_populates="owner")
    topic_progress = relationship("TopicProgress", back_populates="owner")

class StudentProfile(Base):
    __tablename__ = "student_profiles"
    username = Column(String, ForeignKey("users.username"), primary_key=True)
    full_name = Column(String)
    target_percentage = Column(Integer)
    math_fear_factor = Column(Integer)
    genuine_interest_level = Column(Integer)
    intended_11th_stream = Column(String)
    dream_career = Column(String)
    owner = relationship("User", back_populates="profile")

class AcademicHistory(Base):
    __tablename__ = "academic_history"
    username = Column(String, ForeignKey("users.username"), primary_key=True)
    grade_9_math_score = Column(Integer)
    weak_9th_grade_topics = Column(String) # JSON
    calculation_speed_rating = Column(Integer)
    owner = relationship("User", back_populates="academic_history")

class LearningDNA(Base):
    __tablename__ = "learning_dna"
    username = Column(String, ForeignKey("users.username"), primary_key=True)
    learning_speed = Column(String)
    best_ability = Column(String)
    primary_style = Column(String)
    attention_span_minutes = Column(Integer)
    memory_type = Column(String)
    language_pref = Column(String)
    preferred_teachers = Column(String) # JSON
    owner = relationship("User", back_populates="learning_dna")

class StudyContext(Base):
    __tablename__ = "study_context"
    username = Column(String, ForeignKey("users.username"), primary_key=True)
    study_location = Column(String)
    noise_level = Column(String)
    focus_time = Column(String)
    distractions = Column(String) # JSON
    session_length_pref = Column(Integer)
    studies_with_partner = Column(Boolean)
    has_mentor_at_home = Column(Boolean)
    owner = relationship("User", back_populates="study_context")

class ExamPsychology(Base):
    __tablename__ = "exam_psychology"
    username = Column(String, ForeignKey("users.username"), primary_key=True)
    starts_paper_from = Column(String)
    fears_word_problems = Column(Boolean)
    calculation_error_freq = Column(String)
    test_anxiety_level = Column(Integer)
    owner = relationship("User", back_populates="exam_psychology")

class StudentInterest(Base):
    __tablename__ = "student_interests"
    username = Column(String, ForeignKey("users.username"), primary_key=True)
    hobbies = Column(String) # JSON
    motivation_source = Column(String)
    owner = relationship("User", back_populates="interests")

class ChapterMastery(Base):
    __tablename__ = "chapter_mastery"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, ForeignKey("users.username"))
    chapter_name = Column(String)
    self_rating = Column(Integer)
    interest_in_chapter = Column(Integer)
    status = Column(String, default="Not Started")
    owner = relationship("User", back_populates="chapter_mastery")

class TopicProgress(Base):
    __tablename__ = "topic_progress"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, ForeignKey("users.username"))
    topic_key = Column(String)
    is_completed = Column(Boolean, default=False)
    confidence_score = Column(Integer)
    last_studied = Column(DateTime)
    total_attempts = Column(Integer, default=0)
    owner = relationship("User", back_populates="topic_progress")
