import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Book, PlayCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? "http://localhost:8000" : "");

const Subject: React.FC = () => {
  const { subjectName } = useParams();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      try {
        const [syllabusRes, progressRes] = await Promise.all([
          axios.get(`${API_URL}/syllabus/`),
          axios.get(`${API_URL}/progress/`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setChapters(syllabusRes.data[subjectName as string]);
        setProgress(progressRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [subjectName]);

  const calculateChapterProgress = (chapter: string) => {
    if (!chapters || !chapters[chapter]) return 0;
    const topics = chapters[chapter];
    const completed = progress.filter(p => p.topic_key.startsWith(`Maths_${chapter}_`) && p.is_completed).length;
    return Math.round((completed / topics.length) * 100);
  };

  if (!chapters) return <div>Loading syllabus...</div>;

  return (
    <div className="fade-in">
      <button className="btn" onClick={() => navigate('/dashboard')} style={{ marginBottom: '2rem' }}>
        <ArrowLeft size={20} /> Back to Dashboard
      </button>
      
      <h1>📘 {subjectName} Curriculum</h1>
      <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Select a chapter to start your personalized study session.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {Object.keys(chapters).map(chapter => {
          const prog = calculateChapterProgress(chapter);
          return (
            <div key={chapter} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 1rem 0', color: '#e2e8f0' }}>{chapter}</h3>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${prog}%` }}></div>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{prog}% Mastery</p>
              </div>
              
              <button 
                className="btn" 
                style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                onClick={() => navigate(`/chapter/${chapter}`)}
              >
                <PlayCircle size={20} /> Start Learning
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Subject;
