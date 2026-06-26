import Icon from '../core/Icon';
import AvatarStack from '../core/AvatarStack';

/**
 * TripCover — the signature FLUENT hero card for a trip.
 * Gradient (or photo) backdrop, dark bottom scrim for legibility, glass info bar.
 * This is the main place the "fluent" material appears in the product.
 */
const GRADIENTS = {
  sky: 'var(--grad-sky)',
  brand: 'var(--grad-brand-vivid)',
  sunset: 'var(--grad-sunset)',
  mesh: 'var(--grad-mesh)',
};

function 
TripCover({ title, dates, location, people = [], image, gradient = 'sky', status, height = 200, onClick, style, ...rest }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        height,
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        background: image ? `#1E3A85 url(${image}) center/cover` : GRADIENTS[gradient] || GRADIENTS.sky,
        boxShadow: 'var(--shadow-md)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#fff',
        isolation: 'isolate',
        ...style,
      }}
      {...rest}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'var(--scrim-bottom)', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16 }}>
        {status && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              
              padding: '5px 11px',
              borderRadius: 'var(--r-pill)',
              background: 'var(--glass-fill-strong)',
              border: '1px solid var(--glass-stroke)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              font: "var(--fw-semibold) var(--fs-xs)/1 'Inter', sans-serif",
              letterSpacing: '0.02em',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
            {status}
          </span>
        )}
      </div>
      <div style={{ position: 'relative', zIndex: 1, padding: 16 }}>
        {location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: 0.92, marginBottom: 4 }}>
            <Icon name="pin" size={14} strokeWidth={2.25} />
            <span style={{ font: "var(--fw-medium) var(--fs-sm)/1 'Inter', sans-serif" }}>{location}</span>
          </div>
        )}
        <h2
          style={{
            font: "var(--fw-extra) 24px/1.1 'Plus Jakarta Sans', sans-serif",
            letterSpacing: '-0.02em',
            color: '#fff',
            marginBottom: 12,
            textShadow: '0 1px 12px rgba(0,0,0,0.25)',
          }}
        >
          {title}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {dates && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 'var(--r-pill)',
                background: 'var(--glass-fill-strong)',
                border: '1px solid var(--glass-stroke)',
                backdropFilter: 'blur(var(--glass-blur))',
                WebkitBackdropFilter: 'blur(var(--glass-blur))',
                font: "var(--fw-semibold) var(--fs-sm)/1 'Inter', sans-serif",
              }}
            >
              <Icon name="calendar" size={14} strokeWidth={2} />
              {dates}
            </span>
          )}
          {people.length > 0 && <AvatarStack people={people} size="sm" max={4} />}
        </div>
      </div>
    </div>
  );
}

export default TripCover;
