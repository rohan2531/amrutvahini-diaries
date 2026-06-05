import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, doc, setDoc, query, orderBy } from '../firebaseConfig';

export default function Profiles({ user }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('roll'); // Default to roll sorting
  const [selectedProfile, setSelectedProfile] = useState(null);
  
  // Profile Editing States
  const [isEditingSelf, setIsEditingSelf] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.displayName || '',
    nickname: '',
    vibe: '',
    roll: '',
    phone: '',
    bday: '',
    alt: '',
    photo: user.photoURL || ''
  });

  useEffect(() => {
    // Read the database core real-time snapshot loop
    const q = query(collection(db, 'profiles'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProfiles(list);
      setLoading(false);

      const myProfile = list.find(p => p.id === user.uid);
      if (myProfile) {
        setEditForm({
          name: myProfile.name || user.displayName || '',
          nickname: myProfile.nickname || '',
          vibe: myProfile.vibe || myProfile.bio || myProfile.about || myProfile.line || '',
          roll: myProfile.roll || '',
          phone: myProfile.phone || '',
          bday: myProfile.bday || '',
          alt: myProfile.alt || '',
          photo: myProfile.photo || user.photoURL || ''
        });
      }
    }, (error) => {
      console.error("Profiles sync disruption: ", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user.uid, user.displayName, user.photoURL]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return alert("Name field cannot be blank!");

    try {
      await setDoc(doc(db, 'profiles', user.uid), {
        ...editForm,
        uid: user.uid,
        updatedAt: new Date()
      }, { merge: true });

      setIsEditingSelf(false);
      alert("Your profile has been updated successfully! ✨");
    } catch (err) {
      alert("Failed to save profile changes: " + err.message);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const searchString = `${p.name || ''} ${p.nickname || ''} ${p.roll || ''}`.toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  // Strict Toggle Sorting Logic
  if (sortBy === 'roll') {
    filteredProfiles.sort((a, b) => (parseInt(a.roll, 10) || 9999) - (parseInt(b.roll, 10) || 9999));
  } else if (sortBy === 'recent') {
    filteredProfiles.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }

  const formatBday = (dateString) => {
    if (!dateString) return 'Not registered';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="page active">
      <div className="section-title">Classmate Directory</div>
      <div className="section-sub">Discover, search, and connect with the minds of IT Batch 2022–26.</div>

      {/* ── INTERACTIVE MY-PROFILE EDIT TRIGGER HUB ── */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', background: 'rgba(201,168,76,0.03)', border: '1px dashed var(--gold-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-main)' }}>
          👋 Want to update your own cards, picture, roll number, or personal statement line?
        </div>
        <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => setIsEditingSelf(true)}>
          ✏️ Edit My Profile
        </button>
      </div>

      {/* ── SEARCH & NEW DUAL BUTTON SORTING ROW ── */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="🔍 Search by name, nickname, or roll number..." 
          style={{ flex: 1, minWidth: '260px' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        {/* Standalone Navigation Button Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            type="button"
            className="sort-btn"
            style={{ 
              background: sortBy === 'roll' ? 'var(--gold-glow)' : 'rgba(255,255,255,0.03)',
              color: sortBy === 'roll' ? '#120e0c' : 'var(--text-main)',
              borderColor: sortBy === 'roll' ? 'var(--gold-glow)' : 'var(--border-color)',
              fontWeight: '600', padding: '10px 16px'
            }}
            onClick={() => setSortBy('roll')}
          >
            🎓 Roll No
          </button>
          <button 
            type="button"
            className="sort-btn"
            style={{ 
              background: sortBy === 'recent' ? 'var(--gold-glow)' : 'rgba(255,255,255,0.03)',
              color: sortBy === 'recent' ? '#120e0c' : 'var(--text-main)',
              borderColor: sortBy === 'recent' ? 'var(--gold-glow)' : 'var(--border-color)',
              fontWeight: '600', padding: '10px 16px'
            }}
            onClick={() => setSortBy('recent')}
          >
            ⏱️ Recently Added
          </button>
        </div>
      </div>

      {/* ── PROFILE CARD GRID ── */}
      {loading ? (
        <div className="grid-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card skeleton-card" style={{ height: '200px', position: 'relative', overflow: 'hidden' }}>
              <div className="skeleton-shimmer"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid-3">
          {filteredProfiles.map((p, index) => {
            const initial = (p.name || '?').slice(0, 2).toUpperCase();
            const structuralLine = p.vibe || p.bio || p.about || p.line || 'Living life tracking clean loops.';

            return (
              <div 
                key={p.id} 
                className="card"
                onClick={() => setSelectedProfile(p)}
                style={{ 
                  cursor: 'pointer', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative',
                  animation: `profileFadeUp 0.5s cubic-bezier(0.25, 1, 0.5, 1) both`, animationDelay: `${index * 35}ms`,
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = 'var(--gold-hover)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(201, 168, 76, 0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {p.photo ? (
                    <img src={p.photo} alt={p.name} style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                  ) : (
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(201, 168, 76, 0.1)', border: '1px solid var(--gold-glow)', color: 'var(--gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>
                      {initial}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>{p.name} {p.id === user.uid && <span style={{fontSize: '11px', color: 'var(--gold-glow)'}}>(You)</span>}</div>
                    {p.nickname && <div style={{ fontSize: '12px', color: 'var(--gold-glow)', fontWeight: '500' }}>"{p.nickname}"</div>}
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: '2px 0', lineHeight: '1.4', flex: 1 }}>
                  "{structuralLine}"
                </p>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>🎂 {formatBday(p.bday)}</span>
                  <span>🎓 Roll: {p.roll || 'N/A'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredProfiles.length === 0 && (
        <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No batchmates found matching your selection filters.
        </div>
      )}

      {/* ── KINETIC MODAL OVERLAY: PROFILE INSPECTOR DETAILED CARD ── */}
      {selectedProfile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={() => setSelectedProfile(null)}>
          <div className="card" style={{ width: '90%', maxWidth: '480px', padding: '32px', background: 'var(--card-bg)', border: '1px solid var(--gold-hover)', position: 'relative', boxShadow: '0 24px 60px rgba(0,0,0,0.8)', animation: 'modalScale 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <button className="sort-btn" style={{ position: 'absolute', top: '16px', right: '16px', padding: '4px 10px' }} onClick={() => setSelectedProfile(null)}>✕ Close</button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              {selectedProfile.photo ? (
                <img src={selectedProfile.photo} alt={selectedProfile.name} style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px auto', border: '2px solid var(--gold-glow)' }} />
              ) : (
                <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'rgba(201, 168, 76, 0.1)', border: '2px solid var(--gold-glow)', color: 'var(--gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '700', margin: '0 auto 12px auto' }}>
                  {selectedProfile.name?.slice(0, 2).toUpperCase()}
                </div>
              )}
              <h3 style={{ fontSize: '22px', fontFamily: '"Playfair Display", serif', fontWeight: '700', color: '#fff', margin: '0 0 4px 0' }}>{selectedProfile.name}</h3>
              {selectedProfile.nickname && <div style={{ fontSize: '13px', color: 'var(--gold-glow)', fontWeight: '500' }}>"{selectedProfile.nickname}"</div>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600' }}>Personal Statement / About Me</div>
                <div style={{ color: 'var(--text-main)', fontStyle: 'italic', lineHeight: '1.5' }}>
                  "{selectedProfile.vibe || selectedProfile.bio || selectedProfile.about || selectedProfile.line || 'No status logged.'}"
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600' }}>Alternative Career Goal</div>
                <div style={{ color: 'var(--gold-glow)', fontWeight: '500' }}>🚀 {selectedProfile.alt || 'Tech Leader'}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600' }}>Roll Number</div>
                  <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>{selectedProfile.roll || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600' }}>Birthday</div>
                  <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>🎈 {formatBday(selectedProfile.bday)}</div>
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600' }}>Direct Communication Channel</div>
                {selectedProfile.phone ? (
                  <a href={`tel:${selectedProfile.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fff', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', padding: '8px 14px', borderRadius: '4px', textDecoration: 'none', fontWeight: '600' }}>📞 {selectedProfile.phone}</a>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Private Ledger</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── KINETIC MODAL OVERLAY: EDIT MY PROFILE FORM ── */}
      {isEditingSelf && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={() => setIsEditingSelf(false)}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', padding: '32px', background: 'var(--card-bg)', border: '1px solid var(--gold-hover)', boxShadow: '0 24px 60px rgba(0,0,0,0.8)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '20px', fontFamily: '"Playfair Display", serif', fontWeight: 700, marginBottom: '4px', color: '#fff' }}>Update Your Batch Profile</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>Keep your entries accurate so the yearbook registers correctly.</div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Full Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Your full official name" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Nickname</label>
                  <input type="text" value={editForm.nickname} onChange={e => setEditForm({...editForm, nickname: e.target.value})} placeholder="aka..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Roll Number</label>
                  <input type="text" value={editForm.roll} onChange={e => setEditForm({...editForm, roll: e.target.value})} placeholder="IT-XXXX" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>One Line About Yourself (Personal Vibe)</label>
                <input type="text" value={editForm.vibe} onChange={e => setEditForm({...editForm, vibe: e.target.value})} placeholder="Write a short, fun line about yourself..." maxLength={120} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Mobile Number</label>
                  <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="10-digit number" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Birthday</label>
                  <input type="date" value={editForm.bday} onChange={e => setEditForm({...editForm, bday: e.target.value})} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Alternative Career Trajectory</label>
                <input type="text" value={editForm.alt} onChange={e => setEditForm({...editForm, alt: e.target.value})} placeholder="Hulk AI content creator, tea tester, backbench manager..." />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Profile Image URL</label>
                <input type="url" value={editForm.photo} onChange={e => setEditForm({...editForm, photo: e.target.value})} placeholder="https://example.com/your-pic.jpg" />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="sort-btn" onClick={() => setIsEditingSelf(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}