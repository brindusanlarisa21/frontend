import Icon from './Icon';

/**
 * Button — TripSplit's primary action control.
 * - "primary"   : fluent gradient + brand glow (hero CTA)
 * - "secondary" : minimalist white, hairline border
 * - "ghost"     : transparent, brand text
 * - "tonal"     : soft brand tint fill
 * - "danger"    : destructive
 */
const FONT = "'Inter', system-ui, sans-serif";
const SIZES = {
  sm: { h: 36, px: 14, fs: 13, gap: 6, icon: 16, r: 'var(--r-sm)' },
  md: { h: 44, px: 18, fs: 15, gap: 8, icon: 18, r: 'var(--r-md)' },
  lg: { h: 52, px: 22, fs: 16, gap: 9, icon: 20, r: 'var(--r-md)' },
};

function variantStyle(variant) {
  switch (variant) {
    case 'secondary':
      return { background: 'var(--surface-card)', color: 'var(--text-strong)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xs)' };
    case 'ghost':
      return { background: 'transparent', color: 'var(--brand)', border: '1px solid transparent' };
    case 'tonal':
      return { background: 'var(--brand-soft)', color: 'var(--brand-soft-fg)', border: '1px solid transparent' };
    case 'danger':
      return { background: 'var(--danger)', color: '#fff', border: '1px solid transparent', boxShadow: '0 6px 18px rgba(239,68,68,0.30)' };
    case 'primary':
    default:
      return { background: 'var(--grad-brand)', color: 'var(--text-onbrand)', border: '1px solid transparent', boxShadow: 'var(--glow-brand)' };
  }
}

function Button({
  children,
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  disabled = false,
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    height: s.h,
    padding: `0 ${s.px}px`,
    width: fullWidth ? '100%' : 'auto',
    font: `var(--fw-semibold) ${s.fs}px/1 ${FONT}`,
    letterSpacing: '-0.01em',
    borderRadius: s.r,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    transition: 'var(--t-control)',
    WebkitTapHighlightColor: 'transparent',
    ...variantStyle(variant),
    ...style,
  };
  return (
    <button
      type="button"
      disabled={disabled}
      style={base}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(var(--press-scale))'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = ''; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
      {...rest}
    >
      {leadingIcon && <Icon name={leadingIcon} size={s.icon} strokeWidth={2} />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} size={s.icon} strokeWidth={2} />}
    </button>
  );
}

export default Button;
