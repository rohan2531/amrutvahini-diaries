import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Onboarding from './components/Onboarding';
import Profiles from './components/Profiles';
import Wall from './components/Wall';
import Gallery from './components/Gallery';
import Confessions from './components/Confessions';
import Letters from './components/Letters';
import Vision from './components/Vision';
import HometownMap from './components/HometownMap';
import Awards from './components/Awards';
import AdminPanel from './components/AdminPanel';
import { 
  auth, 
  db, 
  provider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  ADMIN_UID, 
  ADMIN_PASS 
} from './firebaseConfig';

export default function App() {
  // Core authentication and approval state hooks
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApprovedUser, setIsApprovedUser] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Listen to Google Auth State shifts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        let approved = currentUser.uid === ADMIN_UID;
        const email = (currentUser.email || '').toLowerCase().trim();

        // Evaluate your multi-token allowlist permissions gateway safely
        if (!approved) {
          try {
            const [uidSnap, emailSnap] = await Promise.all([
              getDoc(doc(db, 'allowlist', currentUser.uid)),
              getDoc(doc(db, 'allowlist', email))
            ]);
            approved = uidSnap.exists() || emailSnap.exists();
          } catch (err) {
            approved = false;
          }
        }

        if (!approved) {
          setIsApprovedUser(false);
          setIsDenied(true);
          setLoading(false);
          return;
        }

        // Verified Entry Path — safe to check setup configurations now
        setIsApprovedUser(true);
        setIsDenied(false);

        const [memberSnap, profileSnap] = await Promise.all([
          getDoc(doc(db, 'members', currentUser.uid)),
          getDoc(doc(db, 'profiles', currentUser.uid))
        ]);

        // Synchronize background membership document profiles
        if (!memberSnap.exists()) {
          await setDoc(doc(db, 'members', currentUser.uid), {
            name: currentUser.displayName,
            email: currentUser.email,
            createdAt: serverTimestamp(),
            joinedAt: serverTimestamp()
          });
        }

        // Trigger onboarding checkpoint if user data has never been finalized
        if (!profileSnap.exists()) {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
        }
      } else {
        // Reset state instantly on user log out
        setUser(null);
        setIsApprovedUser(false);
        setIsDenied(false);
        setShowOnboarding(false);
        setAdminMode(false);
        setActiveTab('home');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auth helper methods
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Sign out?')) {
      await signOut(auth);
    }
  };

  const handleToggleAdmin = () => {
    if (adminMode) {
      setAdminMode(false);
      setActiveTab('home');
      return;
    }
    const entered = prompt('🛡️ Enter admin password:');
    if (entered === ADMIN_PASS) {
      setAdminMode(true);
      setActiveTab('a-confessions');
    } else if (entered !== null) {
      alert('❌ Wrong password!');
    }
  };

  // ── RENDER LAYER 1: LOADING SPINNER ──
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0d0d0d', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontFamily: 'Playfair Display, serif', color: 'var(--gold)' }}>Amrutvahini Diaries</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>Verifying entry tokens...</div>
        </div>
      </div>
    );
  }

  // ── RENDER LAYER 2: ACCESS DENIED BLOCKER ──
  if (isDenied) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
        <div style={{ textAlign: 'center', padding: '40px', maxWidth: '420px', width: '90%' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: 'var(--red)', marginBottom: '10px' }}>Access Denied</div>
          <div style={{ fontSize: '14px', color: 'var(--muted2)', marginBottom: '8px' }}>This website is only for <strong>AVCOE IT Batch 2022–26</strong> members.</div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '24px' }}>Signed in as: {user?.email}</div>
          <div style={{ background: 'var(--card)', border: '1px solid rgba(224,82,82,0.3)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '20px', fontSize: '13px', color: 'var(--muted)', lineHeight: '1.8' }}>
            Your Google account is not on the approved list.<br />
            Contact <strong style={{ color: 'var(--gold)' }}>Rohan</strong> to get added.
          </div>
          <button className="btn btn-danger" onClick={handleLogout}>Sign out</button>
        </div>
      </div>
    );
  }

 // ── RENDER LAYER 3: UNAUTHENTICATED LOCK SCREEN ──
  if (!user) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', zIndex: 999 }}>
        <div style={{ textAlign: 'center', padding: '40px 24px', maxWidth: '520px', width: '90%' }} className="page active">
          
          {/* ── RECTANGULAR WIDESCREEN GROUP PHOTO CONTAINER ── */}
          <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', maxWidth: '440px' }}>
              {/* Primary Group Photo Asset */}
              <img 
                src="./BatchPhoto.jpeg" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: 'var(--radius-lg)', 
                  objectFit: 'cover', // Ensures the image cleanly covers the container box boundaries
                  boxShadow: '0 16px 36px rgba(0,0,0,0.55), 0 0 0 1px var(--border-color)',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 2
                }} 
                onError={(e) => { 
                  // Gracefully hide the image frame if logo.png fails to resolve
                  e.target.style.display = 'none'; 
                }} 
                alt="AVCOE IT Batch Group" 
              />
              
              {/* Premium Glassmorphic Fallback Backup (Visible if your image file path drops) */}
              <div style={{ 
                width: '100%', 
                height: '100%', 
                borderRadius: 'var(--radius-lg)', 
                background: 'rgba(255, 255, 255, 0.03)', 
                border: '1px solid var(--border-hover)', 
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                fontFamily: '"Playfair Display", serif',
                color: 'var(--gold-glow)',
                textShadow: '0 2px 8px rgba(0,0,0,0.6)'
              }}>
                <div style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '1px' }}>AVCOE IT</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>Batch 2022–2026</div>
              </div>
            </div>
          </div>

          <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '32px', color: 'var(--gold-glow)', marginBottom: '8px' }}>Amrutvahini Diaries</div>
          <div style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '4px', fontWeight: 500 }}>IT Batch 2022–26</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '32px' }}>Amrutvahini College of Engineering, Sangamner</div>
          
          {/* ── CENTRAL LOGIN CARD ── */}
          <div className="card" style={{ padding: '28px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-main)' }}>Sign in to continue</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Only for AVCOE IT Batch 2022–26 members</div>
            
            <button 
              onClick={handleLogin} 
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: '#ffffff', 
                border: 'none', 
                borderRadius: 'var(--radius-sm)', 
                fontSize: '14px', 
                fontWeight: 600, 
                color: '#120e0c', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                justifyContent: 'center', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)', 
                transition: 'all 0.2s var(--cb-transition)' 
              }} 
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,255,255,0.15)';
              }} 
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
              }}
            >
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.055 14.982 0 12 0 7.354 0 3.307 2.655 1.302 6.52l3.964 3.245z"/>
                <path fill="#4285F4" d="M23.49 12.275c0-.796-.073-1.564-.205-2.305H12v4.545h6.458a5.57 5.57 0 0 1-2.42 3.655v3.04h3.914c2.29-2.107 3.538-5.21 3.538-8.935z"/>
                <path fill="#FBBC05" d="M5.266 14.235L1.302 17.48A11.961 11.961 0 0 1 0 12c0-1.996.486-3.877 1.302-5.54l3.964 3.282A7.037 7.037 0 0 0 4.91 12c0 .782.13 1.536.356 2.235z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.955-1.075 7.942-2.915l-3.914-3.04c-1.085.728-2.48 1.16-4.028 1.16-3.11 0-5.746-2.105-6.686-4.935L1.302 17.51A11.973 11.973 0 0 0 12 24z"/>
              </svg>
              Sign in with Google
            </button>
            
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '16px', letterSpacing: '0.3px' }}>Four years. One family. Forever. 🎓</div>
          </div>
        </div>
      </div>
    );
  }
  // ── RENDER LAYER 4: FIRST-TIME ONBOARDING COMPONENT FORM ──
  if (showOnboarding) {
    return <Onboarding user={user} setShowOnboarding={setShowOnboarding} />;
  }

  // ── RENDER LAYER 5: LIVE VERIFIED BATCH DASHBOARD APPLICATION LAYOUT ──
  return (
    <div>
      {/* Dynamic Navigation Topbar Header */}
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div className="topbar-logo">Amrutvahini Diaries</div>
            <div className="topbar-sub">IT Batch 2022–26</div>
          </div>
        </div>
        <div className="topbar-right">
          <button className="admin-btn" style={{ color: 'var(--gold)' }} onClick={handleLogout}>
            👤 {user.displayName?.split(' ')[0]}
          </button>
          <button className="admin-btn" style={adminMode ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}} onClick={handleToggleAdmin}>
            {adminMode ? '✕ Exit Admin' : '🛡️ Admin'}
          </button>
        </div>
      </div>

      {/* Conditional Application Sub-Navigation Elements Routing */}
      {!adminMode ? (
        <div className="nav">
          {['home', 'profiles', 'wall', 'gallery', 'confessions', 'letters', 'vision', 'map', 'awards'].map((tab) => (
            <div 
              key={tab} 
              className={`nav-item ${activeTab === tab ? 'active' : ''}`} 
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
          ))}
        </div>
      ) : (
        <div className="nav" style={{ background: '#1a0a0a', borderBottomColor: 'rgba(224,82,82,0.3)' }}>
          {['a-confessions', 'a-photos', 'a-members', 'a-access', 'a-settings'].map((tab) => (
            <div 
              key={tab} 
              className={`nav-item ${activeTab === tab ? 'active' : ''}`} 
              style={{ color: activeTab === tab ? 'var(--red)' : 'var(--muted)' }}
              onClick={() => setActiveTab(tab)}
            >
              {tab.replace('a-', '📝 ').toUpperCase()}
            </div>
          ))}
        </div>
      )}

      {/* Main Core Application Workspace Container Viewport */}
      <main style={{ padding: '28px 24px', maxWidth: '900px', margin: '0 auto' }}>
        {/* User-Facing Section Routing Matrix */}
        {!adminMode && activeTab === 'home' && (
          <Home user={user} handleLogout={handleLogout} />
        )}
        {!adminMode && activeTab === 'profiles' && (
          <Profiles user={user} />
        )}
        {!adminMode && activeTab === 'wall' && (
          <Wall user={user} />
        )}
        {!adminMode && activeTab === 'gallery' && (
          <Gallery user={user} />
        )}
        {!adminMode && activeTab === 'confessions' && (
          <Confessions />
        )}
        {!adminMode && activeTab === 'letters' && (
          <Letters user={user} />
        )}
        {!adminMode && activeTab === 'vision' && (
          <Vision user={user} />
        )}
        {!adminMode && activeTab === 'map' && (
          <HometownMap user={user} />
        )}
        {!adminMode && activeTab === 'awards' && (
          <Awards user={user} />
        )}

        {/* Back-End Super-Admin Dashboard Section Router */}
        {adminMode && (
          <AdminPanel activeAdminTab={activeTab} />
        )}
      </main>
    </div>
  );
}