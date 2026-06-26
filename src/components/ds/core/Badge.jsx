import Icon from './Icon';

/**
 * Badge — small status/label pill. Soft tinted fills by tone.
 */
const TONES = {
  neutral: { bg: 'var(--slate-100)', fg: 'var(--slate-600)' },
  brand: { bg: 'var(--brand-soft)', fg: 'var(--brand-soft-fg)' },
  accent: { bg: 'var(--accent-soft)', fg: 'var(--cyan-700)' },
  success: { bg: 'var(--success-soft)', fg: 'var(--green-700)' },
  danger: { bg: 'var(--danger-soft)', fg: 'var(--red-700)' },
  warning: { bg: 'var(--warning-soft)', fg: 'var(--amber-700)' },
  owe: { bg: 'var(--owe-soft)', fg: 'var(--red-700)' },
  owed: { bg: 'var(--owed-soft)', fg: 'var(--green-700)' },
};

function Badge({ children, tone = 'neutral', icon, dot = false, solid = false, style, ...rest }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 'var(--r-pill)',
        background: solid ? t.fg : t.bg,
        color: solid ? '#fff' : t.fg,
        font: "var(--fw-semibold) var(--fs-xs)/1 'Inter', sans-serif",
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}
      {icon && <Icon name={icon} size={12} strokeWidth={2.25} />}
      {children}
    </span>
  );
}

export default Badge;
