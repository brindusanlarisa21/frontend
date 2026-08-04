import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { House, Wallet, FileText, Sparkles } from 'lucide-react'
import { logout } from '../features/auth/authSlice'
import { fetchTrips, createTrip, clearTripsError } from '../features/trips/tripsSlice'
import { fetchActivities } from '../features/activities/activitiesSlice'
import { fetchExpenses, fetchBalances } from '../features/expenses/expensesSlice'
import { fetchProposals } from '../features/proposals/proposalsSlice'
import { fetchChecklist, fetchDocuments, previewInvite, joinByInvite } from '../features/group/groupSlice'
import '../styles/ds/index.css'
import '../styles/trip-detail.css'

function formatDateRange(start, end) {
  if (!start) return ''
  const s = new Date(start).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
  if (!end) return s
  return `${s} – ${new Date(end).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}`
}

function tripPhase(start, end) {
  const now = new Date()
  if (now < new Date(start)) return 'upcoming'
  if (now > new Date(end)) return 'completed'
  return 'active'
}

function daysUntil(start) {
  return Math.ceil((new Date(start) - new Date()) / 86400000)
}

const AVATAR_COLORS = ['#1f6feb','#0f9b8e','#ff7a45','#7c3aed','#e2564a','#0b6f66']
function avatarColor(name) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
}

function MiniAvatar({ name, size = 28, border = true }) {
  const init = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatarColor(name),
      border: border ? '2.5px solid rgba(255,255,255,.22)' : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 800, color: '#fff', flexShrink: 0,
    }}>{init}</div>
  )
}

function AppRail({ user, onLogout, onAssistant }) {
  const navigate = useNavigate()
  return (
    <nav className="app-rail">
      <div className="rail-logo">
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 2C10.5 2 6 6.4 6 11.9 6 19.5 16 30 16 30V2Z" fill="#1f6feb" />
            <path d="M16 2c5.5 0 10 4.4 10 9.9C26 19.5 16 30 16 30V2Z" fill="#4f97ff" />
            <circle cx="16" cy="11.6" r="3.1" fill="#fff" />
          </svg>
          <span className="rail-wordmark">TripSplit</span>
        </button>
      </div>

      <button className="rail-item active" onClick={() => navigate('/')}>
        <House size={21} strokeWidth={1.9} />
        <span className="rail-item-label">Acasă</span>
      </button>

      <button className="rail-item" onClick={() => navigate('/')}>
        <Wallet size={21} strokeWidth={1.9} />
        <span className="rail-item-label">Bani</span>
      </button>

      <button className="rail-item" onClick={() => navigate('/')}>
        <FileText size={21} strokeWidth={1.9} />
        <span className="rail-item-label">Acte</span>
      </button>

      <button className="rail-item" onClick={onAssistant}>
        <Sparkles size={21} strokeWidth={1.9} />
        <span className="rail-item-label">Asistent</span>
      </button>

      <div className="rail-spacer" />

      <button className="rail-item" onClick={() => navigate('/profile')}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: avatarColor(user?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="rail-item-label" style={{ fontSize: 8 }}>RO-EUR</span>
      </button>
    </nav>
  )
}

function CreateTripModal({ open, onClose, onCreate, submitting, error }) {
  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budget, setBudget] = useState('')
  const [currency, setCurrency] = useState('EUR')

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onCreate({
      title, destination, startDate, endDate,
      budget: budget.trim() === '' ? null : parseFloat(budget),
      currency,
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Călătorie nouă</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="input-label">Nume călătorie</label>
              <input className="input-field" placeholder="e.g. Lisabona 2025" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="input-label">Destinație</label>
              <input className="input-field" placeholder="e.g. Portugalia" value={destination} onChange={e => setDestination(e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="input-label">Data start</label>
                <input className="input-field" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              </div>
              <div>
                <label className="input-label">Data final</label>
                <input className="input-field" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
              <div>
                <label className="input-label">Buget (opțional)</label>
                <input className="input-field" type="number" min="0" step="1" placeholder="e.g. 2400" value={budget} onChange={e => setBudget(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Valută</label>
                <select className="input-field" value={currency} onChange={e => setCurrency(e.target.value)} style={{ cursor: 'pointer' }}>
                  <option>EUR</option><option>RON</option><option>USD</option><option>GBP</option>
                </select>
              </div>
            </div>
            {error && <div className="auth-error">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Se creează…' : 'Creează călătoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/** Join a trip from an invite code or a pasted invite link. */
function JoinByCodeModal({ open, onClose }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (!open) return null

  // Accept a bare code, a dashed code, or the whole invite URL.
  const normalize = (raw) => {
    const trimmed = raw.trim()
    const fromUrl = trimmed.match(/\/invite\/([^/?#\s]+)/i)
    return (fromUrl ? fromUrl[1] : trimmed).replace(/[-\s]/g, '').toUpperCase()
  }

  const close = () => {
    setCode(''); setPreview(null); setError(null)
    onClose()
  }

  const handleCheck = async (e) => {
    e.preventDefault()
    const token = normalize(code)
    if (!token) return
    setBusy(true); setError(null)
    const result = await dispatch(previewInvite(token))
    setBusy(false)
    if (previewInvite.fulfilled.match(result)) setPreview({ ...result.payload, token })
    else setError(result.payload || 'Codul nu este valid.')
  }

  const handleJoin = async () => {
    setBusy(true); setError(null)
    const result = await dispatch(joinByInvite(preview.token))
    setBusy(false)
    if (joinByInvite.fulfilled.match(result)) {
      await dispatch(fetchTrips())
      close()
      navigate(`/trips/${result.payload.tripId}`)
    } else {
      setError(result.payload || 'Nu te-am putut adăuga în călătorie.')
    }
  }

  const fmt = (d) => new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
      <div className="modal-box" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <span className="modal-title">Intră cu un cod</span>
          <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        {preview ? (
          <>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ font: '400 14px/1.6 Archivo, sans-serif', color: 'var(--text-body)' }}>
                <b>{preview.invitedByName}</b> te invită în <b>{preview.tripTitle}</b> — {preview.destination},{' '}
                {fmt(preview.startDate)}–{fmt(preview.endDate)}. Sunteți deja {preview.memberCount}{' '}
                {preview.memberCount === 1 ? 'persoană' : 'persoane'}.
              </div>
              {error && <div className="auth-error"><span>⚠</span> {error}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => { setPreview(null); setError(null) }}>Alt cod</button>
              <button type="button" className="btn-primary" onClick={handleJoin} disabled={busy}>
                {busy ? 'Se procesează…' : 'Intră în călătorie'}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleCheck}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="input-label">Cod sau link de invitație</label>
                <input
                  className="input-field" autoFocus placeholder="ex. ABCD-2345"
                  value={code} onChange={e => setCode(e.target.value)} required
                  style={{ letterSpacing: '.06em' }}
                />
              </div>
              <div style={{ font: '400 12px/1.5 Archivo, sans-serif', color: 'var(--text-muted)' }}>
                Codul îl găsești în tabul Prieteni al călătoriei, la cine te-a invitat.
              </div>
              {error && <div className="auth-error"><span>⚠</span> {error}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={close}>Anulează</button>
              <button type="submit" className="btn-primary" disabled={busy || !code.trim()}>
                {busy ? 'Se verifică…' : 'Verifică codul'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function ActiveTripCard({ trip, onClick }) {
  const dispatch = useDispatch()
  const activities = useSelector((s) => s.activities.items)
  const expenses = useSelector((s) => s.expenses.items)
  const balances = useSelector((s) => s.expenses.balances)

  const totalDays = trip.startDate && trip.endDate
    ? Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000) + 1
    : 0
  const currentDay = Math.max(1, Math.ceil((new Date() - new Date(trip.startDate)) / 86400000))

  // The card previews live numbers, so it pulls the same data the trip workspace uses.
  useEffect(() => {
    dispatch(fetchActivities(trip.id))
    dispatch(fetchExpenses(trip.id))
    dispatch(fetchBalances(trip.id))
  }, [dispatch, trip.id])

  const currency = trip.currency || 'EUR'
  const spent = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const hasBudget = trip.budget != null && trip.budget > 0
  const budgetPct = hasBudget ? Math.round((spent / trip.budget) * 100) : null
  const overBudget = hasBudget && spent > trip.budget

  const todayKey = new Date().toLocaleDateString('en-CA')
  const todayCount = activities.filter(
    (a) => a.startTime && new Date(a.startTime).toLocaleDateString('en-CA') === todayKey,
  ).length

  const nextToday = activities
    .filter((a) => a.startTime && new Date(a.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0]

  const owed = balances?.youAreOwed ?? null
  const owe = balances?.youOwe ?? null

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 16px 48px rgba(11,26,48,.18)',
        border: '1px solid rgba(255,255,255,.1)',
        transition: 'transform 140ms, box-shadow 140ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 24px 60px rgba(11,26,48,.24)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 16px 48px rgba(11,26,48,.18)' }}
    >
      {/* Dark gradient header */}
      <div style={{
        background: 'linear-gradient(160deg, #12294a 0%, #0b1a30 100%)',
        padding: '20px 22px 18px',
        position: 'relative',
        minHeight: 160,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.12)', borderRadius: 999, padding: '5px 11px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
            <span style={{ font: '800 9.5px/1 Archivo, sans-serif', letterSpacing: '.1em', color: '#fff', textTransform: 'uppercase' }}>
              ÎN DESFĂȘURARE · ZIUA {currentDay} DIN {totalDays}
            </span>
          </div>
        </div>
        <div style={{ font: '800 10.5px/1 Archivo, sans-serif', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>
          {trip.destination?.toUpperCase()}
        </div>
        <div style={{ font: '800 28px/1.1 Archivo, sans-serif', letterSpacing: '-0.02em', color: '#fff', marginBottom: 16 }}>
          {trip.title}
        </div>
        {/* Avatars */}
        {trip.members?.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {trip.members.slice(0, 4).map((m, i) => (
              <div key={m.userId || i} style={{ marginLeft: i > 0 ? -8 : 0 }}>
                <MiniAvatar name={m.name} size={28} />
              </div>
            ))}
            {trip.members.length > 4 && (
              <div style={{ marginLeft: 6, font: '800 11px/1 Archivo, sans-serif', color: 'rgba(255,255,255,.6)' }}>
                +{trip.members.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: '#fff', borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '14px 18px', borderRight: '1px solid var(--border)' }}>
          <div className="kicker" style={{ marginBottom: 5 }}>{hasBudget ? 'Din buget' : 'Cheltuit'}</div>
          <div style={{ font: '800 22px/1 Archivo, sans-serif', color: overBudget ? 'var(--red-500)' : 'var(--ink)', marginBottom: 5, fontVariantNumeric: 'tabular-nums' }}>
            {hasBudget ? `${budgetPct}%` : `${Math.round(spent)} ${currency}`}
          </div>
          {hasBudget && (
            <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(budgetPct, 100)}%`, height: '100%', background: overBudget ? 'var(--red-500)' : budgetPct >= 80 ? 'var(--orange-500)' : 'var(--blue-500)', borderRadius: 99 }} />
            </div>
          )}
        </div>
        <div style={{ padding: '14px 18px', borderRight: '1px solid var(--border)' }}>
          <div className="kicker" style={{ marginBottom: 5 }}>Azi aveți</div>
          <div style={{ font: '800 22px/1 Archivo, sans-serif', color: 'var(--ink)' }}>
            {todayCount} {todayCount === 1 ? 'plan' : 'planuri'}
          </div>
          <div style={{ font: '400 11px/1 Archivo, sans-serif', color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nextToday
              ? `urmează ${nextToday.title}`
              : todayCount > 0 ? 'toate au trecut' : 'nimic planificat'}
          </div>
        </div>
        <div style={{ padding: '14px 18px' }}>
          <div className="kicker" style={{ marginBottom: 5 }}>{owe > 0 ? 'Ai de dat' : 'Ai de primit'}</div>
          <div style={{ font: '800 22px/1 Archivo, sans-serif', color: owe > 0 ? 'var(--red-500)' : 'var(--teal-500)', fontVariantNumeric: 'tabular-nums' }}>
            {balances ? `${Math.round(owe > 0 ? owe : (owed ?? 0))} ${currency}` : '—'}
          </div>
          <div style={{ font: '400 11px/1 Archivo, sans-serif', color: 'var(--text-muted)', marginTop: 4 }}>soldul tău</div>
        </div>
      </div>
    </div>
  )
}

/**
 * The "waiting on you" panel: real open items on the active trip — proposals you
 * have not voted on, money you owe, checklist tasks, documents about to expire.
 */
function WaitingOnYou({ trip, onOpen }) {
  const dispatch = useDispatch()
  const userEmail = useSelector((s) => s.auth.user?.email)
  const proposals = useSelector((s) => s.proposals.items)
  const balances = useSelector((s) => s.expenses.balances)
  const { checklist, documents } = useSelector((s) => s.group)

  useEffect(() => {
    if (!trip) return
    dispatch(fetchProposals(trip.id))
    dispatch(fetchChecklist(trip.id))
    dispatch(fetchDocuments(trip.id))
  }, [dispatch, trip])

  if (!trip) return null

  const currency = trip.currency || 'EUR'
  const currentUserId = trip.members?.find((m) => m.email === userEmail)?.userId

  const openVotes = proposals.filter(
    (p) => p.status === 'Pending' && !(p.votes ?? []).some((v) => v.userId === currentUserId),
  ).length
  const youOwe = balances?.youOwe ?? 0
  const openTasks = checklist.filter((c) => !c.done).length
  const expiringDocs = documents.filter((d) => d.isExpiringSoon).length

  const items = [
    openVotes > 0
      ? { icon: '🗳', bg: 'rgba(31,111,235,.1)', color: 'var(--blue-700)', tab: 'chat',
          text: `${openVotes} ${openVotes === 1 ? 'propunere așteaptă' : 'propuneri așteaptă'} votul tău`, sub: 'deschide chatul' }
      : { icon: '✓', bg: 'rgba(31,111,235,.1)', color: 'var(--blue-700)', tab: null,
          text: 'Nicio propunere în așteptare', sub: '' },

    youOwe > 0
      ? { icon: '€', bg: 'rgba(255,122,69,.1)', color: 'var(--orange-500)', tab: 'expenses',
          text: `Ai de dat ${Math.round(youOwe)} ${currency}`, sub: 'decontează cu grupul' }
      : { icon: '€', bg: 'rgba(15,155,142,.1)', color: 'var(--teal-700)', tab: 'expenses',
          text: 'Ești la zi cu banii', sub: '' },

    expiringDocs > 0
      ? { icon: '⚠', bg: 'rgba(255,122,69,.1)', color: 'var(--orange-500)', tab: 'members',
          text: `${expiringDocs} ${expiringDocs === 1 ? 'document expiră' : 'documente expiră'} curând`, sub: 'verifică actele' }
      : openTasks > 0
        ? { icon: '📋', bg: 'rgba(15,155,142,.1)', color: 'var(--teal-700)', tab: 'members',
            text: `${openTasks} ${openTasks === 1 ? 'lucru rămas' : 'lucruri rămase'} pe checklist`, sub: '' }
        : { icon: '📄', bg: 'rgba(15,155,142,.1)', color: 'var(--teal-700)', tab: null,
            text: 'Nimic de rezolvat', sub: '' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {items.map((item, i, arr) => (
        <div
          key={i}
          onClick={item.tab ? () => onOpen(item.tab) : undefined}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', cursor: item.tab ? 'pointer' : 'default' }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: item.color, flexShrink: 0 }}>
            {item.icon}
          </div>
          <div>
            <div style={{ font: '800 13px/1 Archivo, sans-serif', color: 'var(--ink)' }}>{item.text}</div>
            {item.sub && <div style={{ font: '400 11px/1 Archivo, sans-serif', color: 'var(--text-muted)', marginTop: 3 }}>{item.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

function UpcomingTripMini({ trip, onClick }) {
  const days = daysUntil(trip.startDate)
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--ink)',
        borderRadius: 'var(--r-xl)',
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'opacity 140ms',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '.9'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <div style={{ font: '800 9.5px/1 Archivo, sans-serif', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>
        URMEAZĂ · {trip.destination?.toUpperCase()}
      </div>
      <div style={{ font: '800 20px/1.1 Archivo, sans-serif', color: '#fff', marginBottom: 8 }}>{trip.title}</div>
      <div style={{ font: '400 13px/1.5 Archivo, sans-serif', color: 'rgba(255,255,255,.6)', marginBottom: 14 }}>
        {formatDateRange(trip.startDate, trip.endDate)} · în {days} zile
      </div>
      <button
        onClick={e => { e.stopPropagation(); onClick() }}
        style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 999, padding: '8px 16px', font: '800 12px/1 Archivo, sans-serif', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        Deschide
      </button>
    </div>
  )
}

function Home() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(s => s.auth.user)
  const { items: trips, status, error } = useSelector(s => s.trips)
  const [modalOpen, setModalOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiOpen, setAiOpen] = useState(false)
  const [aiTripId, setAiTripId] = useState('')

  useEffect(() => { dispatch(fetchTrips()) }, [dispatch])

  const handleCreate = async (data) => {
    setCreating(true)
    const result = await dispatch(createTrip(data))
    setCreating(false)
    if (createTrip.fulfilled.match(result)) {
      setModalOpen(false)
      dispatch(fetchTrips())
    }
  }

  const handleLogout = () => { dispatch(logout()); navigate('/login') }

  const active = trips.find(t => tripPhase(t.startDate, t.endDate) === 'active')
  const upcoming = trips
    .filter(t => tripPhase(t.startDate, t.endDate) === 'upcoming')
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  const nearest = upcoming[0]
  const nextAfter = upcoming[1]
  const daysLeft = nearest ? daysUntil(nearest.startDate) : null
  const firstName = user?.name?.split(' ')[0] || 'Traveler'

  return (
    <>
      <AppRail
        user={user} onLogout={handleLogout}
        onAssistant={() => {
          // Default to the trip you are most likely asking about.
          setAiTripId(String(active?.id ?? nearest?.id ?? trips[0]?.id ?? ''))
          setAiOpen(true)
        }}
      />
      <div className="app-content home-content">

        {/* ---- Countdown band: a page header on phones, not a card ---- */}
        {(active || nearest) && (
          <div className="mobile-only-block home-hero">
            <div className="kicker" style={{ color: 'rgba(255,255,255,.55)', marginBottom: 6 }}>
              {active ? 'În desfășurare' : 'Urmează'}
            </div>
            <div style={{ font: '800 22px/1.2 Archivo, sans-serif', letterSpacing: '-0.025em', color: '#fff', marginBottom: 5 }}>
              {active
                ? `Ești în ${active.destination}`
                : daysLeft === 0
                ? 'Plecați azi'
                : `Mai ${daysLeft === 1 ? 'e' : 'sunt'} ${daysLeft} ${daysLeft === 1 ? 'zi' : 'zile'} până plecați`}
            </div>
            <div style={{ font: '400 12.5px/1.4 Archivo, sans-serif', color: 'rgba(255,255,255,.6)', marginBottom: 14 }}>
              {(active ?? nearest).title} · {formatDateRange((active ?? nearest).startDate, (active ?? nearest).endDate)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="hero-btn"
                onClick={() => navigate(`/trips/${(active ?? nearest).id}`)}
              >
                Deschide călătoria
              </button>
            </div>
          </div>
        )}

        {/* ---- Header ---- */}
        <div className="home-header">
          <div className="hide-on-mobile">
            <div className="kicker" style={{ marginBottom: 8 }}>Bună, {firstName}</div>
            <h1 className="home-greeting" style={{ letterSpacing: '-0.03em', color: 'var(--ink)', margin: 0 }}>
              {active
                ? `Ești în ${active.destination} acum`
                : daysLeft != null && daysLeft > 0
                ? `Mai ${daysLeft === 1 ? 'e' : 'sunt'} ${daysLeft} ${daysLeft === 1 ? 'zi' : 'zile'} până plecați`
                : trips.length > 0
                ? `${trips.length} ${trips.length === 1 ? 'călătorie' : 'călătorii'} planificate`
                : 'Planifică prima ta aventură'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <button className="btn-secondary" onClick={() => setJoinOpen(true)} style={{ gap: 7, display: 'flex', alignItems: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Intră cu un cod
            </button>
            <button className="btn-primary" onClick={() => { dispatch(clearTripsError()); setModalOpen(true) }} style={{ gap: 7, display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Călătorie nouă
            </button>
          </div>
        </div>

        {/* ---- Main grid ---- */}
        {status === 'loading' && (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Se încarcă…</div>
        )}

        {status !== 'loading' && trips.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 18 }}>🌍</div>
            <div style={{ font: '800 20px/1 Archivo, sans-serif', color: 'var(--ink)', marginBottom: 8 }}>Nicio călătorie încă</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Creează prima ta călătorie sau intră cu un cod de invitație.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Călătorie nouă</button>
              <button className="btn-secondary" onClick={() => setJoinOpen(true)}>Intră cu un cod</button>
            </div>
          </div>
        )}

        {trips.length > 0 && (
          <div className="split" style={{ '--side-w': '400px', gap: 20 }}>
            {/* Left: active + other trips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {active && (
                <ActiveTripCard trip={active} onClick={() => navigate(`/trips/${active.id}`)} />
              )}
              {/* Upcoming & completed trips grid */}
              {trips.filter(t => t.id !== active?.id).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                  {trips.filter(t => t.id !== active?.id).map(trip => {
                    const phase = tripPhase(trip.startDate, trip.endDate)
                    const days = phase === 'upcoming' ? daysUntil(trip.startDate) : null
                    return (
                      <div
                        key={trip.id}
                        onClick={() => navigate(`/trips/${trip.id}`)}
                        style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', cursor: 'pointer', boxShadow: 'var(--shadow-card)' }}
                      >
                        <div style={{ height: 80, background: phase === 'completed' ? 'linear-gradient(135deg,#374151,#1f2937)' : 'linear-gradient(135deg,#1e3a6e,#0b1a30)', position: 'relative', padding: '12px 14px' }}>
                          <div style={{ font: '800 9.5px/1 Archivo, sans-serif', letterSpacing: '.1em', color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', marginBottom: 6 }}>
                            {phase === 'upcoming' && days != null ? `↑ ÎN ${days} ZILE` : phase === 'completed' ? '✓ ÎNCHEIATĂ' : ''}
                          </div>
                          <div style={{ font: '400 11px/1 Archivo, sans-serif', color: 'rgba(255,255,255,.5)' }}>{trip.destination}</div>
                        </div>
                        <div style={{ padding: '12px 14px' }}>
                          <div style={{ font: '800 15px/1.2 Archivo, sans-serif', color: 'var(--ink)', marginBottom: 3 }}>{trip.title}</div>
                          <div style={{ font: '400 12px/1 Archivo, sans-serif', color: 'var(--text-muted)' }}>{formatDateRange(trip.startDate, trip.endDate)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right panel — phones show only the trips, plus the countdown card above */}
            <div className="hide-on-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '18px 20px', boxShadow: 'var(--shadow-card)' }}>
                <div className="kicker" style={{ marginBottom: 14 }}>Te așteaptă</div>
                <WaitingOnYou trip={active} onOpen={(tab) => navigate(`/trips/${active.id}${tab ? `?tab=${tab}` : ''}`)} />
              </div>

              {/* Next trip mini card */}
              {nearest && nearest.id !== active?.id && (
                <UpcomingTripMini trip={nearest} onClick={() => navigate(`/trips/${nearest.id}`)} />
              )}

              {nextAfter && (
                <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
                  <div className="kicker" style={{ marginBottom: 8 }}>Și mai departe</div>
                  <div style={{ font: '800 15px/1.2 Archivo, sans-serif', color: 'var(--ink)', marginBottom: 4 }}>{nextAfter.title}</div>
                  <div style={{ font: '400 12px/1 Archivo, sans-serif', color: 'var(--text-muted)' }}>{formatDateRange(nextAfter.startDate, nextAfter.endDate)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <CreateTripModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} submitting={creating} error={error} />
      <JoinByCodeModal open={joinOpen} onClose={() => setJoinOpen(false)} />

      {aiOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAiOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <span className="modal-title">Asistent</span>
              <button onClick={() => setAiOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            {trips.length === 0 ? (
              <div className="modal-body">
                <div style={{ font: '400 14px/1.6 Archivo, sans-serif', color: 'var(--text-body)' }}>
                  Asistentul lucrează pe o călătorie anume — cunoaște destinația, datele și bugetul.
                  Creează întâi o călătorie.
                </div>
              </div>
            ) : (
              <>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="input-label">Pentru care călătorie</label>
                    <select
                      className="input-field" value={aiTripId} onChange={e => setAiTripId(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      {trips.map(t => (
                        <option key={t.id} value={t.id}>{t.title} · {t.destination}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Ce vrei să pun la cale</label>
                    <textarea
                      className="input-field" rows={3} autoFocus
                      placeholder={'ex. "Fă-mi ziua de miercuri: ceva cultură dimineața, plajă după-amiaza, buget mediu"'}
                      value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                      style={{ height: 'auto', padding: '10px 14px', resize: 'vertical', lineHeight: 1.5 }}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setAiOpen(false)}>Anulează</button>
                  <button
                    type="button" className="btn-primary" disabled={!aiPrompt.trim()}
                    onClick={() => {
                      const id = aiTripId || trips[0].id
                      navigate(`/trips/${id}?tab=ai&q=${encodeURIComponent(aiPrompt.trim())}`)
                    }}
                  >
                    Fă-mi un plan
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default Home
