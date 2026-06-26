/**
 * Avatar — circular user image, or a deterministic gradient with initials.
 * No external image dependency required.
 */
const SIZES = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 };
const FS = { xs: 10, sm: 12, md: 15, lg: 20, xl: 26 };

// Friendly on-brand gradient pairs, picked deterministically from the name.
const GRADIENTS = [
  ['#2563EB', '#06B6D4'], ['#06B6D4', '#10B981'], ['#3B6BF5', '#8B5CF6'],
  ['#F59E0B', '#EF4444'], ['#8B5CF6', '#EC4899'], ['#0EA5A4', '#3B6BF5'],
  ['#F97316', '#F59E0B'], ['#10B981', '#06B6D4'],
];

function hash(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function initials(name = '') {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?';
}

function Avatar({ name = '', src, size = 'md', ring = false, status, style, ...rest }) {
  const d = SIZES[size] || SIZES.md;
  const [g1, g2] = GRADIENTS[hash(name) % GRADIENTS.length];
  const ringStyle = ring
    ? { boxShadow: '0 0 0 2px var(--surface-card), 0 0 0 3.5px var(--border-default)' }
    : {};
  const statusColors = {
    online: 'var(--success)',
    away: 'var(--warning)',
    offline: 'var(--slate-300)',
  };
  return (
    <div style={{ position: 'relative', width: d, height: d, flex: 'none', ...style }} {...rest}>
      <div
        style={{
          width: d,
          height: d,
          borderRadius: 'var(--r-pill)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: src ? '#fff' : `linear-gradient(135deg, ${g1}, ${g2})`,
          color: '#fff',
          font: `var(--fw-bold) ${FS[size]}px/1 'Plus Jakarta Sans', sans-serif`,
          letterSpacing: '0.01em',
          ...ringStyle,
        }}
      >
        {src ? (
          <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span>{initials(name)}</span>
        )}
      </div>
      {status && (
        <span
          style={{
            position: 'absolute',
            right: -1,
            bottom: -1,
            width: Math.max(8, d * 0.28),
            height: Math.max(8, d * 0.28),
            borderRadius: '50%',
            background: statusColors[status],
            border: '2px solid var(--surface-card)',
          }}
        />
      )}
    </div>
  );
}

export default Avatar;
