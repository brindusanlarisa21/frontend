import Icon from '../core/Icon';
import MoneyAmount from '../core/MoneyAmount';

/**
 * BalanceHero — FLUENT gradient hero summarizing the user's net trip balance.
 * Big number on a brand-mesh gradient with a frosted breakdown strip.
 * Reserve this treatment for the top of the Expenses screen.
 */
function BalanceHero({ net = 0, currency = 'USD', youOwe = 0, youAreOwed = 0, label = 'Your balance', style, ...rest }) {
  const positive = net >= 0;
  let formattedNet;
  try {
    formattedNet = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Math.abs(net));
  } catch {
    formattedNet = '$' + Math.abs(net).toFixed(2);
  }
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        background: 'var(--grad-mesh)',
        color: '#fff',
        padding: 20,
        boxShadow: 'var(--glow-brand)',
        isolation: 'isolate',
        ...style,
      }}
      {...rest}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'var(--scrim-top)', opacity: 0.5, zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, opacity: 0.9 }}>
          <Icon name="wallet" size={16} strokeWidth={2} />
          <span style={{ font: "var(--fw-semibold) var(--fs-sm)/1 'Inter', sans-serif", letterSpacing: '0.01em' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
          <span
            style={{
              font: "var(--fw-extra) 38px/1 'Plus Jakarta Sans', sans-serif",
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              textShadow: '0 2px 16px rgba(0,0,0,0.18)',
            }}
          >
            {positive ? '+' : '−'}{formattedNet}
          </span>
        </div>
        <div style={{ font: "var(--fw-medium) var(--fs-sm)/1 'Inter', sans-serif", opacity: 0.88, marginTop: 4 }}>
          {positive ? "you're owed overall" : 'you owe overall'}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 18,
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
            background: 'var(--glass-fill)',
            border: '1px solid var(--glass-stroke)',
            backdropFilter: 'blur(var(--glass-blur))',
            WebkitBackdropFilter: 'blur(var(--glass-blur))',
          }}
        >
          <div style={{ flex: 1, padding: '11px 14px', borderRight: '1px solid var(--glass-stroke)' }}>
            <div style={{ font: "var(--fw-medium) var(--fs-xs)/1 'Inter', sans-serif", opacity: 0.85, marginBottom: 5 }}>You are owed</div>
            <MoneyAmount amount={youAreOwed} currency={currency} tone="onglass" size="md" signed={false} />
          </div>
          <div style={{ flex: 1, padding: '11px 14px' }}>
            <div style={{ font: "var(--fw-medium) var(--fs-xs)/1 'Inter', sans-serif", opacity: 0.85, marginBottom: 5 }}>You owe</div>
            <MoneyAmount amount={youOwe} currency={currency} tone="onglass" size="md" signed={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BalanceHero;
