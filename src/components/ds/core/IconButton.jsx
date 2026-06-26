import Icon from './Icon';

/**
 * IconButton — square tappable control for chrome (back, more, bell…).
 * variants mirror Button; defaults to a quiet minimalist surface.
 */
const SIZES = { sm: 36, md: 44, lg: 52 };
const ICON = { sm: 18, md: 20, lg: 22 };

function vStyle(variant) {
  switch (variant) {
    case 'solid':
      return { background: 'var(--grad-brand)', color: '#fff', boxShadow: 'var(--glow-brand)', border: '1px solid transparent' };
    case 'tonal':
      return { background: 'var(--brand-soft)', color: 'var(--brand-soft-fg)', border: '1px solid transparent' };
    case 'ghost':
      return { background: 'transparent', color: 'var(--text-body)', border: '1px solid transparent' };
    case 'glass':
      return {
        background: 'var(--glass-fill-strong)',
        color: '#fff',
        border: '1px solid var(--glass-stroke)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
      };
    case 'surface':
    default:
      return { background: 'var(--surface-card)', color: 'var(--text-body)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xs)' };
  }
}

function IconButton({ icon, variant = 'surface', size = 'md', label, rounded = true, style, disabled, ...rest }) {
  const d = SIZES[size] || SIZES.md;
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: d,
        height: d,
        borderRadius: rounded ? 'var(--r-pill)' : 'var(--r-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'var(--t-control)',
        WebkitTapHighlightColor: 'transparent',
        padding: 0,
        ...vStyle(variant),
        ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.92)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = ''; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
      {...rest}
    >
      <Icon name={icon} size={ICON[size]} strokeWidth={2} />
    </button>
  );
}

export default IconButton;
