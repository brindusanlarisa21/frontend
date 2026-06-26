/**
 * MoneyAmount — formats currency with tabular figures and money semantics.
 * tone: "owe" (red, you owe), "owed" (green, you're owed), "neutral", "settled".
 * Shows a +/- sign automatically for owe/owed unless signed={false}.
 */
const TONES = {
  neutral: 'var(--text-strong)',
  owe: 'var(--owe)',
  owed: 'var(--owed)',
  settled: 'var(--settled)',
  brand: 'var(--brand)',
  onglass: '#fff',
};
const SIZES = { sm: 14, md: 16, lg: 22, xl: 34 };

function MoneyAmount({
  amount = 0,
  currency = 'USD',
  locale = 'en-US',
  tone = 'neutral',
  size = 'md',
  signed,
  weight = 'var(--fw-bold)',
  style,
  ...rest
}) {
  const showSign = signed ?? (tone === 'owe' || tone === 'owed');
  const sign = showSign ? (tone === 'owe' ? '−' : '+') : '';
  let formatted;
  try {
    formatted = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2 }).format(Math.abs(amount));
  } catch {
    formatted = '$' + Math.abs(amount).toFixed(2);
  }
  return (
    <span
      style={{
        font: `${weight} ${SIZES[size]}px/1 'Inter', sans-serif`,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.01em',
        color: TONES[tone] || TONES.neutral,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {sign}{formatted}
    </span>
  );
}

export default MoneyAmount;
