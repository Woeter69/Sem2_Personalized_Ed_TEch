import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, ChevronLeft, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? "http://localhost:8000" : "");

const MATH_CHAPTERS = [
  "Real Numbers", "Polynomials", "Linear Equations", "Quadratic Equations", 
  "Arithmetic Progressions", "Triangles", "Coordinate Geometry", 
  "Trigonometry", "Applications of Trigonometry", "Circles", 
  "Surface Areas and Volumes", "Statistics", "Probability"
];

const Assessment: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    profile: {
      full_name: '', target_percentage: 90, math_fear_factor: 5, 
      genuine_interest_level: 5, intended_11th_stream: 'Science (PCM)', dream_career: ''
    },
    academic_history: { grade_9_math_score: 80, weak_9th_grade_topics: '[]', calculation_speed_rating: 5 },
    learning_dna: { 
      learning_speed: 'Moderate', best_ability: 'Logical Reasoning', primary_style: 'Visual', 
      attention_span_minutes: 30, memory_type: 'Visual', language_pref: 'English', preferred_teachers: '[]' 
    },
    study_context: { 
      study_location: 'Self Study', noise_level: 'Silent', focus_time: 'Evening', 
      distractions: '[]', session_length_pref: 45, studies_with_partner: false, has_mentor_at_home: false 
    },
    exam_psychology: { starts_paper_from: 'Section A', fears_word_problems: false, calculation_error_freq: 'Medium', test_anxiety_level: 5 },
    interests: { hobbies: '[]', motivation_source: 'Self' },
    chapter_mastery: MATH_CHAPTERS.map(ch => ({ chapter_name: ch, self_rating: 3, interest_in_chapter: 3 }))
  });

  // Local states for JSON fields to make editing easier
  const [coachingName, setCoachingName] = useState('');
  const [favTeachers, setFavTeachers] = useState('');
  const [hobbies, setHobbies] = useState('');

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleNestedChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section as keyof typeof prev], [field]: value }
    }));
  };

  const handleChapterChange = (index: number, field: string, value: any) => {
    const newMastery = [...formData.chapter_mastery];
    newMastery[index] = { ...newMastery[index], [field]: value };
    setFormData(prev => ({ ...prev, chapter_mastery: newMastery }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      // Stringify JSON fields before sending
      const finalData = {
        ...formData,
        learning_dna: { ...formData.learning_dna, preferred_teachers: JSON.stringify(favTeachers.split(',').map(s => s.trim())) },
        interests: { ...formData.interests, hobbies: JSON.stringify(hobbies.split(',').map(s => s.trim())) },
        // Append coaching name to study location if applicable
        study_context: { 
          ...formData.study_context, 
          study_location: formData.study_context.study_location === 'Coaching' ? `Coaching: ${coachingName}` : formData.study_context.study_location 
        }
      };

      await axios.post(`${API_URL}/onboarding/`, finalData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const res = await axios.get(`${API_URL}/users/me/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile. Please ensure all steps are filled.');
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="fade-in">
            <h2>Step 1: Your Identity 👤</h2>
            <div className="card">
              <label>Full Name</label>
              <input type="text" className="input-field" value={formData.profile.full_name} onChange={e => handleNestedChange('profile', 'full_name', e.target.value)} />
              
              <label>Target % in Boards</label>
              <input type="number" className="input-field" value={formData.profile.target_percentage} onChange={e => handleNestedChange('profile', 'target_percentage', parseInt(e.target.value))} />
              
              <label>Math Fear Factor (1-10): <b>{formData.profile.math_fear_factor}</b></label>
              <input type="range" min="1" max="10" className="input-field" value={formData.profile.math_fear_factor} onChange={e => handleNestedChange('profile', 'math_fear_factor', parseInt(e.target.value))} />
              
              <label>Genuine Interest in Maths (1-10): <b>{formData.profile.genuine_interest_level}</b></label>
              <input type="range" min="1" max="10" className="input-field" value={formData.profile.genuine_interest_level} onChange={e => handleNestedChange('profile', 'genuine_interest_level', parseInt(e.target.value))} />

              <label>Dream Career</label>
              <input type="text" className="input-field" placeholder="e.g. Astronaut, Engineer" value={formData.profile.dream_career} onChange={e => handleNestedChange('profile', 'dream_career', e.target.value)} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="fade-in">
            <h2>Step 2: Learning Style & Teachers 🧪</h2>
            <div className="card">
              <label>Learning Speed</label>
              <select className="input-field" value={formData.learning_dna.learning_speed} onChange={e => handleNestedChange('learning_dna', 'learning_speed', e.target.value)}>
                <option>Slow & Steady</option>
                <option>Moderate</option>
                <option>Fast Learner</option>
              </select>

              <label>Favorite Teachers / YouTube Channels</label>
              <input type="text" className="input-field" placeholder="e.g. Physics Wallah, Dear Sir (comma separated)" value={favTeachers} onChange={e => setFavTeachers(e.target.value)} />

              <label>How do you learn best?</label>
              <select className="input-field" value={formData.learning_dna.primary_style} onChange={e => handleNestedChange('learning_dna', 'primary_style', e.target.value)}>
                <option>Visual (Videos/Animations)</option>
                <option>Practice (Solved Examples)</option>
                <option>Theory (Reading/Logic)</option>
              </select>

              <label>Preferred Language</label>
              <select className="input-field" value={formData.learning_dna.language_pref} onChange={e => handleNestedChange('learning_dna', 'language_pref', e.target.value)}>
                <option>English</option>
                <option>Hindi</option>
                <option>Hinglish</option>
              </select>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="fade-in">
            <h2>Step 3: Study Environment 🏠</h2>
            <div className="card">
              <label>Where do you study?</label>
              <select className="input-field" value={formData.study_context.study_location} onChange={e => handleNestedChange('study_context', 'study_location', e.target.value)}>
                <option>Self Study (Home)</option>
                <option>Coaching</option>
                <option>School Library</option>
                <option>Online Classes</option>
              </select>

              {formData.study_context.study_location === 'Coaching' && (
                <>
                  <label>Coaching Name</label>
                  <input type="text" className="input-field" placeholder="e.g. Allen, Local Tuition" value={coachingName} onChange={e => setCoachingName(e.target.value)} />
                </>
              )}

              <label>Do you have a mentor at home? (Sibling/Parent)</label>
              <select className="input-field" value={formData.study_context.has_mentor_at_home ? "Yes" : "No"} onChange={e => handleNestedChange('study_context', 'has_mentor_at_home', e.target.value === "Yes")}>
                <option value="No">No, I study on my own</option>
                <option value="Yes">Yes, they help me with doubts</option>
              </select>

              <label>Peak Focus Time</label>
              <select className="input-field" value={formData.study_context.focus_time} onChange={e => handleNestedChange('study_context', 'focus_time', e.target.value)}>
                <option>Early Morning</option>
                <option>Afternoon</option>
                <option>Late Night</option>
              </select>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="fade-in">
            <h2>Step 4: Interests & Motivation ⚽</h2>
            <div className="card">
              <label>Your Hobbies / Interests</label>
              <input type="text" className="input-field" placeholder="e.g. Cricket, Gaming, Music (comma separated)" value={hobbies} onChange={e => setHobbies(e.target.value)} />

              <label>What motivates you most?</label>
              <select className="input-field" value={formData.interests.motivation_source} onChange={e => handleNestedChange('interests', 'motivation_source', e.target.value)}>
                <option>Personal Goal / Dream Career</option>
                <option>Competitive Spirit</option>
                <option>Parental / Teacher Encouragement</option>
                <option>Fear of Boards</option>
              </select>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="fade-in" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <h2>Step 5: Chapter Mastery 🗺️</h2>
            <p>Rate your current confidence in each chapter (1 = Clueless, 5 = Pro)</p>
            {formData.chapter_mastery.map((ch, idx) => (
              <div key={ch.chapter_name} className="card" style={{ marginBottom: '1rem' }}>
                <h4>{ch.chapter_name}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span>Confidence: <b>{ch.self_rating}</b></span>
                  <input type="range" min="1" max="5" value={ch.self_rating} onChange={e => handleChapterChange(idx, 'self_rating', parseInt(e.target.value))} />
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-container" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '2rem' }}>
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${(step / 5) * 100}%` }}></div>
      </div>
      <p style={{ textAlign: 'center', marginBottom: '2rem' }}>Step {step} of 5</p>

      {renderStep()}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        {step > 1 && (
          <button className="btn" style={{ background: '#334155' }} onClick={() => setStep(step - 1)}>
            <ChevronLeft size={20} /> Back
          </button>
        )}
        <div style={{ flex: 1 }}></div>
        {step < 5 ? (
          <button className="btn" onClick={() => setStep(step + 1)}>
            Next <ChevronRight size={20} />
          </button>
        ) : (
          <button className="btn" style={{ background: '#22c55e' }} onClick={handleSubmit}>
            Create My Journey <Save size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Assessment;
