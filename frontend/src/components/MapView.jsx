import React from 'react';
import { MapPin, Compass } from 'lucide-react';

const MapView = ({ providers = [], activeProviderId, onSelectProvider, centerCoords = [77.641151, 12.971891] }) => {
  // Center of our map view canvas
  const [centerLng, centerLat] = centerCoords;

  // Scale coordinates to fit our 100% responsive SVG viewport [300 x 300]
  // We compute relative offset from the search center coordinates
  const scale = 1800; // zoom factor
  const mapWidth = 300;
  const mapHeight = 300;
  const cx = mapWidth / 2;
  const cy = mapHeight / 2;

  const projectCoords = (lng, lat) => {
    // Basic mercator offset projection scaled to fit canvas
    const x = cx + (lng - centerLng) * scale;
    const y = cy - (lat - centerLat) * scale; // inverted Y axis for SVGs
    return { x, y };
  };

  // Pre-plotted virtual landmarks to represent Bengaluru localities for a beautiful grid HUD
  const landmarks = [
    { name: 'Koramangala', coords: [77.626579, 12.934533] },
    { name: 'Indiranagar', coords: [77.641151, 12.971891] },
    { name: 'HSR Layout', coords: [77.638706, 12.911623] },
    { name: 'Whitefield', coords: [77.749927, 12.969792] },
    { name: 'Domlur', coords: [77.638531, 12.960986] },
  ];

  return (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '380px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>
          <Compass size={18} style={{ color: 'var(--primary-neon)' }} />
          Bengaluru Geolocation Map
        </h4>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Zoom: 10km Radius
        </span>
      </div>

      {/* Vector Digital HUD Canvas Container */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: '#090d16',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Abstract radar sweep scanning animation */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'conic-gradient(from 0deg, rgba(6, 182, 212, 0.03) 0deg, rgba(6, 182, 212, 0) 90deg, rgba(6, 182, 212, 0.07) 360deg)',
          borderRadius: '50%',
          transformOrigin: 'center',
          animation: 'radarSweep 8s linear infinite',
          pointerEvents: 'none'
        }} />

        <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
          {/* Grid Background HUD rings */}
          <circle cx={cx} cy={cy} r={40} fill="none" stroke="rgba(6, 182, 212, 0.06)" strokeDasharray="2 2" />
          <circle cx={cx} cy={cy} r={80} fill="none" stroke="rgba(6, 182, 212, 0.05)" strokeDasharray="4 4" />
          <circle cx={cx} cy={cy} r={120} fill="none" stroke="rgba(6, 182, 212, 0.03)" />
          
          <line x1={cx} y1={0} x2={cx} y2={mapHeight} stroke="rgba(255, 255, 255, 0.02)" />
          <line x1={0} y1={cy} x2={mapWidth} y2={cy} stroke="rgba(255, 255, 255, 0.02)" />

          {/* Plot Landmarks (Bengaluru Suburbs) */}
          {landmarks.map((mark, i) => {
            const { x, y } = projectCoords(mark.coords[0], mark.coords[1]);
            // Only render if it sits within canvas boundaries
            if (x < 10 || x > mapWidth - 10 || y < 10 || y > mapHeight - 10) return null;

            return (
              <g key={i}>
                <circle cx={x} cy={y} r={2} fill="rgba(255, 255, 255, 0.15)" />
                <text x={x + 4} y={y + 3} fill="rgba(255, 255, 255, 0.25)" fontSize="6" fontFamily="sans-serif">
                  {mark.name}
                </text>
              </g>
            );
          })}

          {/* Plot Active Providers Pins */}
          {providers.map((p, index) => {
            if (!p.coordinates) return null;
            const { x, y } = projectCoords(p.coordinates[0], p.coordinates[1]);
            const isActive = activeProviderId === p.labId || activeProviderId === p.doctorId;

            // Constrain mapping nodes to SVG limits safely
            const constrainedX = Math.max(15, Math.min(mapWidth - 15, x));
            const constrainedY = Math.max(15, Math.min(mapHeight - 15, y));

            return (
              <g 
                key={p.labId || p.doctorId || index} 
                onClick={() => onSelectProvider && onSelectProvider(p.labId || p.doctorId)}
                style={{ cursor: 'pointer' }}
              >
                {/* Neon Glow Outer Rings */}
                <circle 
                  cx={constrainedX} 
                  cy={constrainedY} 
                  r={isActive ? 12 : 6} 
                  fill={isActive ? 'rgba(6, 182, 212, 0.15)' : 'rgba(16, 185, 129, 0.08)'} 
                  className={isActive ? 'glow-indicator' : ''} 
                />
                
                {/* Solid Marker Node */}
                <circle 
                  cx={constrainedX} 
                  cy={constrainedY} 
                  r={isActive ? 4 : 3} 
                  fill={isActive ? 'var(--primary-neon)' : 'var(--secondary-neon)'} 
                  stroke="#070913"
                  strokeWidth="1"
                />

                {/* Tooltip Label on Hover/Active */}
                {isActive && (
                  <g>
                    <rect 
                      x={constrainedX - 35} 
                      y={constrainedY - 24} 
                      width="70" 
                      height="14" 
                      rx="3" 
                      fill="rgba(13, 17, 29, 0.9)" 
                      stroke="var(--primary-neon)" 
                      strokeWidth="0.5" 
                    />
                    <text 
                      x={constrainedX} 
                      y={constrainedY - 15} 
                      fill="#fff" 
                      fontSize="6" 
                      fontWeight="bold" 
                      textAnchor="middle" 
                      fontFamily="sans-serif"
                    >
                      {p.labName || p.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Current Search Center Pin */}
          <circle cx={cx} cy={cy} r={3} fill="var(--accent-alert)" stroke="#fff" strokeWidth="0.5" />
        </svg>

        {/* CSS for Sweep animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes radarSweep {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
      
      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'center', fontSize: '0.7rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-alert)' }} />
          <span>Search Center</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary-neon)' }} />
          <span>Diagnostic Labs / Doctors</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
