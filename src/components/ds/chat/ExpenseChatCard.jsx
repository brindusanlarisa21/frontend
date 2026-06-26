import Icon from '../core/Icon';
import MoneyAmount from '../core/MoneyAmount';

/**
 * ExpenseChatCard — an inline "expense added" event inside the group chat.
 * Connects the money + chat features: shows when someone logs a shared expense.
 */
function ExpenseChatCard({ who, youAdded = false, title, total = 0, currency = 'USD', yourShare = 0, onView, style, ...rest }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', ...style }} {...rest}>
      <div
        onClick={onView}
        style={{
          width: '88%',
          maxWidth: 320,
          padding: 14,
          borderRadius: 'var(--r-lg)',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
          cursor: onView ? 'pointer' : 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: 'var(--brand-soft)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="receipt" size={16} strokeWidth={2} />
          </div>
          <span style={{ font: "var(--fw-semibold) var(--fs-sm)/1.2 'Inter', sans-serif", color: 'var(--text-body)' }}>
            {youAdded ? 'You' : who} added an expense
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ font: "var(--fw-semibold) var(--fs-title)/1.2 'Inter', sans-serif", color: 'var(--text-strong)' }}>{title}</div>
            <MoneyAmount amount={total} currency={currency} tone="neutral" size="sm" signed={false} weight="var(--fw-medium)" style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <MoneyAmount amount={yourShare} currency={currency} tone={youAdded ? 'owed' : 'owe'} size="md" />
            <div style={{ font: "var(--fw-medium) var(--fs-xs)/1 'Inter', sans-serif", color: 'var(--text-subtle)', marginTop: 2 }}>
              {youAdded ? 'you lent' : 'your share'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpenseChatCard;
