


import Avatar from '../core/Avatar';
import Icon from '../core/Icon';
import Button from '../core/Button';
import MoneyAmount from '../core/MoneyAmount';

/**
 * SettleUpRow — a single "who pays who" debt in the simplified settle-up list.
 * from → to with avatars, the amount, and a Settle action.
 */
function SettleUpRow({ from, to, amount = 0, currency = 'USD', onSettle, settled = false, style, ...rest }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-xs)',
        ...style,
      }}
      {...rest}
    >
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, gap: 4 }}>
        <Avatar name={from?.name} src={from?.src} size="sm" />
        <Icon name="arrowRight" size={16} color="var(--text-subtle)" style={{ margin: '0 2px' }} />
        <Avatar name={to?.name} src={to?.src} size="sm" />
        <div style={{ marginLeft: 8, minWidth: 0 }}>
          <div style={{ font: "var(--fw-medium) var(--fs-sm)/1.3 'Inter', sans-serif", color: 'var(--text-body)' }}>
            <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{from?.name}</span> pays{' '}
            <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{to?.name}</span>
          </div>
          <MoneyAmount amount={amount} currency={currency} tone="neutral" size="sm" signed={false} style={{ marginTop: 2 }} />
        </div>
      </div>
      {settled ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: "var(--fw-semibold) var(--fs-sm)/1 'Inter',sans-serif", color: 'var(--owed)' }}>
          <Icon name="check" size={15} strokeWidth={2.5} />Settled
        </span>
      ) : (
        <Button size="sm" variant="tonal" onClick={onSettle}>Settle</Button>
      )}
    </div>
  );
}

export default SettleUpRow;
