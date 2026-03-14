import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ExternalLink, Send, Bot, Maximize2, Minimize2, MessageSquare, X, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const API_URL = "http://localhost:8000";

const Dashboard: React.FC = () => {
  const [syllabus, setSyllabus] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  
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
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      try {
        const [syllabusRes, progressRes] = await Promise.all([
          axios.get(`${API_URL}/syllabus/`),
          axios.get(`${API_URL}/progress/`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setSyllabus(syllabusRes.data);
        setProgress(progressRes.data);

        // Fetch AI Recommendations
        setLoadingRecs(true);
        const recsRes = await axios.get(`${API_URL}/recommendations/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecommendations(recsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRecs(false);
      }
    };
    fetchData();
  }, []);

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
                  <p>Curating your learning path...</p>
                ) : recommendations.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {recommendations.map((rec, i) => (
                      <div key={i} className="video-recommendation" style={{ borderRadius: '8px', overflow: 'hidden', background: '#0f172a', border: '1px solid #334155' }}>
                        {rec.thumbnail && (
                          <div style={{ position: 'relative' }}>
                            <img src={rec.thumbnail} alt={rec.title} style={{ width: '100%', display: 'block' }} />
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '10px' }}>
                              <Play fill="white" size={24} />
                            </div>
                          </div>
                        )}
                        <div style={{ padding: '1rem' }}>
                          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.95rem', lineHeight: '1.4' }}>{rec.title}</h4>
                          <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#818cf8' }}>{rec.channel}</p>
                          <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>"{rec.reason}"</p>
                          <a href={rec.url} target="_blank" rel="noreferrer" className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', width: '100%', textAlign: 'center' }}>
                            Watch Now
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Complete profile to unlock AI power!</p>
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
