import React, { useState, useEffect } from 'react';
import { 
  db, 
  auth, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  setDoc, 
  getDoc, 
  doc, 
  increment, 
  serverTimestamp 
} from '../firebaseConfig';

export default function Wall({ user }) {
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [userLikes, setUserLikes] = useState({}); // Tracks which post IDs this user liked
  const [likingInProgress, setLikingInProgress] = useState(new Set());

  // 1. Live Stream Listener for Memory Posts
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);

      // Batch check which posts the current user has already liked
      postsData.forEach(async (post) => {
        try {
          const likeDocRef = doc(db, 'posts', post.id, 'likes', user.uid);
          const likeSnap = await getDoc(likeDocRef);
          setUserLikes(prev => ({ ...prev, [post.id]: likeSnap.exists() }));
        } catch (err) {
          console.error("Error fetching like state:", err);
        }
      });
    });

    return () => unsubscribe();
  }, [user.uid]);

  // 2. Submit Fresh Memory Handlers
  const handleAddPost = async (e) => {
    e.preventDefault();
    const text = newPostText.trim();
    if (!text) return;

    try {
      await addDoc(collection(db, 'posts'), {
        text,
        name: user.displayName,
        uid: user.uid,
        likes: 0,
        createdAt: serverTimestamp()
      });
      setNewPostText('');
    } catch (err) {
      alert("Failed to post memory: " + err.message);
    }
  };

  // 3. Isolated Real-Time Atomic Liking Engine Logic
  const handleLikePost = async (postId) => {
    if (likingInProgress.has(postId)) return;

    // Optimistic UI update toggle
    const textAlreadyLiked = userLikes[postId];
    setUserLikes(prev => ({ ...prev, [postId]: !textAlreadyLiked }));

    // Add to local lock set to prevent spam click collisions
    setLikingInProgress(prev => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });

    try {
      const likeRef = doc(db, 'posts', postId, 'likes', user.uid);
      const postRef = doc(db, 'posts', postId);

      if (textAlreadyLiked) {
        // Reverse Like Path
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likes: increment(-1) });
      } else {
        // Apply Like Path
        await setDoc(likeRef, { likedAt: serverTimestamp() });
        await updateDoc(postRef, { likes: increment(1) });
      }
    } catch (err) {
      console.error("Like transmission broken: ", err);
      // Rollback UI state if network connection fails
      setUserLikes(prev => ({ ...prev, [postId]: textAlreadyLiked }));
    } finally {
      setLikingInProgress(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Delete this memory from the wall permanently?')) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
      } catch (err) {
        alert("Deletion blocked: " + err.message);
      }
    }
  };

  return (
    <div className="page active">
      <div className="section-title">Memory Wall</div>
      <div className="section-sub">Every moment worth remembering</div>

      {/* Submission Card Interface */}
      <form onSubmit={handleAddPost} className="card" style={{ marginBottom: '16px' }}>
        <textarea 
          placeholder="Share a memory, a moment, an inside joke..." 
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          maxLength={500}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button type="submit" className="btn btn-primary" disabled={!newPostText.trim()}>
            Post Memory
          </button>
        </div>
      </form>

      {/* Real-time Dynamic Wall Posts Feed List */}
      <div id="postFeed">
        {posts.map((post) => {
          const isMe = post.uid === user.uid;
          const isLikedByMe = userLikes[post.id];
          const postTime = post.createdAt 
            ? new Date(post.createdAt.seconds * 1000).toLocaleDateString('en-IN') 
            : 'Just now';

          return (
            <div key={post.id} className="post">
              <div className="post-header">
                <div className="avatar" style={{ width: '34px', height: '34px', background: 'rgba(201,168,76,0.12)', color: 'var(--gold)', fontSize: '13px' }}>
                  {(post.name || '?').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{post.name || 'Batchmate'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{postTime}</div>
                </div>
              </div>
              
              <div style={{ fontSize: '14px', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                {post.text}
              </div>

              <div className="post-actions" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <span 
                  className="post-action" 
                  style={{ color: isLikedByMe ? 'var(--red)' : 'var(--muted)', fontWeight: isLikedByMe ? '600' : 'normal', transition: 'color 0.2s' }}
                  onClick={() => handleLikePost(post.id)}
                >
                  ❤️ {post.likes || 0}
                </span>
                
                {isMe && (
                  <span 
                    className="post-action" 
                    style={{ marginLeft: 'auto', color: 'var(--red)' }} 
                    onClick={() => handleDeletePost(post.id)}
                  >
                    🗑️ Delete
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
            The wall is clear. Be the first to pin a memory! 🎓
          </div>
        )}
      </div>
    </div>
  );
}