import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from '../firebaseConfig';

export default function Confessions() {
  const [confessions, setConfessions] = useState([]);
  const [newConfession, setNewConfession] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Subscribe to Live Anonymized Firestore Collection Pipeline
  useEffect(() => {
    const q = query(collection(db, 'confessions'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setConfessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    return () => unsubscribe();
  }, []);

  // 2. Submit Anonymized Payload Entry
  const handleSubmitConfession = async (e) => {
    e.preventDefault();
    const text = newConfession.trim();
    if (!text) return;

    setIsSubmitting(true);
    try {
      // NOTE: We intentionally do NOT append a uid or name attribute string here.
      // This guarantees complete database-level anonymity for your batchmates.
      await addDoc(collection(db, 'confessions'), {
        text,
        createdAt: serverTimestamp()
      });
      setNewConfession('');
    } catch (err) {
      alert("Transmission blocked: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page active">
      <div className="section-title">Anonymous Confessions</div>
      <div className="section-sub">No names. Just truth.🤫</div>

      {/* Submission Interface Form Card */}
      <form onSubmit={handleSubmitConfession} className="card" style={{ marginBottom: '16px' }}>
        <textarea 
          placeholder="Confess something... no one will ever know it's you 🤫" 
          value={newConfession}
          onChange={(e) => setNewConfession(e.target.value)}
          maxLength={400}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isSubmitting || !newConfession.trim()}
          >
            {isSubmitting ? 'Posting Anonymously...' : 'Post Anonymously'}
          </button>
        </div>
      </form>

      {/* Real-Time Live Streaming Confessions Feed Layout Viewport */}
      <div id="confessionFeed">
        {confessions.map((c) => {
          const formattedTime = c.createdAt 
            ? new Date(c.createdAt.seconds * 1000).toLocaleDateString('en-IN') 
            : 'Just now';

          return (
            <div key={c.id} className="confession">
              <div style={{ fontSize: '14px', fontStyle: 'italic', color: 'var(--muted2)', whiteSpace: 'pre-wrap' }}>
                "{c.text}"
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                Anonymous · {formattedTime}
              </div>
            </div>
          );
        })}

        {confessions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
            The pipeline is quiet. No confessions posted yet.
          </div>
        )}
      </div>
    </div>
  );
}