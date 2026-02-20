import streamlit as st
import time
import sqlite3
import hashlib

# ==========================================
# 1. PAGE CONFIG & STYLING
# ==========================================
st.set_page_config(page_title="EduFuture Tracker", layout="wide", initial_sidebar_state="collapsed")

st.markdown("""
    <style>
    .stApp { background-color: #0b0f19; color: #e2e8f0; }
    .fade-in { animation: fadeIn 0.8s ease-in-out; }
    @keyframes fadeIn {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
    }
    .quote-box {
        background: linear-gradient(90deg, #1e1b4b, #312e81);
        border-left: 5px solid #818cf8; padding: 15px;
        border-radius: 5px; font-style: italic; margin-bottom: 20px;
        box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
    }
    .stProgress > div > div > div { background-color: #6366f1; }
    </style>
""", unsafe_allow_html=True)

# ==========================================
# 2. DATABASE SETUP & HELPER FUNCTIONS
# ==========================================
def init_db():
    conn = sqlite3.connect('edufuture.db')
    c = conn.cursor()
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (username TEXT PRIMARY KEY, password TEXT, learning_style TEXT)''')
    # Progress table
    c.execute('''CREATE TABLE IF NOT EXISTS progress 
                 (username TEXT, topic_key TEXT, is_completed BOOLEAN)''')
    conn.commit()
    conn.close()

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def create_user(username, password):
    conn = sqlite3.connect('edufuture.db')
    c = conn.cursor()
    try:
        c.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hash_password(password)))
        conn.commit()
        success = True
    except sqlite3.IntegrityError:
        success = False # Username already exists
    conn.close()
    return success

def verify_user(username, password):
    conn = sqlite3.connect('edufuture.db')
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE username=? AND password=?', (username, hash_password(password)))
    user = c.fetchone()
    conn.close()
    return user is not None

def update_db_learning_style(username, style):
    conn = sqlite3.connect('edufuture.db')
    c = conn.cursor()
    c.execute('UPDATE users SET learning_style=? WHERE username=?', (style, username))
    conn.commit()
    conn.close()

def get_db_learning_style(username):
    conn = sqlite3.connect('edufuture.db')
    c = conn.cursor()
    c.execute('SELECT learning_style FROM users WHERE username=?', (username,))
    res = c.fetchone()
    conn.close()
    return res[0] if res else None

def set_db_progress(username, topic_key, is_completed):
    conn = sqlite3.connect('edufuture.db')
    c = conn.cursor()
    c.execute('SELECT * FROM progress WHERE username=? AND topic_key=?', (username, topic_key))
    if c.fetchone():
        c.execute('UPDATE progress SET is_completed=? WHERE username=? AND topic_key=?', (is_completed, username, topic_key))
    else:
        c.execute('INSERT INTO progress (username, topic_key, is_completed) VALUES (?, ?, ?)', (username, topic_key, is_completed))
    conn.commit()
    conn.close()

def get_all_db_progress(username):
    conn = sqlite3.connect('edufuture.db')
    c = conn.cursor()
    c.execute('SELECT topic_key, is_completed FROM progress WHERE username=?', (username,))
    rows = c.fetchall()
    conn.close()
    return {row[0]: bool(row[1]) for row in rows}

# Initialize DB on script run
init_db()

# ==========================================
# 3. MOCK DATA & SYLLABUS
# ==========================================
SYLLABUS = {
    "Science": {
        "Chemical Reactions": ["Chemical Equations", "Types of Reactions", "Oxidation & Reduction"],
        "Light": ["Spherical Mirrors", "Refraction", "Lenses"]
    },
    "Maths": {
        "Real Numbers": ["Theorem of Arithmetic", "Irrational Numbers"],
        "Polynomials": ["Geometrical Meaning", "Zeroes and Coefficients"],
    }
}

# ==========================================
# 4. SESSION STATE
# ==========================================
if 'page' not in st.session_state: st.session_state.page = 'home'
if 'logged_in' not in st.session_state: st.session_state.logged_in = False
if 'username' not in st.session_state: st.session_state.username = ""
if 'current_subject' not in st.session_state: st.session_state.current_subject = None
if 'chat_history' not in st.session_state: st.session_state.chat_history = []

def navigate_to(page_name, subject=None):
    st.session_state.page = page_name
    if subject: st.session_state.current_subject = subject

def get_subject_progress(subject):
    if subject not in SYLLABUS: return 0
    total_topics = sum(len(topics) for topics in SYLLABUS[subject].values())
    user_progress = get_all_db_progress(st.session_state.username)
    completed = sum(1 for key, val in user_progress.items() if key.startswith(f"{subject}_") and val)
    return int((completed / total_topics) * 100) if total_topics > 0 else 0

def logout():
    st.session_state.logged_in = False
    st.session_state.username = ""
    navigate_to('home')

# ==========================================
# 5. PAGE RENDERING
# ==========================================
def render_home():
    st.markdown('<div class="fade-in">', unsafe_allow_html=True)
    st.markdown("<h1 style='text-align: center; color: #818cf8; font-size: 4rem;'>EduFuture</h1>", unsafe_allow_html=True)
    st.markdown("<h3 style='text-align: center;'>Your Personalized AI Progress Tracker</h3><hr>", unsafe_allow_html=True)
    
    if not st.session_state.logged_in:
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            st.write("### Access Your Portal")
            tab1, tab2 = st.tabs(["Login", "Sign Up"])
            
            with tab1:
                log_user = st.text_input("Username", key="log_user")
                log_pass = st.text_input("Password", type="password", key="log_pass")
                if st.button("Login", use_container_width=True):
                    if verify_user(log_user, log_pass):
                        st.session_state.logged_in = True
                        st.session_state.username = log_user
                        st.success(f"Welcome back, {log_user}!")
                        time.sleep(1)
                        st.rerun()
                    else:
                        st.error("Invalid username or password.")
            
            with tab2:
                reg_user = st.text_input("New Username", key="reg_user")
                reg_pass = st.text_input("New Password", type="password", key="reg_pass")
                if st.button("Sign Up", use_container_width=True):
                    if reg_user and reg_pass:
                        if create_user(reg_user, reg_pass):
                            st.success("Account created successfully! Please login.")
                        else:
                            st.error("Username already exists.")
                    else:
                        st.warning("Please fill all fields.")
    else:
        st.write(f"### Welcome, {st.session_state.username}! Choose Your Goal")
        if st.button("Logout", type="secondary"): 
            logout()
            st.rerun()
            
        col1, col2, col3 = st.columns(3)
        with col1:
            st.info("🎯 **Class 10 Boards**\n\nStart your personalized journey.")
            if st.button("Select Class 10", use_container_width=True):
                style = get_db_learning_style(st.session_state.username)
                if style is None:
                    navigate_to('assessment')
                else:
                    navigate_to('dashboard')
                st.rerun()
        with col2:
            st.error("🚀 **JEE Mains / Adv** (Coming Soon)")
        with col3:
            st.success("🧬 **NEET** (Coming Soon)")
            
    st.markdown('</div>', unsafe_allow_html=True)

def render_assessment():
    st.markdown('<div class="fade-in">', unsafe_allow_html=True)
    st.title("Let's Personalize Your Content 🧠")
    st.markdown('<div class="quote-box">"Knowing yourself is the beginning of all wisdom."</div>', unsafe_allow_html=True)
    
    st.write("We noticed you are new here! Let's figure out how you learn best.")
    style = st.radio("Select your learning style:", ["I like real-world Examples 🌍", "I prefer Visuals & Animations 🎬", "I like reading detailed Text 📚"])
    
    st.subheader("Quick Baseline Quiz")
    st.radio("Q1: What is the valency of Carbon?", ["2", "4", "6", "8"])
    
    if st.button("Submit & Generate My Course 🚀", type="primary"):
        with st.spinner("Analyzing your profile..."):
            update_db_learning_style(st.session_state.username, style)
            time.sleep(1.5)
            navigate_to('dashboard')
            st.rerun()
    st.markdown('</div>', unsafe_allow_html=True)

def render_dashboard():
    st.markdown('<div class="fade-in">', unsafe_allow_html=True)
    col1, col2 = st.columns([4, 1])
    with col1:
        if st.button("← Back to Home"):
            navigate_to('home')
            st.rerun()
    with col2:
        if st.button("Logout"):
            logout()
            st.rerun()
            
    st.title("Dashboard 📊")
    st.markdown('<div class="quote-box">"Focus on the step in front of you, not the whole staircase."</div>', unsafe_allow_html=True)
    
    cols = st.columns(3)
    for index, subject in enumerate(SYLLABUS.keys()):
        with cols[index % 3]:
            with st.container(border=True):
                st.subheader(subject)
                progress = get_subject_progress(subject)
                st.progress(progress / 100.0, text=f"{progress}% Completed")
                if st.button(f"Study {subject} ➔", key=f"btn_{subject}"):
                    navigate_to('subject', subject)
                    st.rerun()
    st.markdown('</div>', unsafe_allow_html=True)

def render_subject():
    subject = st.session_state.current_subject
    st.markdown('<div class="fade-in">', unsafe_allow_html=True)
    if st.button("← Back to Dashboard"):
        navigate_to('dashboard')
        st.rerun()
        
    st.title(f"📘 {subject} Workspace")
    progress = get_subject_progress(subject)
    st.progress(progress / 100.0, text=f"Overall {subject} Progress: {progress}%")
    st.divider()
    
    user_progress = get_all_db_progress(st.session_state.username)
    col_content, col_chat = st.columns([2, 1])
    
    with col_content:
        st.subheader("Curated Syllabus")
        for chapter, subtopics in SYLLABUS[subject].items():
            with st.expander(f"📁 Chapter: {chapter}"):
                for topic in subtopics:
                    state_key = f"{subject}_{chapter}_{topic}"
                    is_checked = user_progress.get(state_key, False)
                    
                    col_check, col_res = st.columns([2, 1])
                    with col_check:
                        # Update DB on change
                        if st.checkbox(topic, value=is_checked, key=state_key):
                            set_db_progress(st.session_state.username, state_key, True)
                        else:
                            set_db_progress(st.session_state.username, state_key, False)
                            
                    with col_res:
                        st.markdown("🎥 &nbsp; 📝 &nbsp; ❓")
                        
    with col_chat:
        st.subheader("AI Doubt Solver 🤖")
        chat_container = st.container(height=400)
        with chat_container:
            for message in st.session_state.chat_history:
                with st.chat_message(message["role"]): st.markdown(message["content"])
                
        prompt = st.chat_input("Type your doubt here...")
        if prompt:
            st.session_state.chat_history.append({"role": "user", "content": prompt})
            st.rerun()
    st.markdown('</div>', unsafe_allow_html=True)

# Router
if st.session_state.page == 'home': render_home()
elif st.session_state.page == 'assessment': render_assessment()
elif st.session_state.page == 'dashboard': render_dashboard()
elif st.session_state.page == 'subject': render_subject()