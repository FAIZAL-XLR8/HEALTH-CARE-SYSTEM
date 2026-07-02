import React, { useEffect, useRef, useState } from 'react';
import { Compass } from 'lucide-react';
import '../styles/MapView.css';

const MapView = ({
  providers = [],
  activeProviderId,
  onSelectProvider,
  centerCoords = [77.641151, 12.971891]
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const searchCenterMarkerRef = useRef(null);


  // Helper to compute average center of coordinates dynamically
  const getCenterCoords = () => {
    const validCoords = providers
      .filter(p => p.coordinates && p.coordinates.length === 2)
      .map(p => p.coordinates);

    if (validCoords.length === 0) {
      return centerCoords || [77.641151, 12.971891];
    }

    const sumLng = validCoords.reduce((sum, c) => sum + c[0], 0);
    const sumLat = validCoords.reduce((sum, c) => sum + c[1], 0);
    return [sumLng / validCoords.length, sumLat / validCoords.length];
  };

  // 1. Dynamic CDN Asset Loading
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

  // 2. Mapbox Map Initialization
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapRef.current) return;

    const mapboxgl = window.mapboxgl;

    // Set Mapbox access token (use public sandbox default or frontend env var)
    const token = import.meta.env.VITE_MAPBOX_TOKEN ||
      window.MAPBOX_TOKEN ||
      '';

    if (!token) {
      console.warn('Mapbox access token is missing. Skipping map initialization.');
      setMapError(true);
      return;
    }

    mapboxgl.accessToken = token;

    const [centerLng, centerLat] = getCenterCoords();

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Premium dark style to fit dark theme UI
      center: [centerLng, centerLat],
      zoom: 10,
      attributionControl: false // clean layout
    });

    map.on('error', (e) => {
      console.warn('Mapbox error encountered:', e.error?.message || e);
      setMapError(true);
    });

    mapRef.current = map;

    // Add navigation controls (+/- zoom buttons)
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapLoaded]);

  // 3. Markers Updating & Bounds Fitting
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const mapboxgl = window.mapboxgl;
    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const center = getCenterCoords();

    // Filter coordinates
    const validProviders = providers.filter(p => p.coordinates && p.coordinates.length === 2);
    if (validProviders.length === 0) {
      map.flyTo({ center, zoom: 12 });
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();

    validProviders.forEach((p, index) => {
      const [lng, lat] = p.coordinates;
      bounds.extend([lng, lat]);

      // Create HTML wrapper element for provider marker (Mapbox positions this)
      const el = document.createElement('div');
      el.className = 'mapbox-marker-wrapper';

      // Create child pin element
      const pin = document.createElement('div');
      pin.className = 'provider-marker';

      el.appendChild(pin);

      // Dynamic popup with doctor/lab styling
      const name = p.name || p.labName || 'Healthcare Provider';
      const detail = p.specialty || 'Bengaluru';
      const feeText = p.fee
        ? `<br/><strong style="color:#059669;">Consultation: ₹${p.fee}</strong>`
        : (p.price ? `<br/><strong style="color:#06b6d4;">Price: ₹${p.price}</strong>` : '');

      const popup = new mapboxgl.Popup({ offset: 12, closeButton: true, closeOnClick: true, focusAfterOpen: false })
        .setHTML(`
          <div style="color:#1e293b; font-family:sans-serif; font-size:12px; line-height:1.4; padding:4px;">
            <strong style="font-size:13px; color:#0f172a;">${name}</strong>
            <div style="color:#64748b; font-size:11px; margin-top:2px;">${detail}</div>
            ${feeText}
          </div>
        `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      // Event: click to select card
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onSelectProvider) {
          onSelectProvider(p.labId || p.doctorId);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit bounds pad coordinates nicely
    if (validProviders.length > 0) {
      map.fitBounds(bounds, {
        padding: { top: 40, bottom: 40, left: 40, right: 40 },
        maxZoom: 12,
        duration: 1200
      });
    }
  }, [providers, mapLoaded]);

  // 4. FlyTo Active Selection Animation
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !activeProviderId) return;

    const activeProvider = providers.find(p => p.labId === activeProviderId || p.doctorId === activeProviderId);
    if (activeProvider && activeProvider.coordinates) {
      mapRef.current.flyTo({
        center: activeProvider.coordinates,
        zoom: 14,
        speed: 1.2,
        curve: 1.42,
        essential: true
      });

      const validProviders = providers.filter(p => p.coordinates && p.coordinates.length === 2);

      // Close all popups, then open the active one
      markersRef.current.forEach((m, idx) => {
        const p = validProviders[idx];
        if (p && (p.labId === activeProviderId || p.doctorId === activeProviderId)) {
          if (!m.getPopup().isOpen()) {
            m.togglePopup();
          }
        } else {
          if (m.getPopup().isOpen()) {
            m.getPopup().remove();
          }
        }
      });
    }
  }, [activeProviderId, mapLoaded]);

  return (
    <div className="glass-panel map-view-panel">
      <div className="map-view-header">
        <h4 className="map-view-title">
          <Compass size={18} className="map-view-title-icon" />
          Bengaluru Interactive Map
        </h4>
        <span className="map-view-status">
          Mapbox Live
        </span>
      </div>

      {/* Map Element Container Wrapper */}
      <div className="map-view-container-wrapper">
        <div
          ref={mapContainerRef}
          className="map-view-container"
        />
      </div>

      {/* Map Legend */}
      <div className="map-view-legend">
        <div className="map-view-legend-item">
          <span className="map-view-legend-dot" />
          <span className="map-view-legend-text">Providers</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
