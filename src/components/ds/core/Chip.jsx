import Icon from './Icon';

/**
 * Chip — interactive filter / choice / category token. Toggle-able.
 */
function Chip({ children, icon, selected = false, onClick, style, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 34,
        padding: '0 14px',
        borderRadius: 'var(--r-pill)',
        font: "var(--fw-medium) var(--fs-sm)/1 'Inter', sans-serif",
        cursor: 'pointer',
        transition: 'var(--t-control)',
        WebkitTapHighlightColor: 'transparent',
        background: selected ? 'var(--slate-900)' : 'var(--surface-card)',
        color: selected ? '#fff' : 'var(--text-body)',
        border: `1px solid ${selected ? 'var(--slate-900)' : 'var(--border-default)'}`,
        boxShadow: selected ? 'none' : 'var(--shadow-xs)',
        ...style,
      }}
      {...rest}
    >
      {icon && <Icon name={icon} size={15} strokeWidth={2} />}
      {children}
    </button>
  );
}

export default Chip;
