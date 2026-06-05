import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, doc, setDoc, getDoc, deleteDoc, serverTimestamp, ADMIN_UID } from '../firebaseConfig';

export default function AdminPanel({ activeAdminTab }) {
  const [confessions, setConfessions] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [members, setMembers] = useState([]);
  const [allowlist, setAllowlist] = useState([]);
  const [awardsSettings, setAwardsSettings] = useState({}); // Dedicated state for award locks
  const [newEmail, setNewEmail] = useState('');

  // 1. Central Listener Stream Pipeline Staging
  useEffect(() => {
    const unsubConf = onSnapshot(collection(db, 'confessions'), (snap) => {
      setConfessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubPhotos = onSnapshot(collection(db, 'photos'), (snap) => {
      setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMembers = onSnapshot(collection(db, 'members'), (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubAllow = onSnapshot(collection(db, 'allowlist'), (snap) => {
      setAllowlist(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Real-time settings listener specifically tracking category locks
    const unsubAwardsSettings = onSnapshot(doc(db, 'settings', 'awards'), (snap) => {
      if (snap.exists()) {
        setAwardsSettings(snap.data());
      }
    });

    return () => {
      unsubConf();
      unsubPhotos();
      unsubMembers();
      unsubAllow();
      unsubAwardsSettings();
    };
  }, []);

  // 2. Administrative Content Override Evacuation Actions
  const handleDeleteItem = async (collectionName, documentId) => {
    if (window.confirm(`Are you absolutely sure you want to delete this document entry from ${collectionName}?`)) {
      try {
        await deleteDoc(doc(db, collectionName, documentId));
        alert('Document dropped successfully.');
      } catch (err) {
        alert('Operation failed: ' + err.message);
      }
    }
  };

  const handleAddAccessEmail = async (e) => {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) return alert('Please input a structurally valid email address!');

    try {
      await setDoc(doc(db, 'allowlist', email), {
        email,
        name: 'Pending first sign-in',
        addedAt: serverTimestamp()
      });
      setNewEmail('');
      alert(`✅ Access granted for ${email}!`);
    } catch (err) {
      alert('Allowlist append blocked: ' + err.message);
    }
  };

  return (
    <div>
      {/* SECTION A: MANAGE CONFESSIONS SUB-VIEWPORT */}
      {activeAdminTab === 'a-confessions' && (
        <div className="admin-page active">
          <div className="section-title">Manage Confessions</div>
          <div className="section-sub">Drop inappropriate or toxic anonymous feed logs.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {confessions.map(c => (
              <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ fontSize: '13px', fontStyle: 'italic', flex: 1 }}>"{c.text}"</div>
                <button className="btn btn-danger" style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--red)', color: 'white' }} onClick={() => handleDeleteItem('confessions', c.id)}>🗑️ Delete</button>
              </div>
            ))}
            {confessions.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No confessions available to audit.</p>}
          </div>
        </div>
      )}

      {/* SECTION B: MANAGE GALLERY IMAGES CONTROLLER */}
      {activeAdminTab === 'a-photos' && (
        <div className="admin-page active">
          <div className="section-title">Manage Photos</div>
          <div className="section-sub">Audit background picture submissions.</div>
          <div className="grid-3">
            {photos.map(p => (
              <div key={p.id} style={{ aspectRatio: '1', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                <img src={p.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Audit" />
                <button className="btn btn-danger" style={{ position: 'absolute', top: '6px', right: '6px', padding: '4px 8px', fontSize: '11px', background: 'var(--red)', color: 'white' }} onClick={() => handleDeleteItem('photos', p.id)}>🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION C: TOTAL REGISTERED SYSTEM MEMBERS ROSTER */}
      {activeAdminTab === 'a-members' && (
        <div className="admin-page active">
          <div className="section-title">Manage Registered Members</div>
          <div className="section-sub">Accounts currently linked to database collection indexes.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {members.map(m => (
              <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{m.name} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>({m.email})</span></div>
                {m.id !== ADMIN_UID && (
                  <button className="btn btn-danger" style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--red)', color: 'white' }} onClick={() => handleDeleteItem('members', m.id)}>Evict User</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION D: SYSTEM ALLOWLIST ENTRY PORTAL */}
      {activeAdminTab === 'a-access' && (
        <div className="admin-page active">
          <div className="section-title">Access Control Allowlist</div>
          <div className="section-sub">Only pre-approved email handles are authorized to bypass the lock screen. 🔒</div>
          
          <form onSubmit={handleAddAccessEmail} className="card" style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
            <input type="email" placeholder="batchmate-gmail@gmail.com" style={{ flex: 1 }} value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            <button type="submit" className="btn btn-primary">Grant Access</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {allowlist.map(a => (
              <div key={a.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{a.email}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status: {a.name}</div>
                </div>
                {a.id !== ADMIN_UID && (
                  <button className="btn btn-danger" style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--red)', color: 'white' }} onClick={() => handleDeleteItem('allowlist', a.id)}>Revoke Token</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION E: BATCH RESULTS AND GRANULAR SETTINGS CONTROL PANEL */}
      {activeAdminTab === 'a-settings' && (
        <div className="admin-page active">
          <div className="section-title">Granular Awards Control Panel</div>
          <div className="section-sub">Authorize lock boundaries and declare live batch results per category.</div>
          
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--gold-glow)' }}>🎫 Manage Individual Award Statuses</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { id: 'backbencher', title: '👑 Ultimate Backbencher' },
                { id: 'coder', title: '💻 Code Wizard' },
                { id: 'placement', title: '🚀 Most Likely to Get Placed First' },
                { id: 'tea', title: '☕ Chai Lover of the Batch' },
                { id: 'attendance', title: '👻 The Ghost Resident' }
              ].map((cat) => {
                const currentLocks = awardsSettings.categoryLocks || {};
                const isCatLocked = !!currentLocks[cat.id];

                return (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{cat.title}</div>
                      <div style={{ fontSize: '11px', color: isCatLocked ? 'var(--red)' : 'var(--green)', marginTop: '2px', fontWeight: 600 }}>
                        {isCatLocked ? '🔒 LOCKED & DECLARED' : '🔓 OPEN FOR VOTING'}
                      </div>
                    </div>
                    
                    <button 
                      type="button"
                      className="btn"
                      style={{ 
                        padding: '6px 14px', 
                        fontSize: '12px', 
                        background: isCatLocked ? 'rgba(76, 175, 125, 0.15)' : 'rgba(224, 82, 82, 0.15)', 
                        color: isCatLocked ? 'var(--green)' : 'var(--red)',
                        border: isCatLocked ? '1px solid var(--green)' : '1px solid var(--red)'
                      }}
                      onClick={async () => {
                        const docRef = doc(db, 'settings', 'awards');
                        const snap = await getDoc(docRef);
                        let updatedLocks = {};
                        if (snap.exists() && snap.data().categoryLocks) {
                          updatedLocks = { ...snap.data().categoryLocks };
                        }
                        
                        if (isCatLocked) {
                          delete updatedLocks[cat.id];
                        } else {
                          updatedLocks[cat.id] = true;
                        }

                        await setDoc(docRef, { categoryLocks: updatedLocks }, { merge: true });
                      }}
                    >
                      {isCatLocked ? 'Open Poll' : 'Lock & Declare'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Batch Invitation Link Configuration</div>
            <code style={{ display: 'block', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--gold-glow)', borderRadius: 'var(--radius-sm)', wordBreak: 'break-all' }}>
              https://rohan2531.github.io/amrutvahini-diaries/
            </code>
          </div>
        </div>
      )}
    </div>
  );
}