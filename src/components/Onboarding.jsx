import React, { useState } from 'react';
import { db, doc, setDoc, serverTimestamp } from '../firebaseConfig';

export default function Onboarding({ user, setShowOnboarding }) {
  // Controlled form state tracking hooks
  const [formData, setFormData] = useState({
    nick: '',
    bio: '',
    roll: '',
    phone: '',
    bday: '',
    alt: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize inputs dynamically
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Strict Client-Side Input Sanity Validations
    const nick = formData.nick.trim();
    const bio = formData.bio.trim();
    const roll = formData.roll.trim();
    const phone = formData.phone.trim();
    const alt = formData.alt.trim();

    if (!nick) return alert('Please enter your nickname!');
    if (!bio) return alert('Please enter your vibe in one line!');
    if (!roll) return alert('Please enter your class roll number!');
    if (!phone) return alert('Please enter your phone number!');
    if (phone.length < 10 || isNaN(phone)) return alert('Please enter a valid 10-digit phone number!');
    if (!formData.bday) return alert('Please enter your birthday!');
    if (!alt) return alert('Please fill in your alternate career option!');

    setIsSaving(true);
    try {
      const profilePayload = {
        name: user.displayName,
        nick,
        bio,
        roll,
        phone,
        bday: formData.bday,
        alt,
        createdAt: serverTimestamp(),
        joinedAt: serverTimestamp()
      };

      if (user.photoURL) {
        profilePayload.photo = user.photoURL;
      }

      // Commit the profile layout record safely to Firestore
      await setDoc(doc(db, 'profiles', user.uid), profilePayload);
      
      alert('Welcome to Amrutvahini Diaries! 🎓');
      setShowOnboarding(false); // Drops the authentication lock modal gate
    } catch (err) {
      alert('Error saving profile: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 998, overflowY: 'auto' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '40px 24px' }}>
        
        {/* Onboarding Presentation Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px', background: 'rgba(201,168,76,0.12)', border: '3px solid rgba(201,168,76,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 500, color: 'var(--gold)', overflow: 'hidden' }}>
            {user.photoURL ? (
              /* FIXED: Changed attribute string name to correct React camelCase token 'referrerPolicy' */
              <img src={user.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" alt="Avatar" />
            ) : (
              user.displayName?.slice(0, 2).toUpperCase()
            )}
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: 'var(--gold)', marginBottom: '6px' }}>Welcome to the batch! 🎓</div>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Complete your profile so your batchmates can find you.</div>
          <div style={{ fontSize: '12px', color: 'var(--red)', marginTop: '6px', fontWeight: 500 }}>Required — you can't skip this checkpoint</div>
        </div>

        {/* Core Submission Form Component Input Fields */}
        <form onSubmit={handleSave} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
          
          <div className="form-row">
            <label className="form-label">Your name <span style={{ color: 'var(--muted)' }}>(from Google)</span></label>
            <input type="text" value={user.displayName || ''} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>

          <div className="form-row">
            <label className="form-label">Nickname <span style={{ color: 'var(--red)' }}>*</span></label>
            <input id="nick" type="text" placeholder="What your friends call you" maxLength={30} value={formData.nick} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label className="form-label">Your vibe in one line <span style={{ color: 'var(--red)' }}>*</span></label>
            <input id="bio" type="text" placeholder="e.g. The one who always had chai ready" maxLength={80} value={formData.bio} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label className="form-label">Roll number <span style={{ color: 'var(--red)' }}>*</span></label>
            <input id="roll" type="text" placeholder="e.g. 324" value={formData.roll} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label className="form-label">Phone number <span style={{ color: 'var(--red)' }}>*</span></label>
            <input id="phone" type="tel" placeholder="e.g. 9876543210" maxLength={10} value={formData.phone} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label className="form-label">Birthday 🎂 <span style={{ color: 'var(--red)' }}>*</span></label>
            <input id="bday" type="date" value={formData.bday} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label className="form-label">If not an engineer, you would have been... <span style={{ color: 'var(--red)' }}>*</span></label>
            <input id="alt" type="text" placeholder="e.g. Chef, Cricketer, Stand-up comedian..." maxLength={60} value={formData.alt} onChange={handleChange} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px' }} disabled={isSaving}>
            {isSaving ? 'Saving Parameters...' : 'Save & Enter 🎓'}
          </button>

          <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginTop: '12px' }}>
            Your details are completely secure and only visible to verified batchmates.
          </div>
        </form>
      </div>
    </div>
  );
}