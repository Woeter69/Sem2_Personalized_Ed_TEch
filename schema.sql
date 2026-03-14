-- Full-Spectrum Personalization Schema (NCERT Class 10 Maths)

-- 1. Authentication
CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Core Identity & Aspirations
CREATE TABLE IF NOT EXISTS student_profiles (
    username TEXT PRIMARY KEY,
    full_name TEXT,
    target_percentage INTEGER,
    math_fear_factor INTEGER, -- 1-10
    genuine_interest_level INTEGER, -- 1-10
    intended_11th_stream TEXT,
    dream_career TEXT,
    FOREIGN KEY (username) REFERENCES users (username)
);

-- 3. Academic Foundation
CREATE TABLE IF NOT EXISTS academic_history (
    username TEXT PRIMARY KEY,
    grade_9_math_score INTEGER,
    weak_9th_grade_topics TEXT, -- JSON string
    calculation_speed_rating INTEGER, -- 1-10
    FOREIGN KEY (username) REFERENCES users (username)
);

-- 4. Learning DNA & Cognitive Traits
CREATE TABLE IF NOT EXISTS learning_dna (
    username TEXT PRIMARY KEY,
    learning_speed TEXT,
    best_ability TEXT, -- "Logic", "Memory", "Calculation", "Visual"
    primary_style TEXT, -- "Visual", "Practice", "Theory"
    attention_span_minutes INTEGER,
    memory_type TEXT,
    language_pref TEXT,
    preferred_teachers TEXT, -- JSON string
    FOREIGN KEY (username) REFERENCES users (username)
);

-- 5. Study Environment & Routine
CREATE TABLE IF NOT EXISTS study_context (
    username TEXT PRIMARY KEY,
    study_location TEXT,
    noise_level TEXT,
    focus_time TEXT, -- "Morning", "Afternoon", "Night"
    distractions TEXT, -- JSON string
    session_length_pref INTEGER,
    studies_with_partner BOOLEAN,
    has_mentor_at_home BOOLEAN,
    FOREIGN KEY (username) REFERENCES users (username)
);

-- 6. Exam Psychology
CREATE TABLE IF NOT EXISTS exam_psychology (
    username TEXT PRIMARY KEY,
    starts_paper_from TEXT,
    fears_word_problems BOOLEAN,
    calculation_error_freq TEXT,
    test_anxiety_level INTEGER, -- 1-10
    FOREIGN KEY (username) REFERENCES users (username)
);

-- 7. Personal Interests
CREATE TABLE IF NOT EXISTS student_interests (
    username TEXT PRIMARY KEY,
    hobbies TEXT, -- JSON string
    motivation_source TEXT,
    FOREIGN KEY (username) REFERENCES users (username)
);

-- 8. Chapter Mastery (NCERT Class 10 Maths)
CREATE TABLE IF NOT EXISTS chapter_mastery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    chapter_name TEXT NOT NULL,
    self_rating INTEGER, -- 1-5
    interest_in_chapter INTEGER, -- 1-5
    status TEXT DEFAULT 'Not Started', -- "Strength", "Average", "Weakness"
    FOREIGN KEY (username) REFERENCES users (username)
);

-- 9. Detailed Topic Progress
CREATE TABLE IF NOT EXISTS topic_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    topic_key TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    confidence_score INTEGER, -- 1-5
    last_studied DATETIME,
    total_attempts INTEGER DEFAULT 0,
    FOREIGN KEY (username) REFERENCES users (username)
);
