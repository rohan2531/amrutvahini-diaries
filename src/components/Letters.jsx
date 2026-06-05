import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from '../firebaseConfig';

export default function Letters({ user }) {
  const [letters, setLetters] = useState([]);
  const [letterText, setLetterText] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [isSealing, setIsSealing] = useState(false);

  // 1. Subscribe to Live Letters Stream
  useEffect(() => {
    const q = query(collection(db, 'letters'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLetters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // 2. Submit and Seal Letter Action Handlers
  const handleSealLetter = async (e) => {
    e.preventDefault();
    const text = letterText.trim();
    if (!text) return alert('Please write your letter first!');
    if (!unlockDate) return alert('Please pick a target unlock date for your capsule!');

    setIsSealing(true);
    try {
      await addDoc(collection(db, 'letters'), {
        name: user.displayName,
        uid: user.uid,
        text,
        unlockDate,
        createdAt: serverTimestamp()
      });
      setLetterText('');
      setUnlockDate('');
      alert('Your future self letter has been sealed successfully! 🔒');
    } catch (err) {
      alert('Vault write blocked: ' + err.message);
    } finally {
      setIsSealing(false);
    }
  };

  // Helper arrays for stylized capsule decoration cycles
  const capsuleColors = ['rgba(201,168,76,0.12)', 'rgba(77,184,164,0.12)', 'rgba(155,127,232,0.12)'];

  return (
    <div className="page active">
      <div className="section-title">Letters to Future Self</div>
      <div className="section-sub">Sealed tightly until your chosen milestone date.</div>

      {/* Creation and Configuration Card Workspace */}
      <form onSubmit={handleSealLetter} className="card" style={{ marginBottom: '16px' }}>
        <div className="form-row">
          <label className="form-label">Your Letter</label>
          <textarea 
            placeholder="Dear future me..." 
            style={{ minHeight: '140px' }}
            value={letterText}
            onChange={(e) => setLetterText(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label className="form-label">Unlock Date</label>
          <input 
            type="date" 
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isSealing || !letterText.trim() || !unlockDate}>
          {isSealing ? 'Sealing Vault Locker...' : 'Seal My Letter 🔒'}
        </button>
      </form>

      {/* Dynamic Time-Capsule Ledger Grid Viewport */}
      <div id="letterList">
        {letters.map((l, idx) => {
          // Check if current date has crossed the designated unlock boundary
          const targetUnlock = new Date(l.unlockDate + 'T00:00:00');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const isUnlocked = today >= targetUnlock;
          const isMyOwnLetter = l.uid === user.uid;
          const decoColor = capsuleColors[idx % capsuleColors.length];
          
          const displayDate = l.unlockDate 
            ? new Date(l.unlockDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) 
            : 'Farewell Day';

          return (
            <div key={l.id} className="card" style={{ marginBottom: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="letter-icon" style={{ background: decoColor, width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  {isUnlocked && isMyOwnLetter ? '🔓' : '🔒'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    {isMyOwnLetter ? 'Your Sealed Capsule' : `${l.name}'s Sealed Letter`}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    Opens on {displayDate}
                  </div>
                </div>
                <span className={`badge ${isUnlocked && isMyOwnLetter ? 'badge-success' : 'badge-gold'}`} style={isUnlocked && isMyOwnLetter ? { color: 'var(--green)' } : {}}>
                  {isUnlocked && isMyOwnLetter ? 'Available' : 'Locked'}
                </span>
              </div>

              {/* Secure content reveal conditional block */}
              {isMyOwnLetter && isUnlocked ? (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '14px', color: 'var(--text)', whiteSpace: 'pre-wrap', fontStyle: 'italic', background: 'var(--bg3)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                  {l.text}
                </div>
              ) : isMyOwnLetter ? (
                <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--purple)', fontStyle: 'italic', textAlign: 'center', background: 'rgba(155,127,232,0.05)', padding: '6px', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(155,127,232,0.2)' }}>
                  🛡️ This capsule is locked until {displayDate}. No one else can see this row container.
                </div>
              ) : null}
            </div>
          );
        })}

        {letters.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
            No time capsules have been sealed yet. Drop a letter to your future self above! 🔒
          </div>
        )}
      </div>
    </div>
  );
}