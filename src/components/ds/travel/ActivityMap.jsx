import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CATEGORY_COLOR = {
  sight: '#2563EB',
  food: '#F59E0B',
  stay: '#8B5CF6',
  travel: '#06B6D4',
  fun: '#10B981',
  transit: '#4D5563',
};

function markerIcon(category) {
  const color = CATEGORY_COLOR[category] || CATEGORY_COLOR.sight;
  return L.divIcon({
    className: '',
    html: `
      <svg width="26" height="26" viewBox="0 0 24 24" style="display:block;filter:drop-shadow(0 1px 3px rgba(20,24,33,0.45));">
        <path d="M12 21c5-5 7.5-8.6 7.5-11.5A7.5 7.5 0 0 0 4.5 9.5C4.5 12.4 7 16 12 21Z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
        <circle cx="12" cy="9.5" r="2.6" fill="#fff"/>
      </svg>`,
    iconSize: [26, 26],
    iconAnchor: [13, 25],
    popupAnchor: [0, -22],
  });
}

function popupContent(title, location) {
  const wrap = document.createElement('div');
  const titleEl = document.createElement('div');
  titleEl.textContent = title;
  titleEl.style.font = "600 13px/1.3 'Inter', sans-serif";
  titleEl.style.color = '#141821';
  wrap.appendChild(titleEl);

  if (location) {
    const locationEl = document.createElement('div');
    locationEl.textContent = location;
    locationEl.style.font = "500 12px/1.3 'Inter', sans-serif";
    locationEl.style.color = '#6B7585';
    locationEl.style.marginTop = '2px';
    wrap.appendChild(locationEl);
  }

  return wrap;
}

/**
 * ActivityMap — Leaflet + OpenStreetMap widget pinning every geocoded activity on the trip.
 * No API key required.
 */
function ActivityMap({ activities = [], height = 320, style }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const pinned = activities.filter((a) => a.latitude != null && a.longitude != null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [20, 0], zoom: 1.5 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = []
    if (pinned.length === 0) return;

    const points = pinned.map((a) => [a.latitude, a.longitude]);
    pinned.forEach((a, i) => {
      const marker = L.marker(points[i], { icon: markerIcon(a.category?.toLowerCase()) })
        .bindPopup(popupContent(a.title, a.location))
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (points.length === 1) {
      map.setView(points[0], 12);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    }
  }, [pinned]);

  return (
    <div
      style={{
        position: 'relative', zIndex: 0, height, borderRadius: 'var(--r-lg)', overflow: 'hidden',
        border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', ...style,
      }}
    >
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      {pinned.length === 0 && (
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, textAlign: 'center', pointerEvents: 'none',
          }}
        >
          <span
            style={{
              background: 'var(--surface-card)', padding: '8px 14px', borderRadius: 'var(--r-pill)',
              boxShadow: 'var(--shadow-sm)', font: "var(--fw-medium) var(--fs-sm)/1.3 'Inter', sans-serif", color: 'var(--text-muted)',
            }}
          >
            Add a place to your activities to see it here.
          </span>
        </div>
      )}
    </div>
  );
}

export default ActivityMap;
