import { useState, useRef, useEffect, useCallback } from 'react'
import { searchLocations } from '../../../api/geocode'
import Icon from '../core/Icon'

function LocationSearch({ label = 'Place', onSelect, style }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  const search = useCallback(async (q) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    const res = await searchLocations(q)
    setLoading(false)
    setResults(res)
    setOpen(res.length > 0)
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setSelected(null)
    onSelect(null)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  const handlePick = (result) => {
    setQuery(result.location)
    setSelected(result)
    setResults([])
    setOpen(false)
    onSelect(result)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); setResults([]) }
  }

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  return (
    <div ref={containerRef} style={{ position: 'relative', ...style }}>
      <label style={{ font: "var(--fw-semibold) var(--fs-sm)/1 'Inter', sans-serif", color: 'var(--text-body)', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search for a place…"
          autoComplete="off"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '9px 36px 9px 12px',
            border: '1.5px solid var(--border-default)',
            borderRadius: 'var(--r-md)',
            font: "var(--fw-regular) var(--fs-body)/1 'Inter', sans-serif",
            color: 'var(--text-strong)',
            background: 'var(--surface-input, var(--surface-card))',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--brand)'
            if (results.length > 0) setOpen(true)
          }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border-default)' }}
        />
        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
          {loading
            ? <div style={{ width: 16, height: 16, border: '2px solid var(--border-default)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            : selected
              ? <Icon name="check" size={16} style={{ color: 'var(--green-600)' }} />
              : <Icon name="search" size={16} />
          }
        </div>
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-md)', overflow: 'hidden',
        }}>
          {results.map((r) => (
            <button
              key={r.placeId}
              type="button"
              onClick={() => handlePick(r)}
              style={{
                width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', borderBottom: '1px solid var(--border-subtle)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-subtle, var(--brand-soft))'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <Icon name="pin" size={15} style={{ color: 'var(--brand)', marginTop: 2, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ font: "var(--fw-medium) var(--fs-body)/1.2 'Inter', sans-serif", color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.name}
                </div>
                <div style={{ font: "var(--fw-regular) var(--fs-sm)/1.3 'Inter', sans-serif", color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.subtitle}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default LocationSearch
