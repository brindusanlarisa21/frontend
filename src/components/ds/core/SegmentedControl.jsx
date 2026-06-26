/**
 * SegmentedControl — minimalist pill switch with a sliding active thumb.
 * Used for view toggles (e.g. Itinerary / Expenses / Chat, or Day 1 / 2 / 3).
 */
function SegmentedControl({ options = [], value, onChange, size = 'md', style, ...rest }) {
  const idx = Math.max(0, options.findIndex((o) => (o.value ?? o) === value));
  const h = size === 'sm' ? 34 : 40;
  const fs = size === 'sm' ? 13 : 14;
  return (
    <div
      role="tablist"
      style={{
        position: 'relative',
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: '1fr',
        gap: 0,
        padding: 4,
        height: h,
        background: 'var(--surface-sunken)',
        borderRadius: 'var(--r-pill)',
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 4,
          width: `calc((100% - 8px) / ${options.length})`,
          transform: `translateX(${idx * 100}%)`,
          background: 'var(--surface-card)',
          borderRadius: 'var(--r-pill)',
          boxShadow: 'var(--shadow-sm)',
          transition: 'transform var(--dur-base) var(--ease-out)',
        }}
      />
      {options.map((o) => {
        const val = o.value ?? o;
        const lab = o.label ?? o;
        const active = val === value;
        return (
          <button
            key={val}
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(val)}
            style={{
              position: 'relative',
              zIndex: 1,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              font: `var(--fw-semibold) ${fs}px/1 'Inter', sans-serif`,
              color: active ? 'var(--text-strong)' : 'var(--text-muted)',
              transition: 'color var(--dur-fast) var(--ease-out)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {lab}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
