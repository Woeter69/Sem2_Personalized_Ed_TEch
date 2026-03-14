import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = "http://localhost:8000";

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const res = await axios.post(`${API_URL}/token`, formData);
      login(res.data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`${API_URL}/users/`, { username, password });
      
      // Auto-login after signup
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      const res = await axios.post(`${API_URL}/token`, formData);
      login(res.data.access_token);
      navigate('/assessment');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed');
    }
  };

  if (user) {
    return (
      <div className="fade-in" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem' }}>EduFuture</h1>
        <h3>Welcome, {user.username}!</h3>
        <button className="btn" onClick={logout} style={{ marginBottom: '2rem' }}>Logout</button>
        <div className="quote-box">
          "Education is the passport to the future, for tomorrow belongs to those who prepare for it today." - Malcolm X
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          <div className="card" style={{ border: '1px solid #60a5fa' }}>
            <h2 style={{ color: '#60a5fa' }}>🎯 Class 10 Boards</h2>
            <p>Start your personalized journey.</p>
            <button className="btn" onClick={() => navigate(user.profile ? '/dashboard' : '/assessment')} style={{ width: '100%' }}>
              Select Class 10
            </button>
          </div>
          <div className="card" style={{ opacity: 0.6 }}>
            <h2 style={{ color: '#f87171' }}>🚀 JEE Mains / Adv</h2>
            <p>(Coming Soon)</p>
            <button className="btn" disabled style={{ width: '100%' }}>Select JEE</button>
          </div>
          <div className="card" style={{ opacity: 0.6 }}>
            <h2 style={{ color: '#4ade80' }}>🧬 NEET</h2>
            <p>(Coming Soon)</p>
            <button className="btn" disabled style={{ width: '100%' }}>Select NEET</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '4rem' }}>EduFuture</h1>
      <p>Your Personalized AI Progress Tracker</p>
      <hr style={{ borderColor: '#334155', margin: '2rem 0' }} />
      
      <div className="card">
        <h3>Access Your Portal</h3>
        <div className="tabs">
          <div className={`tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => setActiveTab('login')}>Login</div>
          <div className={`tab ${activeTab === 'signup' ? 'active' : ''}`} onClick={() => setActiveTab('signup')}>Sign Up</div>
        </div>

        {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>}

        <form onSubmit={activeTab === 'login' ? handleLogin : handleSignup}>
          <input 
            type="text" 
            placeholder="Username" 
            className="input-field" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input-field" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="btn" style={{ width: '100%' }}>
            {activeTab === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;
