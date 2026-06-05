import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot } from '../firebaseConfig';

export default function Home({ user, handleLogout }) {
  // Real-time counter metrics hooks
  const [stats, setStats] = useState({ members: 0, memories: 0, photos: 0, letters: 0 });
  const [countdownText, setCountdownText] = useState('⏳ Loading countdown...');

  // Live Stats Pipeline Subscription Tracker
  useEffect(() => {
    const targets = [
      { col: 'members', key: 'members' },
      { col: 'posts', key: 'memories' },
      { col: 'photos', key: 'photos' },
      { col: 'letters', key: 'letters' }
    ];

    const unsubscribes = targets.map(({ col, key }) => 
      onSnapshot(collection(db, col), (snap) => {
        setStats(prev => ({ ...prev, [key]: snap.size }));
      })
    );

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  // Live Farewell Ticker Loop
  useEffect(() => {
    const calculateCountdown = () => {
      const farewellDate = new Date('2026-06-06T00:00:00');
      const now = new Date();
      
      // Calculate midnight absolute differences
      const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffTime = farewellDate - todayZero;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        setCountdownText(`⏳ ${diffDays} days to farewell`);
      } else if (diffDays === 1) {
        setCountdownText('⏳ Tomorrow is farewell day!');
      } else if (diffDays === 0) {
        setCountdownText('🎓 Today is farewell day!');
      } else {
        setCountdownText(`🎓 Farewell — ${Math.abs(diffDays)} days ago`);
      }
    };

    calculateCountdown();
    // Refresh calculations every hour to handle midnight boundaries cleanly
    const interval = setInterval(calculateCountdown, 3600000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page active">
      {/* Hero Header Space */}
      <div className="hero">
        <div className="hero-title">Amrutvahini Diaries</div>
        <div className="hero-sub">IT Batch 2022–26</div>
        <div className="hero-college">Amrutvahini College of Engineering, Sangamner</div>
        <div style={{ marginTop: '16px', display: 'inline-block', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '20px', padding: '8px 20px', fontSize: '13px', color: 'var(--gold2)' }}>
          {countdownText}
        </div>
      </div>

      {/* Real-Time Live Stats Grid Metric Grid */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-num">{stats.members}</div>
          <div className="stat-label">Members joined</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.memories}</div>
          <div className="stat-label">Memories shared</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.photos}</div>
          <div className="stat-label">Photos uploaded</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.letters}</div>
          <div className="stat-label">Letters sealed</div>
        </div>
      </div>

      {/* User Welcome Block card */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '28px' }}>🎓</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>
              Welcome, {user?.displayName?.split(' ')[0]}! 🎓
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
              You are signed in — explore, post and share memories with your batchmates!
            </div>
          </div>
          <button className="btn btn-danger" onClick={handleLogout} style={{ fontSize: '12px' }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Batch Invitation Link Portal card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Share with your batch</div>
          <code style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontSize: '12px', color: 'var(--gold)' }}>
            rohan2531.github.io/amrutvahini-diaries
          </code>
          <button className="btn" onClick={() => {
            navigator.clipboard.writeText('https://rohan2531.github.io/amrutvahini-diaries/');
            alert('Link copied! 🎓');
          }}>
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
}