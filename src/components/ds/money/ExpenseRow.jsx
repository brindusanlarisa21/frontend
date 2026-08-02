import Icon from '../core/Icon';
import MoneyAmount from '../core/MoneyAmount';

/**
 * ExpenseRow — one logged shared expense in the expenses list.
 * Category tile, title + "paid by", total amount, and your share line.
 */
const CAT = {
  food: { icon: 'utensils', bg: 'var(--amber-50)', fg: 'var(--amber-600)' },
  stay: { icon: 'bed', bg: 'var(--brand-soft)', fg: 'var(--brand)' },
  travel: { icon: 'plane', bg: 'var(--accent-soft)', fg: 'var(--cyan-600)' },
  transit: { icon: 'car', bg: 'var(--slate-100)', fg: 'var(--slate-600)' },
  fun: { icon: 'ticket', bg: '#F3E8FF', fg: 'var(--violet-600)' },
  shop: { icon: 'receipt', bg: 'var(--owed-soft)', fg: 'var(--green-600)' },
};

function ExpenseRow({ title, category = 'food', paidBy, total = 0, currency = 'USD', yourShare, youPaid = false, settled = false, splitCount, onClick, style, ...rest }) {
  const c = CAT[category] || CAT.food;
  let formattedTotal;
  try {
    formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(total);
  } catch {
    formattedTotal = '$' + total.toFixed(2);
  }

  const splitLabel = splitCount > 0 ? `÷ ${splitCount} people` : null;

  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 4px', cursor: onClick ? 'pointer' : 'default', WebkitTapHighlightColor: 'transparent', ...style }}
      {...rest}
    >
      <div style={{ width: 42, height: 42, flex: 'none', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg, color: c.fg }}>
        <Icon name={c.icon} size={21} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "var(--fw-semibold) var(--fs-title)/1.2 'Inter', sans-serif", color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        <div style={{ font: "var(--fw-regular) var(--fs-sm)/1 'Inter', sans-serif", color: 'var(--text-muted)', marginTop: 3 }}>
          {paidBy ? (
            <>
              {youPaid ? 'You' : paidBy} paid{' '}
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 'var(--fw-semibold)', color: 'var(--text-body)' }}>
                {formattedTotal}
              </span>
              {splitLabel && (
                <span style={{ marginLeft: 6, color: 'var(--text-subtle)' }}>{splitLabel}</span>
              )}
            </>
          ) : null}
        </div>
      </div>
      <div style={{ textAlign: 'right', flex: 'none' }}>
        {settled ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: "var(--fw-semibold) var(--fs-sm)/1 'Inter',sans-serif", color: 'var(--settled)' }}>
            <Icon name="check" size={14} strokeWidth={2.5} />settled
          </span>
        ) : (
          <>
            <MoneyAmount amount={Math.abs(yourShare ?? 0)} currency={currency} tone={youPaid ? 'owed' : 'owe'} size="md" />
            <div style={{ font: "var(--fw-medium) var(--fs-xs)/1 'Inter', sans-serif", color: 'var(--text-subtle)', marginTop: 3 }}>
              {youPaid ? 'you are owed' : 'your share'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ExpenseRow;
