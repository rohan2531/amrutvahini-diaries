import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, doc, setDoc, getDoc, updateDoc, increment } from '../firebaseConfig';

const AWARD_CATEGORIES = [
  { id: 'backbencher', title: '👑 Ultimate Backbencher', desc: 'The masters of surviving lectures without getting caught.' },
  { id: 'coder', title: '💻 Code Wizard', desc: 'The one who debugs production loops in their sleep.' },
  { id: 'placement', title: '🚀 Most Likely to Get Placed First', desc: 'Crushing aptitude preparation questions and interviews daily.' },
  { id: 'tea', title: '☕ Chai Lover of the Batch', desc: 'More tea running through their veins than blood.' },
  { id: 'attendance', title: '👻 The Ghost Resident', desc: 'Only seen during final evaluations and submissions.' }
];

export default function Awards({ user }) {
  const [nominees, setNominees] = useState([]);
  const [profiles, setProfiles] = useState({}); // Stores full classmate metrics for winner cards
  const [votesData, setVotesData] = useState({});
  const [myVotes, setMyVotes] = useState({});
  const [isChangingVote, setIsChangingVote] = useState({});
  const [locksMap, setLocksMap] = useState({});
  
  // Countdown states per category id
  const [activeCountdowns, setActiveCountdowns] = useState({});
  const [revealedCategories, setRevealedCategories] = useState({});

  // 1. Live stream profiles to map names and full context cards
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      const proms = {};
      const list = snapshot.docs.map(d => {
        proms[d.id] = d.data();
        return { id: d.id, name: d.data().name };
      });
      setNominees(list);
      setProfiles(proms);
    });
    return () => unsubscribe();
  }, []);

  // 2. Core Snapshot Sync Pipeline
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'awards'), (docSnap) => {
      if (docSnap.exists()) {
        const incomingLocks = docSnap.data().categoryLocks || {};
        setLocksMap(incomingLocks);
        
        // Trigger automated countdowns for newly locked categories
        Object.keys(incomingLocks).forEach(catId => {
          if (incomingLocks[catId] && !revealedCategories[catId] && !activeCountdowns[catId]) {
            triggerSequencer(catId);
          }
        });
      }
    });

    const unsubscribes = AWARD_CATEGORIES.map((cat) => {
      const catUnsub = onSnapshot(collection(db, 'awards', cat.id, 'nominees'), (snap) => {
        const catTotals = {};
        snap.docs.forEach(doc => {
          catTotals[doc.id] = doc.data().count || 0;
        });
        setVotesData(prev => ({ ...prev, [cat.id]: catTotals }));
      });

      const checkMyVote = onSnapshot(doc(db, 'awards', cat.id, 'userVotes', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setMyVotes(prev => ({ ...prev, [cat.id]: docSnap.data().votedFor }));
        } else {
          setMyVotes(prev => ({ ...prev, [cat.id]: null }));
        }
      });

      return [catUnsub, checkMyVote];
    });

    return () => {
      unsubSettings();
      unsubscribes.flat().forEach(unsub => unsub());
    };
  }, [user.uid, revealedCategories]);

  // 3. Timing Sequencer Engine
  const triggerSequencer = (catId) => {
    let currentTick = 3;
    setActiveCountdowns(prev => ({ ...prev, [catId]: currentTick }));

    const timer = setInterval(() => {
      currentTick -= 1;
      if (currentTick > 0) {
        setActiveCountdowns(prev => ({ ...prev, [catId]: currentTick }));
      } else {
        clearInterval(timer);
        setActiveCountdowns(prev => ({ ...prev, [catId]: '🔥 REVEAL 🔥' }));
        
        setTimeout(() => {
          setActiveCountdowns(prev => ({ ...prev, [catId]: null }));
          setRevealedCategories(prev => ({ ...prev, [catId]: true }));
        }, 1200);
      }
    }, 1000);
  };

  const handleCastVote = async (categoryId, nomineeId) => {
    if (locksMap[categoryId]) return alert("Voting for this award is closed!");
    const previousNomineeId = myVotes[categoryId];
    if (previousNomineeId === nomineeId) return;

    try {
      const newUserVoteRef = doc(db, 'awards', categoryId, 'userVotes', user.uid);
      if (previousNomineeId) {
        await updateDoc(doc(db, 'awards', categoryId, 'nominees', previousNomineeId), { count: increment(-1) });
      }

      const newNomRef = doc(db, 'awards', categoryId, 'nominees', nomineeId);
      const targetNominee = nominees.find(n => n.id === nomineeId);
      const newNomSnap = await getDoc(newNomRef);
      
      if (!newNomSnap.exists()) {
        await setDoc(newNomRef, { name: targetNominee.name, count: 1 });
      } else {
        await updateDoc(newNomRef, { count: increment(1) });
      }

      await setDoc(newUserVoteRef, { votedFor: nomineeId, timestamp: new Date() });
      setIsChangingVote(prev => ({ ...prev, [categoryId]: false }));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="page active">
      <div className="section-title">Batch Awards Showcase</div>
      <div className="section-sub">Immutable peer acknowledgments. Suspense animations activate live during declarations.</div>

      {AWARD_CATEGORIES.map((cat) => {
        const isLocked = !!locksMap[cat.id];
        const currentCountdown = activeCountdowns[cat.id];
        const isRevealed = revealedCategories[cat.id] || (isLocked && !currentCountdown);
        
        const userChoice = myVotes[cat.id];
        const categoryVotes = votesData[cat.id] || {};
        const totalCatVotes = Object.values(categoryVotes).reduce((sum, v) => sum + v, 0);
        const changing = isChangingVote[cat.id];

        // Compute Winner Coordinates
        const highestVoteCount = Object.values(categoryVotes).length > 0 ? Math.max(...Object.values(categoryVotes)) : 0;
        const winnerIds = Object.keys(categoryVotes).filter(id => categoryVotes[id] === highestVoteCount && highestVoteCount > 0);
        const mainWinnerId = winnerIds[0];
        const winnerProfile = mainWinnerId ? profiles[mainWinnerId] : null;

        return (
          <div key={cat.id} className="card" style={{ marginBottom: '24px', padding: '24px', position: 'relative', overflow: 'hidden', border: isLocked ? '1px solid var(--gold-hover)' : '1px solid var(--border-color)' }}>
            
            {/* Header Meta Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold-glow)' }}>{cat.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{cat.desc}</div>
              </div>
              {isLocked && <span style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px', background: 'rgba(224,184,76,0.1)', color: 'var(--gold-glow)', fontWeight: 600, border: '1px solid var(--border-hover)' }}>Declared</span>}
            </div>

            {/* LAYER A: ACTIVE TIMING COUNTDOWN VISUALIZER */}
            {isLocked && currentCountdown && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px', fontSize: '42px', fontWeight: '900', color: 'var(--gold-glow)', fontFamily: '"Playfair Display", serif', letterSpacing: '2px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
                {currentCountdown}
              </div>
            )}

            {/* LAYER B: THE CHAMPION WINNER SPOTLIGHT BOX */}
            {isRevealed && winnerProfile && (
              <div className="page active" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(0,0,0,0) 100%)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hover)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '70px', height: '70px' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(201,168,76,0.1)', border: '2px solid var(--gold-glow)', display: 'flex', alignItems: 'center', justify: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: 'var(--gold-glow)' }}>
                    {winnerProfile.name?.slice(0,2).toUpperCase()}
                  </div>
                  <span style={{ position: 'absolute', top: '-10px', right: '-6px', fontSize: '22px', transform: 'rotate(15deg)' }}>🏆</span>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--gold-glow)', fontWeight: 700, letterSpacing: '1px' }}>Category Champion</div>
                  <div style={{ fontSize: '22px', fontWeight: '8px', fontWeight: 700, fontFamily: '"Playfair Display", serif', margin: '2px 0 6px 0' }}>{winnerProfile.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{winnerProfile.vibe || 'No custom vibe status registered.'}"</div>
                </div>
              </div>
            )}

            {/* LAYER C: STANDARD FEED / INTERACTIVE BAR LISTINGS */}
            {!currentCountdown && (
              <div>
                {/* Standard Input Form Picker (Only if category is unlocked) */}
                {(!userChoice || changing) && !isLocked ? (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <select id={`select-${cat.id}`} defaultValue={userChoice || ""} style={{ flex: 1, padding: '10px 14px' }}>
                      <option value="" disabled>Select classmate...</option>
                      {nominees.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                    <button className="btn btn-primary" onClick={() => handleCastVote(cat.id, document.getElementById(`select-${cat.id}`).value)}>
                      {userChoice ? 'Change Choice' : 'Confirm Vote'}
                    </button>
                    {changing && <button className="sort-btn" onClick={() => setIsChangingVote(prev => ({ ...prev, [cat.id]: false }))}>Cancel</button>}
                  </div>
                ) : (
                  !isLocked && (
                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--gold-glow)', background: 'rgba(201,168,76,0.05)', padding: '8px 14px', borderRadius: 'var(--radius-sm)' }}>
                        Logged Vote: <strong>{nominees.find(n => n.id === userChoice)?.name || 'Classmate'}</strong>
                      </div>
                      <button className="sort-btn" onClick={() => setIsChangingVote(prev => ({ ...prev, [cat.id]: true }))}>✏️ Alter Ballot</button>
                    </div>
                  )
                )}

                {/* Real-time Score Progress Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {Object.keys(categoryVotes).map((nomineeId) => {
                    const count = categoryVotes[nomineeId];
                    if (count <= 0) return null;

                    const nomineeName = nominees.find(n => n.id === nomineeId)?.name || 'Classmate';
                    const pct = totalCatVotes > 0 ? Math.round((count / totalCatVotes) * 100) : 0;
                    const isWinner = nomineeId === mainWinnerId;

                    return (
                      <div key={nomineeId} style={{ opacity: isLocked && !isWinner ? 0.4 : 1, transition: 'opacity 0.4s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                          <span style={isWinner && isLocked ? { color: 'var(--gold-glow)', fontWeight: 700 } : (userChoice === nomineeId ? { color: '#fff', fontWeight: 600 } : {})}>
                            {nomineeName} {userChoice === nomineeId && '⭐️'} {isLocked && isWinner && '👑'}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>{count} vote{count !== 1 ? 's' : ''} ({pct}%)</span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: isLocked && isWinner ? 'var(--gold-glow)' : (userChoice === nomineeId ? '#ffffff' : 'rgba(255,255,255,0.15)'), borderRadius: '3px', transition: 'width 0.8s ease' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}