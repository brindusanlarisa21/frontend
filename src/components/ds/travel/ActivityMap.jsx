import { useEffect, useMemo, useRef } from 'react';
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
  const fitRef = useRef(null);

  // Memoised so the marker effect does not re-run (and re-fit the view) on every render.
  const pinned = useMemo(
    () => activities.filter((a) => a.latitude != null && a.longitude != null),
    [activities],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [20, 0], zoom: 1.5 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    // Leaflet caches the container size. When the box is revealed after mount or
    // resized, the size must be refreshed AND the view re-fitted — a fit computed
    // against a zero-sized container leaves the pins off-screen.
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      fitRef.current?.();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = []

    if (pinned.length === 0) {
      fitRef.current = null;
      return;
    }

    const points = pinned.map((a) => [a.latitude, a.longitude]);
    pinned.forEach((a, i) => {
      const marker = L.marker(points[i], { icon: markerIcon(a.category?.toLowerCase()) })
        .bindPopup(popupContent(a.title, a.location))
        .addTo(map);
      markersRef.current.push(marker);
    });

    const fit = () => {
      // Nothing sensible to compute against a collapsed container.
      if (!map.getSize().x) return;
      if (points.length === 1) map.setView(points[0], 12);
      else map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    };

    fitRef.current = fit;
    fit();
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
            Adaugă un loc la o activitate ca să apară aici.
          </span>
        </div>
      )}
    </div>
  );
}

export default ActivityMap;
