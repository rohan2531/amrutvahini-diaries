import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from '../firebaseConfig';

export default function Gallery({ user }) {
  const [photos, setPhotos] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null); // Tracks active open picture index, null means closed
  const [isUploading, setIsUploading] = useState(false);

  // 1. Live Firestore Subscription Media Stream
  useEffect(() => {
    const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPhotos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // 2. Keydown Listener Hook for Lightbox Navigation Escape Actions
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleLightboxNext();
      if (e.key === 'ArrowLeft') handleLightboxPrev();
      if (e.key === 'Escape') setLightboxIndex(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, photos.length]);

  // 3. Direct Cloudinary REST Upload Framework Action
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'batch_photos');
      fd.append('folder', 'amrutvahini-diaries');

      // Post raw payload directly to your cloud endpoint bucket
      const res = await fetch('https://api.cloudinary.com/v1_1/dluc4n5m6/image/upload', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();

      if (data.secure_url) {
        // Record structural URL tokens securely back down to Firestore log lists
        await addDoc(collection(db, 'photos'), {
          url: data.secure_url,
          uploadedBy: user.displayName,
          uid: user.uid,
          caption: '',
          createdAt: serverTimestamp()
        });
      } else {
        alert('Upload failed. Please verify preset file parameters.');
      }
    } catch (err) {
      alert('Network upload connection broke: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (e, photoId) => {
    e.stopPropagation(); // Stops the grid element from opening the lightbox at the same time
    if (window.confirm('Delete this photo from the batch gallery permanently?')) {
      try {
        await deleteDoc(doc(db, 'photos', photoId));
      } catch (err) {
        alert('Deletion blocked: ' + err.message);
      }
    }
  };

  const handleLightboxNext = () => {
    setLightboxIndex(prev => (prev + 1) % photos.length);
  };

  const handleLightboxPrev = () => {
    setLightboxIndex(prev => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className="page active">
      <div className="section-title">Photo Gallery</div>
      <div className="section-sub">4 years of moments — all in one place</div>

      {/* Control Configuration Upload Section Wrapper Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <input 
          type="file" 
          id="photoUploadInput" 
          accept="image/*" 
          style={{ display: 'none' }} 
          onChange={handlePhotoUpload} 
        />
        <button 
          className="btn btn-primary" 
          disabled={isUploading}
          onClick={() => document.getElementById('photoUploadInput').click()}
        >
          {isUploading ? 'Uploading to Cloud...' : '+ Upload Photo'}
        </button>
        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
          {photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded
        </span>
      </div>

      {/* Responsive Structural Image Matrix Layout */}
      <div className="grid-3">
        {photos.map((p, index) => {
          const isMe = p.uid === user.uid;
          return (
            <div 
              key={p.id} 
              className="photo-card-container"
              style={{ aspectRatio: '1', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative', cursor: 'pointer' }}
              onClick={() => setLightboxIndex(index)}
            >
              <img src={p.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" alt="Batch memory" />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.55)', padding: '4px 8px', fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>
                {p.uploadedBy || 'Batchmate'}
              </div>
              {isMe && (
                <div 
                  style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(224,82,82,0.85)', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', color: 'white', cursor: 'pointer', zIndex: 5 }} 
                  onClick={(e) => handleDeletePhoto(e, p.id)}
                >
                  🗑️
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── CENTRALIZED LIGHTBOX OVERLAY COMPONENT MODEL MODAL ── */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div className="lightbox active" style={{ display: 'flex' }}>
          <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>✕</button>
          
          <button className="lightbox-prev" onClick={handleLightboxPrev}>‹</button>
          <img src={photos[lightboxIndex].url} alt="Enlarged memory" />
          <button className="lightbox-next" onClick={handleLightboxNext}>›</button>
          
          <div className="lightbox-info">
            Uploaded by: {photos[lightboxIndex].uploadedBy || 'Batchmate'} &nbsp;·&nbsp; {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}