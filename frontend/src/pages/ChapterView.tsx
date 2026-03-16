import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle, BookOpen, Lightbulb, Send, Bot, Maximize2, Minimize2, Info, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? "http://localhost:8000" : "");

const ChapterView: React.FC = () => {
  const { chapterName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<any[]>([]);
  
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topicInfo, setTopicInfo] = useState<string>('');
  const [loadingTopic, setLoadingTopic] = useState(false);

  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [, setIsTyping] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
        const [detailsRes, progressRes] = await Promise.all([
          axios.get(`${API_URL}/chapter-details/${encodeURIComponent(chapterName || '')}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/progress/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setData(detailsRes.data);
        setProgress(progressRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [chapterName]);

  const fetchTopicExplanation = async (topic: string) => {
    setSelectedTopic(topic);
    setLoadingTopic(true);
    setTopicInfo('');
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/topic-explanation/`, {
        params: { chapter: chapterName, topic: topic },
        headers: { Authorization: `Bearer ${token}` }
      });
      setTopicInfo(res.data.content);
    } catch (err) {
      setTopicInfo("Error loading explanation.");
    } finally {
      setLoadingTopic(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/chat/?prompt=${encodeURIComponent(chatInput)}&subject=${chapterName}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatHistory(prev => [...prev, res.data]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleTopicToggle = async (e: React.MouseEvent, topic: string, isDone: boolean) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    const topic_key = `Maths_${chapterName}_${topic}`;
    try {
      await axios.post(`${API_URL}/progress/`, { topic_key, is_completed: isDone }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const res = await axios.get(`${API_URL}/progress/`, { headers: { Authorization: `Bearer ${token}` } });
      setProgress(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const isCompleted = (topic: string) => {
    const key = `Maths_${chapterName}_${topic}`;
    return progress.find(p => p.topic_key === key)?.is_completed || false;
  };

  if (loading) return <div className="fade-in" style={{ textAlign: 'center', marginTop: '5rem' }}><h2>Preparing personalized tuition...</h2></div>;
  if (!data) return <div>Error loading data.</div>;

  return (
    <div className="fade-in" style={{ paddingBottom: '5rem' }}>
      <button className="btn" onClick={() => navigate('/dashboard')} style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{chapterName}</h1>
      <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2rem' }}>Personalized session for <b>{user?.profile?.full_name}</b></p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }}>
        <div className="main-content">
          
          {/* VIDEO EMBED */}
          {data.video?.id ? (
            <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #818cf8', marginBottom: '2rem' }}>
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                <iframe 
                  src={`https://www.youtube.com/embed/${data.video.id}`}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={data.video.title}
                ></iframe>
              </div>
              <div style={{ padding: '1.2rem' }}>
                <h3 style={{ margin: '0 0 5px 0' }}>{data.video.title}</h3>
                <p style={{ color: '#818cf8', margin: '0' }}>{data.video.channel}</p>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '1rem', border: '1px solid #ef4444', marginBottom: '2rem' }}>
              <h3 style={{ color: '#ef4444', margin: '0 0 0.5rem 0' }}>Video Not Available</h3>
              <p>Error: {data.video?.title || "Unknown error"}. Please check your YOUTUBE_API_KEY and the console for details.</p>
              <a href={data.video?.url} target="_blank" rel="noreferrer" className="btn" style={{ background: '#334155', width: 'fit-content' }}>Search on YouTube</a>
            </div>
          )}

          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#818cf8' }}>
              <Lightbulb /> Master Class Notes
            </h3>
            <div className="markdown-content" style={{ marginTop: '1.5rem' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.ai_content}</ReactMarkdown>
            </div>
          </div>
        </div>

        <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#818cf8' }}>
              <BookOpen /> Topics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {data.topics.map((topic: string) => (
                <div 
                  key={topic} 
                  onClick={() => fetchTopicExplanation(topic)}
                  style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer',
                    background: isCompleted(topic) ? 'rgba(34, 197, 94, 0.05)' : '#0f172a', 
                    border: `1px solid ${isCompleted(topic) ? '#22c55e' : '#334155'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Info size={16} color="#818cf8" />
                    <span style={{ fontSize: '0.95rem' }}>{topic}</span>
                  </div>
                  <button onClick={(e) => handleTopicToggle(e, topic, !isCompleted(topic))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isCompleted(topic) ? '#22c55e' : '#94a3b8' }}>
                    <CheckCircle size={22} fill={isCompleted(topic) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {selectedTopic && (
            <div className="card fade-in" style={{ border: '1px solid #818cf8', background: '#1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#818cf8' }}>{selectedTopic}</h3>
                <button onClick={() => setSelectedTopic(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {loadingTopic ? (
                <p>Loading...</p>
              ) : (
                <div className="markdown-content" style={{ fontSize: '0.95rem' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{topicInfo}</ReactMarkdown>
                </div>
              )}
            </div>
          )}

          <div className={`chapter-ai-chat ${isMaximized ? 'maximized' : ''}`} style={isMaximized ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: '#0b0f19', padding: '2rem', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' } : { display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <Bot color="#818cf8" /> Chat
              <button onClick={() => setIsMaximized(!isMaximized)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#818cf8' }}>{isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}</button>
            </h3>
            <div className="card" style={{ height: isMaximized ? 'calc(100% - 60px)' : '400px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', border: '1px solid #334155' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#0f172a' }}>
                {chatHistory.map((msg, i) => (
                  <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                    <div style={{ backgroundColor: msg.role === 'user' ? '#4f46e5' : '#1e293b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleChat} style={{ padding: '0.75rem', background: '#1e293b', display: 'flex', gap: '0.5rem' }}>
                <input type="text" className="input-field" style={{ marginBottom: 0 }} placeholder="Ask..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
                <button type="submit" className="btn" style={{ padding: '0.5rem' }}><Send size={18} /></button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterView;
