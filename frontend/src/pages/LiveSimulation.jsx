import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Compass, Clock, MapPin, CheckCircle, Navigation } from 'lucide-react';

const LiveSimulation = ({ params, onBack }) => {
  const { providerId, name, clinicName, fee, coordinates, startCoords, type } = params;

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const targetMarkerRef = useRef(null);
  const simFrameRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(startCoords || [77.641151, 12.971891]);
  const [distance, setDistance] = useState(0);
  const [eta, setEta] = useState(0);
  const [status, setStatus] = useState('En Route'); // 'En Route' | 'Arrived'
  const [progress, setProgress] = useState(0);

  // Haversine Distance Formula (calculates distance in km)
  const calculateDistance = (c1, c2) => {
    const [lon1, lat1] = c1;
    const [lon2, lat2] = c2;
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate ETA (assuming 40 km/h average driving speed)
  const calculateEtaMinutes = (distKm) => {
    if (distKm <= 0.05) return 0;
    const speedKmh = 40;
    const hours = distKm / speedKmh;
    return Math.ceil(hours * 60);
  };

  // 1. Load Mapbox CDN scripts dynamically
  useEffect(() => {
    const scriptId = 'mapbox-gl-js';
    const cssId = 'mapbox-gl-css';

    let link = document.getElementById(cssId);
    if (!link) {
      link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css';
      document.head.appendChild(link);
    }

    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.js';
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      if (window.mapboxgl) {
        setMapLoaded(true);
      } else {
        script.addEventListener('load', () => setMapLoaded(true));
      }
    }
  }, []);

  // 2. Initialize Map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapRef.current) return;

    const mapboxgl = window.mapboxgl;
    const token = import.meta.env.VITE_MAPBOX_TOKEN || window.MAPBOX_TOKEN || '';

    if (!token) {
      setMapError(true);
      return;
    }

    mapboxgl.accessToken = token;

    // Position map between starting coordinates and destination coordinates
    const midLng = (currentCoords[0] + coordinates[0]) / 2;
    const midLat = (currentCoords[1] + coordinates[1]) / 2;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [midLng, midLat],
      zoom: 11,
      attributionControl: false
    });

    map.on('error', () => setMapError(true));
    mapRef.current = map;

    // Add target provider marker (green location pin)
    const targetEl = document.createElement('div');
    targetEl.className = 'target-clinic-marker';
    targetEl.style.width = '24px';
    targetEl.style.height = '24px';
    targetEl.style.display = 'flex';
    targetEl.style.alignItems = 'center';
    targetEl.style.justifyContent = 'center';
    targetEl.style.cursor = 'pointer';

    const targetPin = document.createElement('div');
    targetPin.style.width = '14px';
    targetPin.style.height = '14px';
    targetPin.style.borderRadius = '50%';
    targetPin.style.background = '#10b981'; // Green accent
    targetPin.style.border = '2px solid #fff';
    targetPin.style.boxShadow = '0 0 10px #10b981';
    targetEl.appendChild(targetPin);

    const targetPopup = new mapboxgl.Popup({ offset: 12 })
      .setHTML(`<div style="color:#1e293b; font-family:sans-serif; font-size:11px; font-weight:bold; padding:2px;">${name}</div>`);

    targetMarkerRef.current = new mapboxgl.Marker(targetEl)
      .setLngLat(coordinates)
      .setPopup(targetPopup)
      .addTo(map);

    // Add user marker
    const userEl = document.createElement('div');
    userEl.className = 'user-marker';
    userEl.style.width = '24px';
    userEl.style.height = '24px';
    userEl.style.borderRadius = '50%';
    userEl.style.background = 'rgba(59, 130, 246, 0.2)';
    userEl.style.border = '2px solid #3b82f6';
    userEl.style.display = 'flex';
    userEl.style.alignItems = 'center';
    userEl.style.justifyContent = 'center';
    userEl.style.boxShadow = '0 0 10px #3b82f6';

    const dot = document.createElement('div');
    dot.style.width = '8px';
    dot.style.height = '8px';
    dot.style.borderRadius = '50%';
    dot.style.background = '#3b82f6';
    dot.style.boxShadow = '0 0 6px #3b82f6';
    dot.style.animation = 'pulse-user 1.6s ease-in-out infinite';
    userEl.appendChild(dot);

    const userPopup = new mapboxgl.Popup({ offset: 10 })
      .setHTML('<div style="color:#1e293b; font-family:sans-serif; font-size:10px; font-weight:bold; padding:2px;">Your Position</div>');

    userMarkerRef.current = new mapboxgl.Marker(userEl)
      .setLngLat(currentCoords)
      .setPopup(userPopup)
      .addTo(map);

    // Draw connecting route line
    map.on('load', () => {
      map.addSource('route-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [currentCoords, coordinates]
          }
        }
      });

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#06b6d4', // Cyan glowing route line
          'line-width': 4,
          'line-dasharray': [2, 3]
        }
      });

      // Fit bounds to show both user and target comfortably
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(currentCoords);
      bounds.extend(coordinates);
      map.fitBounds(bounds, { padding: 80, maxZoom: 12 });

      // 3. Start journey animation loop
      startJourneyAnimation();
    });

    return () => {
      if (simFrameRef.current) cancelAnimationFrame(simFrameRef.current);
      if (mapRef.current) mapRef.current.remove();
    };
  }, [mapLoaded]);

  // Journey simulation loop
  const startJourneyAnimation = () => {
    if (!mapRef.current) return;

    const startLoc = [...currentCoords];
    const endLoc = [...coordinates];
    const totalFrames = 240; // 4 seconds at 60fps for a full-screen dynamic glide
    let currentFrame = 0;

    const step = () => {
      currentFrame++;
      const pct = currentFrame / totalFrames;

      // Linear interpolation of Lng/Lat coordinates
      const currentLng = startLoc[0] + (endLoc[0] - startLoc[0]) * pct;
      const currentLat = startLoc[1] + (endLoc[1] - startLoc[1]) * pct;

      const newLoc = [currentLng, currentLat];
      setCurrentCoords(newLoc);
      setProgress(Math.round(pct * 100));

      // Recalculate distance and ETA dynamically
      const dist = calculateDistance(newLoc, coordinates);
      setDistance(parseFloat(dist.toFixed(1)));
      setEta(calculateEtaMinutes(dist));

      // Update User Marker position
      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat(newLoc);
      }

      // Update dynamic dotted route line
      if (mapRef.current && mapRef.current.getSource('route-line')) {
        mapRef.current.getSource('route-line').setData({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [newLoc, coordinates]
          }
        });
      }

      // Update camera center to follow user movement
      if (mapRef.current) {
        mapRef.current.setCenter(newLoc);
      }

      if (currentFrame < totalFrames) {
        simFrameRef.current = requestAnimationFrame(step);
      } else {
        // Arrived at destination
        setStatus('Arrived');
        setDistance(0);
        setEta(0);

        if (userMarkerRef.current && window.mapboxgl) {
          const popup = new window.mapboxgl.Popup({ offset: 10 })
            .setHTML('<div style="color:#059669; font-family:sans-serif; font-size:12px; font-weight:bold; padding:4px;">You have Arrived! 🎉</div>');
          userMarkerRef.current.setPopup(popup);
          userMarkerRef.current.togglePopup();
        }
      }
    };

    simFrameRef.current = requestAnimationFrame(step);
  };

  // Set initial distance and ETA stats before animation loads
  useEffect(() => {
    const dist = calculateDistance(currentCoords, coordinates);
    setDistance(parseFloat(dist.toFixed(1)));
    setEta(calculateEtaMinutes(dist));
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 72px)', background: '#090d16', overflow: 'hidden' }}>

      {/* Mapbox container */}
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      />

      {/* Return button overlay */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(7, 9, 19, 0.85)',
          border: '1px solid var(--card-border)',
          borderRadius: '10px',
          color: '#fff',
          padding: '10px 16px',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
        }}
      >
        <ArrowLeft size={16} />
        Back to Search Hub
      </button>

      {/* Floating Glassmorphic HUD overlay */}
      <div
        className="glass-panel animate-fade-in"
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '20px',
          right: '20px',
          maxWidth: '460px',
          margin: '0 auto',
          padding: '20px',
          zIndex: 10,
          background: 'rgba(7, 9, 19, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Header: Provider Details & Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.65rem', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--primary-neon)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.3)', fontWeight: 700, letterSpacing: '0.05em' }}>
              {type === 'labs' ? 'LAB DISPATCH' : 'DOCTOR CONSULTATION'}
            </span>
            <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, marginTop: '6px', marginBottom: '2px' }}>{name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{clinicName}</p>
          </div>

          {/* Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: status === 'Arrived' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.12)', border: status === 'Arrived' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.25)', padding: '4px 10px', borderRadius: '20px' }}>
            {status === 'Arrived' ? (
              <>
                <CheckCircle size={12} style={{ color: '#10b981' }} />
                <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}>Arrived</span>
              </>
            ) : (
              <>
                <Navigation size={12} style={{ color: '#3b82f6', animation: 'spin 3s linear infinite' }} />
                <span style={{ color: '#3b82f6', fontSize: '0.7rem', fontWeight: 700 }}>En Route</span>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Distance and ETA Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderRight: '1px solid var(--card-border)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>DISTANCE REMAINING</span>
            <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{distance} km</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '8px' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ESTIMATED TRAVEL TIME</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--secondary-neon)' }}>
              {status === 'Arrived' ? '0 mins' : `${eta} mins`}
            </strong>
          </div>
        </div>

        {/* Journey Progress Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span>Progress</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary-neon) 0%, var(--secondary-neon) 100%)', borderRadius: '3px', transition: 'width 0.1s ease', boxShadow: '0 0 8px var(--primary-neon)' }} />
          </div>
        </div>
      </div>

      {mapError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(13, 17, 29, 0.98)',
          zIndex: 99,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          padding: '20px',
          textAlign: 'center'
        }}>
          <Compass size={44} style={{ color: '#ef4444', marginBottom: '16px' }} />
          <h5>Mapbox Credentials Required</h5>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '300px', margin: '8px 0 16px 0' }}>
            Please make sure a valid Mapbox Token is configured in your project's frontend environment file.
          </p>
          <button
            onClick={onBack}
            style={{ background: 'var(--primary-neon)', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Back to Search Hub
          </button>
        </div>
      )}

      {/* Global CSS Pulsing Styles for markers */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulse-user {
          0% { transform: scale(0.95); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.7; }
          100% { transform: scale(0.95); opacity: 1; }
        }
      `}} />
    </div>
  );
};

export default LiveSimulation;
