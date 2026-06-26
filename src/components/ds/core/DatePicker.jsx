import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const FONT = "'Inter', sans-serif";

function parseISO(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sameDay(a, b) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildMonthGrid(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
}

/**
 * DatePicker — calendar-grid date field. Value/onChange use 'yyyy-mm-dd' strings,
 * matching native <input type="date"> so it drops in anywhere that format is used.
 */
function DatePicker({ label, value, onChange, min, required, disabled, id, containerStyle }) {
  const [open, setOpen] = useState(false);
  const selected = parseISO(value);
  const minDate = parseISO(min);
  const [viewDate, setViewDate] = useState(selected || minDate || new Date());
  const rootRef = useRef(null);
  const fieldId = id || (label ? `dp-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const toggle = () => {
    if (disabled) return;
    if (!open) setViewDate(selected || minDate || new Date());
    setOpen((o) => !o);
  };

  const pick = (day) => {
    if (minDate && day < minDate && !sameDay(day, minDate)) return;
    onChange(toISO(day));
    setOpen(false);
  };

  const days = buildMonthGrid(viewDate);
  const today = new Date();
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div ref={rootRef} style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', ...containerStyle }}>
      {label && (
        <label htmlFor={fieldId} style={{ font: `var(--fw-semibold) var(--fs-sm)/1 ${FONT}`, color: 'var(--text-body)' }}>
          {label}
        </label>
      )}
      <button
        type="button"
        id={fieldId}
        disabled={disabled}
        required={required}
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 9, height: 48, padding: '0 14px', width: '100%',
          background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
          border: `1.5px solid ${open ? 'var(--brand)' : 'var(--border-default)'}`,
          borderRadius: 'var(--r-md)', boxShadow: open ? 'var(--ring)' : 'none',
          transition: 'var(--t-control)', cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
        }}
      >
        <Icon name="calendar" size={18} color="var(--text-subtle)" />
        <span style={{ flex: 1, font: `var(--fw-medium) var(--fs-body)/1 ${FONT}`, color: selected ? 'var(--text-strong)' : 'var(--text-subtle)' }}>
          {selected ? selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}
        </span>
        <Icon name="chevronDown" size={16} color="var(--text-subtle)" />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 6, width: 272, zIndex: 40,
            background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', padding: 14,
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <button
              type="button" aria-label="Previous month"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28,
                borderRadius: 'var(--r-pill)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)',
              }}
            >
              <Icon name="chevronLeft" size={16} />
            </button>
            <span style={{ font: `var(--fw-semibold) var(--fs-sm)/1 ${FONT}`, color: 'var(--text-strong)' }}>{monthLabel}</span>
            <button
              type="button" aria-label="Next month"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28,
                borderRadius: 'var(--r-pill)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)',
              }}
            >
              <Icon name="chevronRight" size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {WEEKDAYS.map((w) => (
              <div key={w} style={{ textAlign: 'center', font: `var(--fw-medium) 11px/1 ${FONT}`, color: 'var(--text-subtle)', padding: '4px 0 8px' }}>
                {w}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {days.map((day) => {
              const inMonth = day.getMonth() === viewDate.getMonth();
              const isSelected = sameDay(day, selected);
              const isToday = sameDay(day, today);
              const isDisabled = minDate && day < minDate && !sameDay(day, minDate);
              return (
                <button
                  key={toISO(day)}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => pick(day)}
                  style={{
                    height: 32, borderRadius: 'var(--r-sm)', border: 'none',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    font: `var(--fw-medium) var(--fs-sm)/1 ${FONT}`,
                    background: isSelected ? 'var(--brand)' : 'transparent',
                    color: isDisabled ? 'var(--text-subtle)' : isSelected ? '#fff' : inMonth ? 'var(--text-body)' : 'var(--text-subtle)',
                    opacity: isDisabled ? 0.4 : 1,
                    boxShadow: isToday && !isSelected ? 'inset 0 0 0 1.5px var(--brand)' : 'none',
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default DatePicker;
