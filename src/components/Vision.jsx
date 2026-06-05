import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, where, getDocs, addDoc, serverTimestamp } from '../firebaseConfig';

export default function Vision({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [hasPosted, setHasPosted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Subscribe to the Live Messages Feed
  useEffect(() => {
    const q = query(collection(db, 'visions'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgData);
      
      // Check if current logged-in user already has a message in the stream
      const alreadyPosted = msgData.some(m => m.uid === user.uid);
      setHasPosted(alreadyPosted);
    });

    return () => unsubscribe();
  }, [user.uid]);

  // 2. Submit Farewell Message Handler
  const handlePostMessage = async (e) => {
    e.preventDefault();
    const msgText = newMessage.trim();
    if (!msgText) return;

    setIsSubmitting(true);
    try {
      // Double check client-side state to prevent race conditions
      const existing = await getDocs(query(collection(db, 'visions'), where('uid', '==', user.uid)));
      if (!existing.empty) {
        alert('You already posted your message to the batch! Each person can only post once.');
        setHasPosted(true);
        return;
      }

      await addDoc(collection(db, 'visions'), {
        name: user.displayName,
        uid: user.uid,
        dream: msgText,
        createdAt: serverTimestamp()
      });
      
      setNewMessage('');
      alert('Your farewell message has been beautifully preserved! 💛');
    } catch (err) {
      alert('Submission failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page active">
      <div className="section-title">Message to the Batch</div>
      <div className="section-sub">Say what's in your heart before you part ways 💛</div>

      {/* Conditional Interface: Show form ONLY if user hasn't posted yet */}
      {!hasPosted ? (
        <form onSubmit={handlePostMessage} className="card" style={{ marginBottom: '16px' }}>
          <textarea 
            placeholder="What do you want to say to your batch before farewell? Say it here — they'll read it forever." 
            style={{ minHeight: '160px' }}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            maxLength={1000}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !newMessage.trim()}>
              {isSubmitting ? 'Preserving Message...' : 'Post Message 💛'}
            </button>
          </div>
        </form>
      ) : (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--green)', fontSize: '13px' }}>
            <span style={{ fontSize: '18px' }}>✅</span>
            <div>
              <div style={{ fontWeight: 500 }}>Your farewell message has been posted!</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Each member can post exactly once to keep this wall meaningful.</div>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Message Stream Grid */}
      <div id="visionFeed">
        {messages.map((m) => {
          const initials = (m.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          const displayTime = m.createdAt 
            ? new Date(m.createdAt.seconds * 1000).toLocaleDateString('en-IN') 
            : 'Just now';

          return (
            <div key={m.id} className="vision-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div className="avatar" style={{ width: '36px', height: '36px', background: 'rgba(201,168,76,0.12)', color: 'var(--gold)', fontSize: '13px' }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{displayTime}</div>
                </div>
                <span className="badge badge-gold" style={{ marginLeft: 'auto' }}>💛 Message</span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--muted2)', lineHeight: '1.7', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                "{m.dream}"
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div style={{ textAlignment: 'center', padding: '40px', color: 'var(--muted)' }}>
            No messages written yet. Be the first to tell the batch how you feel!
          </div>
        )}
      </div>
    </div>
  );
}