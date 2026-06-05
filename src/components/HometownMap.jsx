import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, where, getDocs, addDoc, serverTimestamp } from '../firebaseConfig';

const CITY_PALETTE = [
  { border: '#e0b84c', bg: 'rgba(224, 184, 76, 0.1)',  glow: 'rgba(224, 184, 76, 0.4)',  text: '#e0b84c' },
  { border: '#4db8a4', bg: 'rgba(77, 184, 164, 0.1)',  glow: 'rgba(77, 184, 164, 0.4)',  text: '#4db8a4' },
  { border: '#9b7fe8', bg: 'rgba(155, 127, 232, 0.1)', glow: 'rgba(155, 127, 232, 0.4)', text: '#9b7fe8' },
  { border: '#4caf7d', bg: 'rgba(76, 175, 125, 0.1)',  glow: 'rgba(76, 175, 125, 0.4)',  text: '#4caf7d' },
  { border: '#e05252', bg: 'rgba(224, 82, 82, 0.1)',   glow: 'rgba(224, 82, 82, 0.4)',   text: '#e05252' }
];

export default function HometownMap({ user }) {
  const [pins, setPins] = useState([]);
  const [targetCity, setTargetCity] = useState('');
  const [hasPinned, setHasPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cityColors, setCityColors] = useState({});
  
  // New State: Tracks which city cluster is actively clicked/inspected
  const [selectedCityKey, setSelectedCityKey] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'hometowns'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pinsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPins(pinsData);
      setHasPinned(pinsData.some(p => p.uid === user.uid));

      let colorCount = 0;
      const colorMap = {};
      pinsData.forEach(p => {
        const cityKey = (p.city || '').trim().toLowerCase();
        if (!colorMap[cityKey]) {
          colorMap[cityKey] = CITY_PALETTE[colorCount % CITY_PALETTE.length];
          colorCount++;
        }
      });
      setCityColors(colorMap);
    });
    return () => unsubscribe();
  }, [user.uid]);

  // Client-Side Structural Grouping Engine
  const groupedHometowns = pins.reduce((acc, currentPin) => {
    const cityName = (currentPin.city || 'Unknown').trim();
    const standardKey = cityName.toLowerCase();
    if (!acc[standardKey]) {
      acc[standardKey] = { name: cityName, key: standardKey, people: [] };
    }
    acc[standardKey].people.push(currentPin);
    return acc;
  }, {});

  const sortedCities = Object.values(groupedHometowns).sort((a, b) => b.people.length - a.people.length);
  const uniqueCitiesCount = sortedCities.length;

  // Set the default selected inspected city to the largest demographic hub automatically
  useEffect(() => {
    if (sortedCities.length > 0 && !selectedCityKey) {
      setSelectedCityKey(sortedCities[0].key);
    }
  }, [pins, selectedCityKey, sortedCities]);

  const handlePinHometown = async (e) => {
    e.preventDefault();
    const city = targetCity.trim();
    if (!city) return;

    setIsSubmitting(true);
    try {
      const existing = await getDocs(query(collection(db, 'hometowns'), where('uid', '==', user.uid)));
      if (!existing.empty) {
        alert('You already pinned your hometown!');
        setHasPinned(true);
        return;
      }

      await addDoc(collection(db, 'hometowns'), {
        city,
        name: user.displayName,
        uid: user.uid,
        createdAt: serverTimestamp()
      });
      setTargetCity('');
      alert('Hometown coordinate registered successfully! 📍');
    } catch (err) {
      alert('Map registration failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeInspectedCity = sortedCities.find(c => c.key === selectedCityKey);

  return (
    <div className="page active">
      <div className="section-title">Batch Geographic Cloud Map</div>
      <div className="section-sub">Interactive clustering of where our IT batch coordinates originate from.</div>

      {/* ── METRIC DASHBOARD RIBBON ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--card-bg)' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--gold-glow)', fontFamily: '"Playfair Display", serif' }}>{pins.length}</div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', marginTop: '4px' }}>Total Pinned Hubs</div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--card-bg)' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#4db8a4', fontFamily: '"Playfair Display", serif' }}>{uniqueCitiesCount}</div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', marginTop: '4px' }}>Unique Hub Coordinates</div>
        </div>
      </div>

      {/* ── PREMIUM INTERACTIVE DOT MAPPING VIEWPORT ── */}
      <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '28px', marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span>🌌</span> Click on any batchmate bubble node to highlight their hometown hub below
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', minHeight: '60px' }}>
          {pins.map((p) => {
            const cityKey = (p.city || '').trim().toLowerCase();
            const col = cityColors[cityKey] || CITY_PALETTE[0];
            const isInspected = selectedCityKey === cityKey;

            return (
              <button 
                key={p.id}
                type="button"
                title={`${p.name} · ${p.city}`}
                onClick={() => setSelectedCityKey(cityKey)}
                style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '50%', 
                  background: isInspected ? col.border : col.bg, 
                  border: `2px solid ${col.border}`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  color: isInspected ? '#120e0c' : col.text, 
                  cursor: 'pointer', 
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  boxShadow: isInspected ? `0 0 16px ${col.glow}` : 'none',
                  transform: isInspected ? 'scale(1.15)' : 'scale(1)',
                  outline: 'none'
                }}
                onMouseOver={(e) => { if (!isInspected) e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseOut={(e) => { if (!isInspected) e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {(p.name || '?').slice(0, 2).toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CINEMATIC SPLIT ANALYTIC WORKSPACE ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start', marginBottom: '24px' }}>
        
        {/* Left Column: Interactive City Progression Metrics List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '4px' }}>Regional Densities</div>
          {sortedCities.map(({ name, key, people }) => {
            const col = cityColors[key] || CITY_PALETTE[0];
            const calculatedPct = Math.round((people.length / pins.length) * 100);
            const isSelected = selectedCityKey === key;

            return (
              <div 
                key={key} 
                onClick={() => setSelectedCityKey(key)}
                className="card"
                style={{ 
                  padding: '16px', 
                  cursor: 'pointer', 
                  background: isSelected ? 'rgba(255,255,255,0.02)' : 'var(--card-bg)',
                  borderColor: isSelected ? col.border : 'var(--border-color)',
                  boxShadow: isSelected ? `0 4px 20px rgba(0,0,0,0.2)` : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px', color: col.text }}>📍</span>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: isSelected ? col.text : 'var(--text-main)' }}>{name}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>{people.length} Pin{people.length !== 1 ? 's' : ''}</span>
                </div>
                
                {/* Visual Progress Bar Vector */}
                <div style={{ height: '5px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${calculatedPct}%`, background: col.border, transition: 'width 0.8s ease' }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Contextual Inspector Panel */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '4px' }}>Hub Inspector</div>
          {activeInspectedCity ? (
            <div className="card" style={{ padding: '24px', borderLeft: `4px solid ${cityColors[selectedCityKey]?.border || 'var(--gold-glow)'}` }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: cityColors[selectedCityKey]?.text, fontFamily: '"Playfair Display", serif', marginBottom: '2px' }}>
                {activeInspectedCity.name} Hub
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Accounts for {Math.round((activeInspectedCity.people.length / pins.length) * 100)}% of total batch mappings.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeInspectedCity.people.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: cityColors[selectedCityKey]?.bg, 
                      border: `1px solid ${cityColors[selectedCityKey]?.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: '700', color: cityColors[selectedCityKey]?.text
                    }}>
                      {p.name.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>{p.name}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a city data cluster node to trace individual members.
            </div>
          )}
        </div>

      </div>

      {/* ── ONBOARDING DATA ENTRY REGISTRATION CARD ── */}
      {!hasPinned ? (
        <form onSubmit={handlePinHometown} className="card" style={{ background: 'var(--card-bg)' }}>
          <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px', color: 'var(--gold-glow)' }}>📍 Log Your Geographic Coordinates</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Enter your home city/town (e.g., Sangamner, Pune, Nashik)" 
              style={{ flex: 1, minWidth: '240px' }}
              value={targetCity}
              onChange={(e) => setTargetCity(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !targetCity.trim()}>
              {isSubmitting ? 'Registering...' : 'Pin Location'}
            </button>
          </div>
        </form>
      ) : (
        <div className="card" style={{ border: '1px dashed var(--border-hover)', background: 'transparent', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4caf7d', fontSize: '13px' }}>
            <span style={{ fontSize: '16px' }}>✅</span>
            <div style={{ fontWeight: '500' }}>Your geographic coordinate position is actively logged on the cloud map dashboard.</div>
          </div>
        </div>
      )}
    </div>
  );
}