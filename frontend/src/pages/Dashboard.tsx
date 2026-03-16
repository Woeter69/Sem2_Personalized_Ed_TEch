import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ExternalLink, Send, Bot, Maximize2, Minimize2, MessageSquare, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? "http://localhost:8000" : "");

const Dashboard: React.FC = () => {
  const [syllabus, setSyllabus] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingCoreData, setLoadingCoreData] = useState(true); // New state for core data
  const [loadingRecs, setLoadingRecs] = useState(false); // Existing state for recommendations
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    const fetchCoreData = async () => {
      const token = localStorage.getItem('token');
      try {
        const [syllabusRes, progressRes] = await Promise.all([
          axios.get(`${API_URL}/syllabus/`),
          axios.get(`${API_URL}/progress/`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setSyllabus(syllabusRes.data);
        setProgress(progressRes.data);
      } catch (err) {
        console.error("Error fetching core dashboard data:", err);
      } finally {
        setLoadingCoreData(false);
      }
    };
    fetchCoreData();
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) return; // Only fetch if user data is available
      const token = localStorage.getItem('token');
      setLoadingRecs(true);
      try {
        const recsRes = await axios.get(`${API_URL}/recommendations/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecommendations(recsRes.data);
      } catch (err) {
        console.error("Error fetching AI recommendations:", err);
        setRecommendations([]); // Clear recommendations if error occurs
      } finally {
        setLoadingRecs(false);
      }
    };
    // Fetch recommendations once core data is loaded and user exists
    if (!loadingCoreData && user) {
        fetchRecommendations();
    }
  }, [loadingCoreData, user]); // Re-run when core data is loaded or user changes


  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/chat/?prompt=${encodeURIComponent(chatInput)}&subject=General Maths`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatHistory(prev => [...prev, res.data]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to my brain right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const calculateProgress = (subject: string) => {
    if (!syllabus || !syllabus[subject]) return 0;
    const chapters = syllabus[subject];
    let totalTopics = 0;
    Object.keys(chapters).forEach(c => totalTopics += chapters[c].length);
    const completedTopics = progress.filter(p => p.topic_key.startsWith(`${subject}_`) && p.is_completed).length;
    return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  };

  if (loadingCoreData) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', marginTop: '5rem' }}>
        <h2>Loading your personalized dashboard...</h2>
        <p>This should only take a moment.</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn" onClick={() => navigate('/')}>← Back to Home</button>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>Welcome, <b>{user?.profile?.full_name || user?.username}</b></span>
          <button className="btn" onClick={logout} style={{ background: '#ef4444' }}>Logout</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>Your Personalized Dashboard 📊</h1>
        {!showChat && (
          <button className="btn" onClick={() => setShowChat(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} /> Open Assistant
          </button>
        )}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: showChat ? '1.5fr 1fr' : '1fr', gap: '2rem', marginTop: '1rem' }}>
        <div className="left-column">
          <div className="quote-box">"The secret of getting ahead is getting started."</div>
          
          <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#818cf8' }}>🚀 Quick Stats</h3>
              <button className="btn" style={{ padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => navigate('/tracker')}>
                Full Tracker <Maximize2 size={14} style={{ marginLeft: '5px' }} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(129, 140, 248, 0.05)', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Total Math Progress</p>
                <h4 style={{ margin: '5px 0 0 0', color: '#818cf8', fontSize: '1.2rem' }}>{calculateProgress('Maths')}%</h4>
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Topics Done</p>
                <h4 style={{ margin: '5px 0 0 0', color: '#22c55e', fontSize: '1.2rem' }}>{progress.filter(p => p.is_completed).length}</h4>
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(234, 179, 8, 0.05)', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Weak Areas</p>
                <h4 style={{ margin: '5px 0 0 0', color: '#eab308', fontSize: '1.2rem' }}>{user?.chapter_mastery?.filter((m: any) => m.self_rating <= 2).length || 0}</h4>
              </div>
            </div>
          </div>

          <h3>Your Subjects</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {syllabus && Object.keys(syllabus).map(subject => {
              const perc = calculateProgress(subject);
              return (
                <div key={subject} className="card">
                  <h2>{subject}</h2>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${perc}%` }}></div>
                  </div>
                  <p>{perc}% Completed</p>
                  <button className="btn" style={{ width: '100%' }} onClick={() => navigate(`/subject/${subject}`)}>
                    Study {subject} ➔
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {showChat && (
          <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="recommendations-section">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles color="#818cf8" /> AI Recommended
              </h3>
              <div className="card" style={{ border: '1px solid #818cf8', maxHeight: '450px', overflowY: 'auto', padding: '1rem' }}>
                {loadingRecs ? (
                  <p>Curating your learning path with AI magic...</p>
                ) : recommendations.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {recommendations.map((rec, i) => (
                      <div key={i} className="video-recommendation" style={{ borderRadius: '8px', overflow: 'hidden', background: '#0f172a', border: '1px solid #334155' }}>
                        {rec.id ? (
                          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                            <iframe 
                              src={`https://www.youtube.com/embed/${rec.id}`}
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={rec.title}
                            ></iframe>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '1rem', background: '#334155', color: '#ef4444' }}>
                            <p>{rec.title || rec.error}</p>
                            <p>Check console for YouTube API errors. Is your YOUTUBE_API_KEY correct?</p>
                          </div>
                        )}
                        <div style={{ padding: '1rem' }}>
                          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.95rem', lineHeight: '1.4' }}>{rec.title}</h4>
                          <p style={{ margin: '0 0 8px 0', color: '#818cf8' }}>{rec.channel}</p>
                          <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>"{rec.reason}"</p>
                          {rec.url && (
                            <a href={rec.url} target="_blank" rel="noreferrer" className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', width: '100%', textAlign: 'center' }}>
                              Watch Now <ExternalLink size={14} style={{ marginLeft: '5px' }} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Complete profile to unlock AI power! Check YOUTUBE_API_KEY if videos aren't loading.</p>
                )}
              </div>
            </div>

            <div className={`ai-chat-section ${isMaximized ? 'maximized' : ''}`} 
                 style={isMaximized ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: '#0b0f19', padding: '2rem', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' } : { display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bot color="#818cf8" /> AI Assistant
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setIsMaximized(!isMaximized)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#818cf8' }}>{isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}</button>
                  <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171' }}><X size={20} /></button>
                </div>
              </h3>
              <div className="card" style={{ flex: 1, minHeight: isMaximized ? '0' : '400px', maxHeight: isMaximized ? 'none' : '500px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', border: '1px solid #334155' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#0f172a' }}>
                  {chatHistory.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8' }}>Hi! Ask me anything!</p>}
                  {chatHistory.map((msg, i) => (
                    <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: isMaximized ? '70%' : '90%' }}>
                      <div className="chat-bubble" style={{ backgroundColor: msg.role === 'user' ? '#4f46e5' : '#1e293b', padding: '0.75rem 1.25rem', borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0', fontSize: '0.95rem', lineHeight: '1.5', color: '#e2e8f0' }}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {isTyping && <div style={{ alignSelf: 'flex-start', color: '#94a3b8', fontSize: '0.8rem' }}>Thinking...</div>}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleChat} style={{ padding: '1rem', background: '#1e293b', display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="input-field" style={{ marginBottom: 0 }} placeholder="Ask a doubt..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
                  <button type="submit" className="btn" style={{ padding: '0.5rem', borderRadius: '50%', minWidth: '45px', minHeight: '45px' }}><Send size={20} /></button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
