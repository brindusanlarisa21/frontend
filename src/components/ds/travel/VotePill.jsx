import Icon from '../core/Icon';

/**
 * VotePill — thumbs-up vote counter for proposed activities.
 * Toggles filled/brand when the current user has voted.
 */
function VotePill({ count = 0, voted = false, onClick, style, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={voted}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        height: 32,
        padding: '0 11px',
        borderRadius: 'var(--r-pill)',
        cursor: 'pointer',
        transition: 'var(--t-control)',
        WebkitTapHighlightColor: 'transparent',
        background: voted ? 'var(--brand-soft)' : 'var(--surface-card)',
        color: voted ? 'var(--brand)' : 'var(--text-muted)',
        border: `1px solid ${voted ? 'transparent' : 'var(--border-default)'}`,
        ...style,
      }}
      {...rest}
    >
      <Icon name="thumbsUp" size={15} strokeWidth={2} color="currentColor" style={voted ? { fill: 'currentColor' } : undefined} />
      <span style={{ font: "var(--fw-bold) var(--fs-sm)/1 'Inter', sans-serif", fontVariantNumeric: 'tabular-nums' }}>{count}</span>
    </button>
  );
}

export default VotePill;
