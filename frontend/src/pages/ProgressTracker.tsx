import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Award, Target } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? "http://localhost:8000" : "");

const ProgressTracker: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [syllabus, setSyllabus] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      } catch (err) {
        console.error("Error fetching tracker data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const calculateSubjectStats = () => {
    if (!syllabus || !syllabus.Maths) return [];
    
    const stats = Object.keys(syllabus.Maths).map(chapter => {
      const chapterTopics = syllabus.Maths[chapter];
      const completed = progress.filter(p => 
        p.topic_key.startsWith(`Maths_${chapter}_`) && p.is_completed
      ).length;
      const total = chapterTopics.length;
      return {
        name: chapter,
        completed,
        total,
        percentage: Math.round((completed / total) * 100),
        // Mastery score from user profile if available
        mastery: user?.chapter_mastery?.find((m: any) => m.chapter_name === chapter)?.self_rating || 0
      };
    });
    return stats;
  };

  const subjectStats = calculateSubjectStats();
  const totalCompleted = progress.filter(p => p.is_completed).length;
  

  if (loading) {
    return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}>Loading your statistics...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fade-in" 
      style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 style={{ margin: 0 }}>Progress Analytics 🎯</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '10px', background: 'rgba(129, 140, 248, 0.1)', borderRadius: '12px', color: '#818cf8' }}>
            <Award size={32} />
          </div>
          <div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>Rank</p>
            <h2 style={{ margin: 0 }}>Scholar</h2>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', color: '#22c55e' }}>
            <TrendingUp size={32} />
          </div>
          <div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>Learning Velocity</p>
            <h2 style={{ margin: 0 }}>High</h2>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '10px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '12px', color: '#eab308' }}>
            <Target size={32} />
          </div>
          <div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>Goals Met</p>
            <h2 style={{ margin: 0 }}>85%</h2>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        {/* 3D-Style Bar Chart */}
        <div className="card" style={{ minHeight: '400px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid #334155' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={20} color="#818cf8" /> Chapter Wise Mastery
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectStats}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8} />
                </linearGradient>
                <filter id="dropshadow" height="130%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                  <feOffset dx="2" dy="2" result="offsetblur" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.5" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Bar 
                dataKey="percentage" 
                fill="url(#barGradient)" 
                radius={[6, 6, 0, 0]} 
                filter="url(#dropshadow)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radial Mastery Chart */}
        <div className="card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Overall Curriculum Mastery</h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed', value: totalCompleted },
                    { name: 'Remaining', value: Math.max(0, 50 - totalCompleted) } // Example total topics = 50
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  <Cell fill="#818cf8" filter="url(#dropshadow)" />
                  <Cell fill="#1e293b" />
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <h2 style={{ margin: 0, color: '#818cf8' }}>{Math.round((totalCompleted / 50) * 100)}%</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Total Done</p>
            </div>
          </div>
        </div>

        {/* Learning Velocity Area Chart */}
        <div className="card" style={{ gridColumn: '1 / -1', minHeight: '350px' }}>
          <h3>Learning Velocity (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={[
              { day: 'Mon', count: 2 }, { day: 'Tue', count: 5 }, { day: 'Wed', count: 3 },
              { day: 'Thu', count: 8 }, { day: 'Fri', count: 6 }, { day: 'Sat', count: 12 }, { day: 'Sun', count: 9 }
            ]}>
              <defs>
                <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
              <Area type="monotone" dataKey="count" stroke="#818cf8" fillOpacity={1} fill="url(#areaColor)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default ProgressTracker;
