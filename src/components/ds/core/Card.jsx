import { useState } from 'react';

/**
 * Card — the minimalist base surface: white, hairline border, soft shadow.
 * Set `interactive` for hover-lift on tappable cards.
 * Set `elevation` to control shadow depth.
 */
const ELEV = {
  flat: 'none',
  xs: 'var(--shadow-xs)',
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
};

function Card({
  children,
  elevation = 'sm',
  interactive = false,
  padding = 'var(--card-pad)',
  radius = 'var(--r-lg)',
  as = 'div',
  style,
  ...rest
}) {
  const Tag = as;
  const [hover, setHover] = useState(false);
  return (
    <Tag
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: radius,
        padding,
        boxShadow: hover && interactive ? 'var(--shadow-md)' : ELEV[elevation],
        transition: 'var(--t-control)',
        transform: hover && interactive ? 'var(--lift)' : 'none',
        cursor: interactive ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={interactive ? () => setHover(true) : undefined}
      onMouseLeave={interactive ? () => setHover(false) : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Card;
