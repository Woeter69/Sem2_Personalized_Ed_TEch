import streamlit as st
import time

# ==========================================
# 1. PAGE CONFIGURATION & CUSTOM CSS (FUTURISTIC THEME)
# ==========================================
# We set the page layout to wide and inject custom CSS to give it a dark, glowing, futuristic vibe.
st.set_page_config(page_title="EduFuture Tracker", layout="wide", initial_sidebar_state="collapsed")

# Injecting Custom CSS for Animations and Dark/Futuristic styling
st.markdown("""
    <style>
    /* Dark theme background and futuristic glowing accents */
    .stApp {
        background-color: #0b0f19;
        color: #e2e8f0;
    }
    
    /* Fade-in animation for page transitions */
    .fade-in {
        animation: fadeIn 0.8s ease-in-out;
    }
    @keyframes fadeIn {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
    }
    
    /* Styling for quote banners */
    .quote-box {
        background: linear-gradient(90deg, #1e1b4b, #312e81);
        border-left: 5px solid #818cf8;
        padding: 15px;
        border-radius: 5px;
        font-style: italic;
        margin-bottom: 20px;
        box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
    }
    
    /* Progress bar custom colors */
    .stProgress > div > div > div {
        background-color: #6366f1;
    }
    </style>
""", unsafe_allow_html=True)

# ==========================================
# 2. MOCK DATA & SYLLABUS STRUCTURE
# ==========================================
# MANUAL CHANGE NEEDED HERE: Update this dictionary with the full, exhaustive syllabus.
# Currently populated with sample data for demonstration.
SYLLABUS = {
    "Science": {
        "Chemical Reactions & Equations": ["Chemical Equations", "Types of Chemical Reactions", "Oxidation & Reduction"],
        "Acids, Bases & Salts": ["Chemical properties of Acids", "pH Scale", "Importance of pH in everyday life"],
        "Light: Reflection & Refraction": ["Spherical Mirrors", "Refraction of Light", "Lenses"]
    },
    "Maths": {
        "Real Numbers": ["Fundamental Theorem of Arithmetic", "Irrational Numbers"],
        "Polynomials": ["Geometrical Meaning of Zeroes", "Relationship between Zeroes and Coefficients"],
    },
    "English": {"First Flight": ["A Letter to God", "Nelson Mandela", "Two Stories about Flying"]},
    "Hindi": {"Kshitij": ["Surdas Ke Pad", "Ram-Lakshman Parshuram Samvad"]},
    "SST": {"History": ["The Rise of Nationalism in Europe", "Nationalism in India"]},
    "Computer Science": {"IT Basics": ["Internet Basics", "Web Services", "HTML Intro"]}
}

# ==========================================
# 3. SESSION STATE INITIALIZATION
# ==========================================
# We use session state to remember where the user is, their progress, and their preferences.
if 'page' not in st.session_state:
    st.session_state.page = 'home' # Pages: home, assessment, dashboard, subject
if 'current_subject' not in st.session_state:
    st.session_state.current_subject = None
if 'progress' not in st.session_state:
    st.session_state.progress = {} # Format: "Subject_Chapter_Subtopic": True/False
if 'learning_style' not in st.session_state:
    st.session_state.learning_style = None # e.g., Animation, Example-based
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []

# Navigation Helper Function
def navigate_to(page_name, subject=None):
    st.session_state.page = page_name
    if subject:
        st.session_state.current_subject = subject

# Progress Helper Function
def get_subject_progress(subject):
    if subject not in SYLLABUS: return 0
    total_topics = sum(len(topics) for topics in SYLLABUS[subject].values())
    completed_topics = sum(1 for key, val in st.session_state.progress.items() if key.startswith(f"{subject}_") and val)
    return int((completed_topics / total_topics) * 100) if total_topics > 0 else 0

# ==========================================
# 4. PAGE RENDERING FUNCTIONS
# ==========================================

def render_home():
    """Renders the attractive landing page."""
    st.markdown('<div class="fade-in">', unsafe_allow_html=True)
    st.markdown("<h1 style='text-align: center; color: #818cf8; font-size: 4rem;'>EduFuture</h1>", unsafe_allow_html=True)
    st.markdown("<h3 style='text-align: center;'>Your Personalized AI Progress Tracker</h3><hr>", unsafe_allow_html=True)
    
    st.markdown('<div class="quote-box">"Education is the passport to the future, for tomorrow belongs to those who prepare for it today." - Malcolm X</div>', unsafe_allow_html=True)
    
    st.write("### Choose Your Goal")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.info("🎯 **Class 10 Boards**\n\nStart your personalized journey.")
        if st.button("Select Class 10", use_container_width=True):
            # If they haven't set a learning style, send to assessment, else dashboard
            if st.session_state.learning_style is None:
                navigate_to('assessment')
                st.rerun()
            else:
                navigate_to('dashboard')
                st.rerun()
                
    with col2:
        st.error("🚀 **JEE Mains / Adv**\n\n(Coming Soon)")
        st.button("Select JEE", disabled=True, use_container_width=True)
        
    with col3:
        st.success("🧬 **NEET**\n\n(Coming Soon)")
        st.button("Select NEET", disabled=True, use_container_width=True)
    
    st.markdown('</div>', unsafe_allow_html=True)


def render_assessment():
    """Renders the 5-question mock assessment and learning style selector."""
    st.markdown('<div class="fade-in">', unsafe_allow_html=True)
    st.title("Let's Personalize Your Content 🧠")
    st.markdown('<div class="quote-box">"Knowing yourself is the beginning of all wisdom."</div>', unsafe_allow_html=True)
    
    st.write("We noticed you are new here! Let's figure out how you learn best and test your current baseline.")
    
    # MANUAL CHANGE NEEDED HERE: Hook this up to your actual AI/logic to process the results
    st.subheader("1. How do you prefer to learn?")
    style = st.radio("Select your learning style:", ["I like real-world Examples 🌍", "I prefer Visuals and Animations 🎬", "I like reading detailed Text 📚"])
    
    st.subheader("2. Quick Baseline Quiz (Science & Maths)")
    # Mock Quiz - In reality, you'd calculate a score to define their starting level (Basic, Med, Adv)
    q1 = st.radio("Q1: What is the valency of Carbon?", ["2", "4", "6", "8"])
    q2 = st.radio("Q2: Which lens is used to correct Myopia?", ["Convex", "Concave", "Bifocal", "None"])
    q3 = st.radio("Q3: Are all rational numbers real numbers?", ["Yes", "No"])
    q4 = st.radio("Q4: Who wrote 'A Letter to God'?", ["G.L. Fuentes", "Nelson Mandela", "Robert Frost"])
    q5 = st.radio("Q5: What was the main aim of the French Revolution?", ["Monarchy", "Democracy & Nationalism", "Dictatorship"])
    
    if st.button("Submit & Generate My Course 🚀", type="primary"):
        with st.spinner("Analyzing your profile & curating YouTube teachers..."):
            time.sleep(2) # Fake processing time for transitional effect
            st.session_state.learning_style = style
            navigate_to('dashboard')
            st.rerun()
            
    st.markdown('</div>', unsafe_allow_html=True)


def render_dashboard():
    """Renders the main Class 10 subject dashboard."""
    st.markdown('<div class="fade-in">', unsafe_allow_html=True)
    if st.button("← Back to Home"):
        navigate_to('home')
        st.rerun()
        
    st.title("Class 10 Board Dashboard 📊")
    st.markdown('<div class="quote-box">"Focus on the step in front of you, not the whole staircase."</div>', unsafe_allow_html=True)
    
    st.write("### Your Subjects")
    
    # Create a grid layout for subjects
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
    """Renders the specific syllabus, resources, checklist, and AI doubt solver for a subject."""
    subject = st.session_state.current_subject
    st.markdown('<div class="fade-in">', unsafe_allow_html=True)
    
    if st.button("← Back to Dashboard"):
        navigate_to('dashboard')
        st.rerun()
        
    st.title(f"📘 {subject} Workspace")
    st.markdown(f'<div class="quote-box">"Push yourself, because no one else is going to do it for you."</div>', unsafe_allow_html=True)
    
    # Subject Overall Progress
    progress = get_subject_progress(subject)
    st.progress(progress / 100.0, text=f"Overall {subject} Progress: {progress}%")
    st.divider()
    
    # Layout: Left side for Syllabus Tracker, Right side for AI Chatbot
    col_content, col_chat = st.columns([2, 1])
    
    with col_content:
        st.subheader("Curated Syllabus")
        # Loop through chapters in the subject
        for chapter, subtopics in SYLLABUS[subject].items():
            with st.expander(f"📁 Chapter: {chapter}"):
                for topic in subtopics:
                    # Unique key for session state based on hierarchy
                    state_key = f"{subject}_{chapter}_{topic}"
                    
                    # Row for the checkbox and resources
                    col_check, col_res = st.columns([2, 1])
                    
                    with col_check:
                        # Update state immediately when clicked
                        checked = st.checkbox(topic, value=st.session_state.progress.get(state_key, False), key=state_key)
                        st.session_state.progress[state_key] = checked
                        
                    with col_res:
                        # MANUAL CHANGE NEEDED HERE: Insert actual database links here for videos, texts, and quizzes based on learning style
                        st.markdown("""
                            <a href='#' style='text-decoration:none; font-size:1.2rem;'>🎥</a> &nbsp;
                            <a href='#' style='text-decoration:none; font-size:1.2rem;'>📝</a> &nbsp;
                            <a href='#' style='text-decoration:none; font-size:1.2rem;'>❓</a>
                        """, unsafe_allow_html=True)
                        
    with col_chat:
        st.subheader("AI Doubt Solver 🤖")
        st.info(f"Ask any doubt related to {subject} here.")
        
        # Chat history display container
        chat_container = st.container(height=400)
        with chat_container:
            for message in st.session_state.chat_history:
                with st.chat_message(message["role"]):
                    st.markdown(message["content"])
                    
        # Chat input
        # MANUAL CHANGE NEEDED HERE: Hook this up to OpenAI / Gemini / Claude API
        prompt = st.chat_input("Type your doubt here...")
        if prompt:
            # 1. Add user message
            st.session_state.chat_history.append({"role": "user", "content": prompt})
            with chat_container:
                with st.chat_message("user"):
                    st.markdown(prompt)
                
            # 2. Mock AI response
            bot_reply = f"That's a great question about {subject}! Since this is a prototype, I am simulating an answer. In the real app, I will explain '{prompt}' perfectly."
            st.session_state.chat_history.append({"role": "assistant", "content": bot_reply})
            with chat_container:
                with st.chat_message("assistant"):
                    st.markdown(bot_reply)
                    
    st.markdown('</div>', unsafe_allow_html=True)


# ==========================================
# 5. MAIN ROUTER LOGIC
# ==========================================
# This acts as the engine, rendering the correct page based on our session state.
if st.session_state.page == 'home':
    render_home()
elif st.session_state.page == 'assessment':
    render_assessment()
elif st.session_state.page == 'dashboard':
    render_dashboard()
elif st.session_state.page == 'subject':
    render_subject()