import Avatar from './Avatar';

/**
 * AvatarStack — overlapping group avatars with optional "+N" overflow.
 * Used on trip cards, expense splits, chat headers.
 */
const SIZES = { xs: 24, sm: 32, md: 40, lg: 56 };
const FS = { xs: 10, sm: 12, md: 14, lg: 17 };

function AvatarStack({ people = [], size = 'sm', max = 4, overlap = 0.36, style, ...rest }) {
  const d = SIZES[size] || SIZES.sm;
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  const shift = d * overlap;
  return (
    <div style={{ display: 'flex', alignItems: 'center', ...style }} {...rest}>
      {shown.map((p, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -shift, position: 'relative', zIndex: i }}>
          <Avatar name={p.name} src={p.src} size={size} ring />
        </div>
      ))}
      {extra > 0 && (
        <div
          style={{
            marginLeft: -shift,
            width: d,
            height: d,
            borderRadius: 'var(--r-pill)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--slate-100)',
            color: 'var(--text-muted)',
            font: `var(--fw-bold) ${FS[size]}px/1 'Plus Jakarta Sans', sans-serif`,
            boxShadow: '0 0 0 2px var(--surface-card)',
            zIndex: shown.length,
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

export default AvatarStack;
