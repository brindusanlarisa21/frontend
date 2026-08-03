import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'

ChartJS.register(ArcElement, Tooltip)

/**
 * Budget ring driven by real numbers: how much of `budget` `spent` has eaten.
 * With no budget set it degrades to a neutral ring plus a prompt to set one.
 */
export default function BudgetRing({ spent = 0, budget, currency = 'EUR', size = 60, label = 'din buget' }) {
  const hasBudget = budget != null && budget > 0
  const pct = hasBudget ? Math.round((spent / budget) * 100) : null
  const over = hasBudget && spent > budget

  const color = !hasBudget ? 'rgba(18,41,74,.18)'
    : over ? '#e2564a'
    : pct >= 80 ? '#ff7a45'
    : '#1f6feb'

  const data = useMemo(() => ({
    datasets: [{
      data: hasBudget ? [Math.min(spent, budget), Math.max(budget - spent, 0)] : [0, 1],
      backgroundColor: [color, 'rgba(18,41,74,.10)'],
      borderWidth: 0,
      circumference: 360,
    }],
  }), [spent, budget, hasBudget, color])

  const options = useMemo(() => ({
    cutout: '68%',
    responsive: false,
    maintainAspectRatio: false,
    plugins: { tooltip: { enabled: false }, legend: { display: false } },
    animation: { duration: 400 },
  }), [])

  const fmt = (n) => new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 }).format(n)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
        <Doughnut data={data} options={options} width={size} height={size} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          font: `800 ${Math.round(size * 0.18)}px/1 Archivo, sans-serif`,
          color: over ? '#e2564a' : 'var(--ink)',
        }}>
          {hasBudget ? `${pct}%` : '—'}
        </div>
      </div>
      <div>
        <div style={{ font: '800 18px/1 Archivo, sans-serif', color: over ? '#e2564a' : 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
          {hasBudget ? `${fmt(spent)} / ${fmt(budget)} ${currency}` : `${fmt(spent)} ${currency}`}
        </div>
        <div style={{ font: '400 11px/1 Archivo, sans-serif', color: over ? 'var(--orange-700)' : 'var(--text-muted)', marginTop: 3 }}>
          {!hasBudget ? 'niciun buget setat' : over ? `depășit cu ${fmt(spent - budget)} ${currency}` : label}
        </div>
      </div>
    </div>
  )
}
