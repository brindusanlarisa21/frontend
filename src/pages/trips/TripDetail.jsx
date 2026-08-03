import { Fragment, useEffect, useRef, useState } from 'react'
import * as signalR from '@microsoft/signalr'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../features/auth/authSlice'
import {
  Button, IconButton, Input, Badge, Card, Avatar,
  TripCover, SegmentedControl, Icon, Chip, ActivityCard, DatePicker, ActivityMap, LocationSearch,
  BalanceHero, BudgetRing, ExpenseRow, SettleUpRow,
} from '../../components/ds'
import { fetchTripById, updateTrip, addTripMember, removeTripMember, clearMemberActionError } from '../../features/trips/tripsSlice'
import { fetchActivities, createActivity, deleteActivity, clearActivityActionError } from '../../features/activities/activitiesSlice'
import { fetchExpenses, createExpense, updateExpense, deleteExpense, fetchBalances, settleDebt, createSettlement, clearExpenseActionError } from '../../features/expenses/expensesSlice'
import { fetchMessages, messageReceived, clearMessages } from '../../features/chat/chatSlice'
import { fetchProposals, createProposal, voteProposal, proposalReceived, proposalUpdated, clearProposals } from '../../features/proposals/proposalsSlice'
import {
  fetchInvite, createInvite,
  fetchChecklist, addChecklistItem, updateChecklistItem, deleteChecklistItem,
  fetchDocuments, addDocument, deleteDocument,
} from '../../features/group/groupSlice'
import { apiRequest } from '../../api/client'
import '../../styles/ds/index.css'
import '../../styles/trip-detail.css'

function formatDateRange(start, end) {
  if (!start) return ''
  const opts = { month: 'short', day: 'numeric', year: 'numeric' }
  const startStr = new Date(start).toLocaleDateString('en-US', opts)
  if (!end) return startStr
  return `${startStr} – ${new Date(end).toLocaleDateString('en-US', opts)}`
}

function tripPhase(start, end) {
  const now = new Date()
  if (now < new Date(start)) return 'Upcoming'
  if (now > new Date(end)) return 'Completed'
  return 'Active'
}

function Logo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 2C10.5 2 6 6.4 6 11.9 6 19.5 16 30 16 30V2Z" fill="var(--blue-700)" />
      <path d="M16 2c5.5 0 10 4.4 10 9.9C26 19.5 16 30 16 30V2Z" fill="var(--cyan-500)" />
      <circle cx="16" cy="11.6" r="3.1" fill="#fff" />
    </svg>
  )
}

function ProfileModal({ open, onClose }) {
  const { token } = useSelector((s) => s.auth)
  const [name, setName] = useState('')
  const [paymentLink, setPaymentLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open) return
    setSaved(false)
    fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'https://localhost:7213'}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setName(d.name ?? ''); setPaymentLink(d.paymentLink ?? '') })
  }, [open, token])

  const handleSave = async () => {
    setSaving(true)
    await fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'https://localhost:7213'}/api/users/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, paymentLink }),
    })
    setSaving(false)
    setSaved(true)
  }

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Profilul meu</h2>
          <IconButton icon="x" variant="ghost" size="sm" onClick={onClose} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Nume" value={name} onChange={(e) => setName(e.target.value)} />

          <div>
            <Input
              label="Link de plată (Revolut / PayPal / IBAN)"
              placeholder="https://revolut.me/username"
              value={paymentLink}
              onChange={(e) => setPaymentLink(e.target.value)}
            />
            <p style={{ margin: '4px 0 0', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
              Ceilalți membri îl vor vedea când îți datorează bani.
            </p>
          </div>

          <Button variant="primary" loading={saving} onClick={handleSave} style={{ width: '100%' }}>
            {saved ? 'Salvat!' : 'Salvează'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function AppRail({ user, activeTab, onTabChange }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const railTabs = [
    { value: 'itinerary', label: 'Plan', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { value: 'expenses', label: 'Bani', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { value: 'chat', label: 'Chat', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { value: 'members', label: 'Prieteni', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { value: 'ai', label: 'Asistent', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg> },
  ]

  return (
    <nav className="app-rail">
      <div className="rail-logo">
        <Link to="/"><Logo size={32} /></Link>
      </div>
      {railTabs.map(t => (
        <button key={t.value} className={`rail-item ${activeTab === t.value ? 'active' : ''}`} onClick={() => onTabChange(t.value)}>
          {t.icon}
          <span className="rail-item-label">{t.label}</span>
        </button>
      ))}
      <div className="rail-spacer" />
      <button className="rail-item" onClick={() => navigate('/profile')}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#3d86f5,#1f6feb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="rail-item-label">Profil</span>
      </button>
    </nav>
  )
}

/* ============ NOT-YET-AVAILABLE TABS ============ */
function ComingSoon({ icon, title, description }) {
  return (
    <Card style={{ textAlign: 'center', padding: 48 }}>
      <div
        style={{
          width: 56, height: 56, margin: '0 auto 16px', borderRadius: 'var(--r-pill)',
          background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--brand)',
        }}
      >
        <Icon name={icon} size={26} />
      </div>
      <h2>{title}</h2>
      <p style={{ color: 'var(--text-muted)' }}>{description}</p>
    </Card>
  )
}

const CATEGORY_OPTIONS = [
  { value: 'sight', label: 'Sight', icon: 'pin' },
  { value: 'food', label: 'Food', icon: 'utensils' },
  { value: 'stay', label: 'Stay', icon: 'bed' },
  { value: 'travel', label: 'Travel', icon: 'plane' },
  { value: 'fun', label: 'Fun', icon: 'ticket' },
  { value: 'transit', label: 'Transit', icon: 'car' },
]

function dayKey(iso) {
  return new Date(iso).toLocaleDateString('en-CA')
}

function formatDayHeading(key) {
  return new Date(`${key}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDayPill(key) {
  const d = new Date(`${key}T00:00:00`)
  return { weekday: d.toLocaleDateString('en-US', { weekday: 'short' }), day: d.getDate() }
}

function buildDayRange(start, end) {
  const days = []
  const cursor = new Date(`${dayKey(start)}T00:00:00`)
  const last = new Date(`${dayKey(end || start)}T00:00:00`)
  while (cursor <= last) {
    days.push(cursor.toLocaleDateString('en-CA'))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

const CAT_LABELS = {
  sight: 'Obiectiv', food: 'Mâncare', stay: 'Cazare',
  travel: 'Drum', fun: 'Distracție', transit: 'Transport',
}

function ActivityForm({ onClose, onSubmit, submitting, error, defaultDate }) {
  const [title, setTitle] = useState('')
  const [place, setPlace] = useState(null)
  const [category, setCategory] = useState('sight')
  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState('09:00')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !date || !time) return
    onSubmit({
      title: title.trim(),
      description: null,
      category,
      cost: null,
      startTime: new Date(`${date}T${time}`).toISOString(),
      endTime: null,
      location: place?.location ?? null,
      latitude: place?.latitude ?? null,
      longitude: place?.longitude ?? null,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="input-label">Titlu</label>
          <input className="input-field" placeholder="ex. Turnul Belém" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <LocationSearch label="Loc" onSelect={setPlace} />

        <div>
          <label className="input-label">Categorie</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(CAT_UI).map(([key, c]) => {
              const active = category === key
              return (
                <button
                  key={key} type="button" onClick={() => setCategory(key)}
                  style={{ padding: '7px 13px', borderRadius: 999, border: active ? `1.5px solid ${c.color}` : '1.5px solid var(--border)', background: active ? c.bg : 'var(--surface-solid)', color: active ? c.color : 'var(--text-muted)', font: `${active ? 800 : 400} 12px/1 Archivo, sans-serif`, cursor: 'pointer', transition: 'all 120ms', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span>{c.emoji}</span>{CAT_LABELS[key]}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="input-label">Data</label>
            <input className="input-field" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="input-label">Ora</label>
            <input className="input-field" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
        </div>

        {error && <div className="auth-error"><span>⚠</span> {error}</div>}
      </div>

      <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" className="btn-secondary" onClick={onClose}>Renunț</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Se salvează…' : 'Salvează'}
        </button>
      </div>
    </form>
  )
}

function AddActivityModal({ open, onClose, onSubmit, submitting, error, defaultDate }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Adaugă o activitate</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <ActivityForm key={defaultDate} onClose={onClose} onSubmit={onSubmit} submitting={submitting} error={error} defaultDate={defaultDate} />
      </div>
    </div>
  )
}

const CAT_UI = {
  sight:   { emoji: '🏛', bg: 'rgba(31,111,235,.12)', color: '#1f6feb', stripe: '#1f6feb' },
  food:    { emoji: '🍽', bg: 'rgba(255,122,69,.12)', color: '#ff7a45', stripe: '#ff7a45' },
  stay:    { emoji: '🛏', bg: 'rgba(15,155,142,.12)', color: '#0f9b8e', stripe: '#0f9b8e' },
  travel:  { emoji: '✈', bg: 'rgba(31,111,235,.12)', color: '#1f6feb', stripe: '#1f6feb' },
  fun:     { emoji: '🎟', bg: 'rgba(124,58,237,.12)', color: '#7c3aed', stripe: '#7c3aed' },
  transit: { emoji: '🚌', bg: 'rgba(156,163,175,.12)', color: '#6b7280', stripe: '#9ca3af' },
}

function Itinerary({ tripId, tripStartDate, tripEndDate, members, currentUserEmail, isAdmin, budget, currency = 'EUR' }) {
  const dispatch = useDispatch()
  const { items, status, error, actionStatus, actionError } = useSelector((state) => state.activities)
  const expenses = useSelector((state) => state.expenses.items)
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const [modalOpen, setModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const currentUserId = members.find((m) => m.email === currentUserEmail)?.userId

  const dayRange = buildDayRange(tripStartDate, tripEndDate)
  const [selectedDay, setSelectedDay] = useState(() => {
    const todayKey = dayKey(new Date().toISOString())
    return dayRange.includes(todayKey) ? todayKey : (dayRange[0] || todayKey)
  })

  useEffect(() => { dispatch(fetchActivities(tripId)) }, [dispatch, tripId])

  // Horizontal day strip: arrows page through days when they overflow.
  const dayStripRef = useRef(null)
  const [dayScroll, setDayScroll] = useState({ atStart: true, atEnd: true })

  const syncDayScroll = () => {
    const el = dayStripRef.current
    if (!el) return
    setDayScroll({
      atStart: el.scrollLeft <= 1,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
    })
  }

  useEffect(() => {
    syncDayScroll()
    const el = dayStripRef.current
    if (!el) return
    el.addEventListener('scroll', syncDayScroll, { passive: true })
    window.addEventListener('resize', syncDayScroll)
    return () => {
      el.removeEventListener('scroll', syncDayScroll)
      window.removeEventListener('resize', syncDayScroll)
    }
  }, [dayRange.length])

  const scrollDays = (dir) => {
    const el = dayStripRef.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  const handleAdd = async (activity) => {
    dispatch(clearActivityActionError())
    const result = await dispatch(createActivity({ tripId, activity }))
    if (createActivity.fulfilled.match(result)) setModalOpen(false)
  }

  const handleDelete = async (activityId) => {
    setDeletingId(activityId)
    await dispatch(deleteActivity({ tripId, activityId }))
    setDeletingId(null)
  }

  const dayItems = items
    .filter((a) => dayKey(a.startTime) === selectedDay)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

  const totalCost = dayItems.reduce((s, a) => s + (a.cost || 0), 0)
  const todayKey = dayKey(new Date().toISOString())

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 560px', minHeight: '80vh' }}>
      {/* ---- Main: day picker + timeline ---- */}
      <div style={{ borderRight: '2px solid var(--border-strong)' }}>
        {/* Day pills */}
        <div className="day-picker-wrap">
          <button className="day-nav" onClick={() => scrollDays(-1)} disabled={dayScroll.atStart} aria-label="Zilele anterioare">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="day-picker" ref={dayStripRef}>
          {dayRange.map((key) => {
            const { weekday, day } = formatDayPill(key)
            const isToday = key === todayKey
            return (
              <button
                key={key}
                className={`day-pill${selectedDay === key ? ' active' : ''}`}
                onClick={() => setSelectedDay(key)}
              >
                <span className="day-pill-wd">{weekday}</span>
                <span className="day-pill-d">{day}</span>
                {isToday && <span style={{ font: '800 8px/1 Archivo, sans-serif', letterSpacing: '.06em', color: selectedDay === key ? 'rgba(255,255,255,.7)' : 'var(--blue-500)', marginTop: 1 }}>AZI</span>}
              </button>
            )
          })}
          </div>
          <button className="day-nav" onClick={() => scrollDays(1)} disabled={dayScroll.atEnd} aria-label="Zilele următoare">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Day heading */}
        <div className="day-section">
          <div className="day-heading">
            <span className="day-heading-title">
              {new Date(`${selectedDay}T00:00:00`).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {dayItems.length > 0 && (
                <span className="day-heading-meta">{dayItems.length} PLANURI{totalCost > 0 ? ` · ${totalCost} € EST.` : ''}</span>
              )}
              <button className="btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => setModalOpen(true)}>
                + Adaugă
              </button>
            </div>
          </div>

          <div style={{ height: 460, overflowY: 'auto', paddingRight: 6 }}>
          {status === 'loading' &&<div style={{ padding: '20px 0', color: 'var(--text-muted)', fontSize: 14 }}>Se încarcă…</div>}
          {status === 'failed' && <div className="auth-error" style={{ marginTop: 16 }}>{error}</div>}

          {status === 'succeeded' && dayItems.length === 0 && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 14 }}>Nicio activitate planificată pentru această zi.</div>
              <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setModalOpen(true)}>+ Adaugă activitate</button>
            </div>
          )}

          {/* Activity timeline */}
          {dayItems.map((a) => {
            const cat = CAT_UI[a.category?.toLowerCase()] || CAT_UI.sight
            const canDelete = isAdmin || a.createdByUserId === currentUserId
            return (
              <div key={a.id} className="activity-row">
                {/* Time column */}
                <div className="activity-time">
                  <div className="activity-time-hour">
                    {new Date(a.startTime).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {a.endTime && (
                    <div className="activity-time-dur">
                      {Math.round((new Date(a.endTime) - new Date(a.startTime)) / 60000)} MIN
                    </div>
                  )}
                </div>

                {/* Activity card */}
                <div className="activity-card" style={{ flex: 1 }}>
                  <div className="activity-card-stripe" style={{ background: cat.stripe }} />
                  <div className={`activity-icon-wrap`} style={{ background: cat.bg, color: cat.color }}>
                    {cat.emoji}
                  </div>
                  <div className="activity-info">
                    <div className="activity-title">{a.title}</div>
                    <div className="activity-meta">
                      {a.location && <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 0 0-8-8z"/></svg> {a.location}</>}
                      {a.cost != null && <><span>·</span><span style={{ color: cat.color, fontWeight: 800 }}>{a.cost} € / pers</span></>}
                    </div>
                  </div>
                  {canDelete && (
                    <button
                      className="icon-btn-sm"
                      disabled={deletingId === a.id}
                      onClick={() => handleDelete(a.id)}
                      title="Șterge"
                      style={{ flexShrink: 0 }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        </div>
      </div>

      {/* ---- Right panel: map + budget ---- */}
      <div style={{ padding: '24px 24px', position: 'sticky', top: 0, maxHeight: '100vh', overflowY: 'auto' }}>
        {/* Map — renders its own framed box, so it must not sit in a centering flex wrapper */}
        <div style={{ marginBottom: 18 }}>
          <ActivityMap activities={items} height={300} />
        </div>

        {/* Budget ring — real spend vs the trip's budget */}
        <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 20px', marginBottom: 16 }}>
          <div className="kicker" style={{ marginBottom: 12 }}>Cheltuit până acum</div>
          <BudgetRing spent={totalSpent} budget={budget} currency={currency} size={76} />
        </div>

        {/* Day summary */}
        {dayItems.length > 0 && (
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>Ziua de azi</div>
            {dayItems.slice(0, 4).map((a) => {
              const cat = CAT_UI[a.category?.toLowerCase()] || CAT_UI.sight
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ font: '800 11px/1 Archivo, sans-serif', color: 'var(--text-muted)', width: 36, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {new Date(a.startTime).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: cat.stripe, flexShrink: 0 }} />
                  <div style={{ font: '800 12px/1.3 Archivo, sans-serif', color: 'var(--ink)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AddActivityModal
        open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAdd}
        submitting={actionStatus === 'loading'} error={actionError}
        defaultDate={selectedDay}
      />
    </div>
  )
}

const EXPENSE_CATEGORY_OPTIONS = [
  { value: 'food', label: 'Food', icon: 'utensils' },
  { value: 'stay', label: 'Stay', icon: 'bed' },
  { value: 'travel', label: 'Travel', icon: 'plane' },
  { value: 'transit', label: 'Transit', icon: 'car' },
  { value: 'fun', label: 'Fun', icon: 'ticket' },
  { value: 'shop', label: 'Shop', icon: 'receipt' },
]

const selectStyle = {
  width: '100%', height: 48, padding: '0 14px',
  background: 'var(--surface-card)', border: '1.5px solid var(--border-default)',
  borderRadius: 'var(--r-md)', font: "var(--fw-medium) var(--fs-body)/1 'Inter', sans-serif",
  color: 'var(--text-strong)', outline: 'none', cursor: 'pointer',
}

const EXPENSE_CAT_UI = {
  food:      { label: 'Mâncare',   emoji: '🍽', bg: 'rgba(255,122,69,.12)', color: 'var(--orange-500)' },
  transport: { label: 'Transport', emoji: '🚗', bg: 'rgba(31,111,235,.10)', color: 'var(--blue-500)' },
  stay:      { label: 'Cazare',    emoji: '🛏', bg: 'rgba(15,155,142,.10)', color: 'var(--teal-500)' },
  sight:     { label: 'Atracții',  emoji: '🏛', bg: 'rgba(31,111,235,.10)', color: 'var(--blue-500)' },
  fun:       { label: 'Distracție',emoji: '🎟', bg: 'rgba(124,58,237,.10)', color: '#7c3aed' },
  other:     { label: 'Altele',    emoji: '📦', bg: 'rgba(156,163,175,.12)', color: '#6b7280' },
}

function MemberAvatar({ name, size = 32 }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'
  const colors = ['#1f6feb','#0f9b8e','#ff7a45','#7c3aed','#e2564a','#0b6f66']
  const idx = name ? name.charCodeAt(0) % colors.length : 0
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: colors[idx], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, color: '#fff', flexShrink: 0, fontFamily: 'Archivo, sans-serif' }}>
      {initials}
    </div>
  )
}

function ExpenseForm({ onClose, onSubmit, submitting, error, members, initial }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '')
  const [currency, setCurrency] = useState('EUR')
  const [category, setCategory] = useState(initial?.category ?? 'food')
  const [paidByUserId, setPaidByUserId] = useState(
    initial?.paidByUserId != null ? String(initial.paidByUserId) : String(members[0]?.userId ?? '')
  )
  const [splitAmong, setSplitAmong] = useState(
    () => new Set(initial?.splitAmong ? initial.splitAmong.map(String) : members.map(m => String(m.userId)))
  )

  const toggleMember = (uid) => {
    setSplitAmong(prev => {
      const next = new Set(prev)
      if (next.has(uid)) { if (next.size > 1) next.delete(uid) }
      else next.add(uid)
      return next
    })
  }

  const isEdit = Boolean(initial?.id)
  const splitCount = splitAmong.size
  const perPerson = amount && splitCount > 0 ? (parseFloat(amount) / splitCount).toFixed(2) : null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !amount || !paidByUserId) return
    onSubmit({ title: title.trim(), amount: parseFloat(amount), category, paidByUserId: parseInt(paidByUserId, 10), splitAmong: [...splitAmong].map(Number) })
  }

  const catKeys = Object.keys(EXPENSE_CAT_UI)

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Titlu + Sumă */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12 }}>
          <div>
            <label className="input-label">Titlu</label>
            <input className="input-field" placeholder="e.g. Cină în Bairro Alto" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="input-label">Sumă</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input className="input-field" type="number" min="0.01" step="0.01" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} required style={{ flex: 1, minWidth: 0 }} />
              <select className="input-field" value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: 72, cursor: 'pointer', paddingLeft: 8, paddingRight: 4 }}>
                <option>EUR</option><option>RON</option><option>USD</option><option>GBP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cine a plătit + Categorie */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="input-label">Cine a plătit</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <MemberAvatar name={members.find(m => String(m.userId) === paidByUserId)?.name || ''} size={24} />
              </div>
              <select className="input-field" value={paidByUserId} onChange={e => setPaidByUserId(e.target.value)} style={{ paddingLeft: 40, cursor: 'pointer' }}>
                {members.map(m => <option key={m.userId} value={m.userId}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Categorie</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {catKeys.map(k => {
                const c = EXPENSE_CAT_UI[k]
                const active = category === k
                return (
                  <button key={k} type="button" onClick={() => setCategory(k)} style={{ padding: '6px 12px', borderRadius: 999, border: active ? `1.5px solid ${c.color}` : '1.5px solid var(--border)', background: active ? c.bg : 'var(--surface-solid)', color: active ? c.color : 'var(--text-muted)', font: `${active ? 800 : 400} 12px/1 Archivo, sans-serif`, cursor: 'pointer', transition: 'all 120ms' }}>
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Se împarte între */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label className="input-label" style={{ marginBottom: 0 }}>Se împarte între</label>
            <div style={{ display: 'flex', gap: 0, background: 'rgba(18,41,74,.07)', borderRadius: 999, padding: 3 }}>
              {['Egal', 'Procente', 'Sume fixe'].map((s, i) => (
                <span key={s} style={{ padding: '5px 12px', borderRadius: 999, font: `${i === 0 ? 800 : 400} 11px/1 Archivo, sans-serif`, background: i === 0 ? '#fff' : 'none', color: i === 0 ? 'var(--ink)' : 'var(--text-muted)', boxShadow: i === 0 ? '0 1px 3px rgba(11,26,48,.1)' : 'none' }}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {members.map(m => {
              const uid = String(m.userId)
              const active = splitAmong.has(uid)
              return (
                <button key={uid} type="button" onClick={() => toggleMember(uid)} style={{ padding: '8px 14px', borderRadius: 999, border: 'none', background: active ? 'var(--blue-500)' : 'rgba(18,41,74,.08)', color: active ? '#fff' : 'var(--text-muted)', font: '800 13px/1 Archivo, sans-serif', cursor: 'pointer', transition: 'all 120ms' }}>
                  {m.name.split(' ')[0]}{active && perPerson ? ` · ${perPerson} ${currency.slice(0,1)}` : ''}
                </button>
              )
            })}
          </div>
        </div>

        {error && <div className="auth-error"><span>⚠</span> {error}</div>}
      </div>

      <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" style={{ background: 'none', border: 'none', color: 'var(--blue-700)', font: '800 13px/1 Archivo, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>↺</span> Completează dintr-un bon
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Renunț</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Se salvează…' : isEdit ? 'Salvează' : 'Salvează'}
          </button>
        </div>
      </div>
    </form>
  )
}

function ExpenseModal({ open, onClose, onSubmit, submitting, error, members, initial }) {
  if (!open) return null
  const isEdit = Boolean(initial?.id)
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Editează cheltuiala' : 'Adaugă o cheltuială'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <ExpenseForm key={open ? (initial?.id ?? 'new') : 'closed'} onClose={onClose} onSubmit={onSubmit} submitting={submitting} error={error} members={members} initial={initial} />
      </div>
    </div>
  )
}

function SettleModal({ open, debt, submitting, onClose, onSettle }) {
  if (!open || !debt) return null
  const hasLink = !!debt.toPaymentLink
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <span className="modal-title">Plătește-i lui {debt.toName}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <div style={{ font: '400 13px/1 Archivo, sans-serif', color: 'var(--text-muted)', marginBottom: 6 }}>
              <b style={{ color: 'var(--ink)' }}>{debt.fromName}</b> → <b style={{ color: 'var(--ink)' }}>{debt.toName}</b>
            </div>
            <div style={{ font: '800 28px/1 Archivo, sans-serif', letterSpacing: '-0.02em', color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
              {Number(debt.amount).toFixed(2)} {debt.currency}
            </div>
          </div>
          {hasLink ? (
            <>
              <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-sm)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue-500)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                <span style={{ font: '400 13px/1 Archivo, sans-serif', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{debt.toPaymentLink}</span>
              </div>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => window.open(debt.toPaymentLink, '_blank', 'noopener,noreferrer')}>
                Deschide {debt.toPaymentLink.includes('revolut') ? 'Revolut' : 'link plată'} · {Number(debt.amount).toFixed(2)} {debt.currency}
              </button>
            </>
          ) : (
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-sm)', padding: '10px 14px', font: '400 13px/1.5 Archivo, sans-serif', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {debt.toName} nu are link de plată setat. Plătește prin bancă, Revolut sau cash, apoi marchează.
            </div>
          )}
          <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting} onClick={onSettle}>
            {submitting ? 'Se marchează…' : 'Am plătit cash — marchează'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Budget card that doubles as the place to set a budget when the trip has none. */
function BudgetAlertCard({ tripId, budget, currency = 'EUR', spent, canEdit }) {
  const dispatch = useDispatch()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(budget != null ? String(budget) : '')
  const [saving, setSaving] = useState(false)

  const hasBudget = budget != null && budget > 0
  const pct = hasBudget ? Math.round((spent / budget) * 100) : null
  const over = hasBudget && spent > budget
  const warn = hasBudget && pct >= 80

  const tone = over ? { bg: 'rgba(226,86,74,.06)', border: 'rgba(226,86,74,.22)', fg: 'var(--red-500)', label: 'var(--red-700)' }
    : warn ? { bg: 'rgba(255,122,69,.06)', border: 'rgba(255,122,69,.2)', fg: 'var(--orange-500)', label: 'var(--orange-700)' }
    : { bg: 'var(--surface-solid)', border: 'var(--border)', fg: 'var(--ink)', label: 'var(--text-muted)' }

  const save = async (e) => {
    e.preventDefault()
    const value = draft.trim() === '' ? null : parseFloat(draft)
    if (value !== null && (Number.isNaN(value) || value < 0)) return
    setSaving(true)
    await dispatch(updateTrip({ tripId, changes: { budget: value } }))
    setSaving(false)
    setEditing(false)
  }

  if (editing || !hasBudget) {
    return (
      <div style={{ background: 'var(--surface-solid)', borderRadius: 'var(--r-lg)', border: '1px dashed var(--border-strong)', padding: '14px 16px' }}>
        <div className="kicker" style={{ marginBottom: 6 }}>Buget</div>
        {canEdit ? (
          <form onSubmit={save} style={{ display: 'flex', gap: 6 }}>
            <input
              className="input-field" type="number" min="0" step="1" autoFocus={editing}
              placeholder="ex. 2400" value={draft} onChange={(e) => setDraft(e.target.value)}
              style={{ flex: 1, minWidth: 0, height: 36, fontSize: 14 }}
            />
            <button type="submit" className="btn-primary" style={{ fontSize: 12, padding: '7px 12px' }} disabled={saving}>
              {saving ? '…' : 'Setează'}
            </button>
          </form>
        ) : (
          <div style={{ font: '400 12px/1.4 Archivo, sans-serif', color: 'var(--text-muted)' }}>
            Niciun buget setat. Un admin poate seta unul.
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ background: tone.bg, borderRadius: 'var(--r-lg)', border: `1px solid ${tone.border}`, padding: '14px 16px', position: 'relative' }}>
      <div className="kicker" style={{ marginBottom: 6, color: tone.label }}>
        {over ? 'Buget depășit' : warn ? 'Alertă buget' : 'Buget'}
      </div>
      <div style={{ font: '800 22px/1 Archivo, sans-serif', letterSpacing: '-0.03em', color: tone.fg, fontVariantNumeric: 'tabular-nums' }}>
        {pct}%
      </div>
      <div style={{ font: '400 11px/1 Archivo, sans-serif', color: tone.label, marginTop: 4 }}>
        {over
          ? `depășit cu ${Math.round(spent - budget)} ${currency}`
          : `au mai rămas ${Math.round(budget - spent)} din ${Math.round(budget)} ${currency}`}
      </div>
      {canEdit && (
        <button
          onClick={() => { setDraft(String(budget)); setEditing(true) }}
          style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', cursor: 'pointer', font: '800 11px/1 Archivo, sans-serif', color: tone.label }}
        >
          Modifică
        </button>
      )}
    </div>
  )
}

function Expenses({ tripId, members, currentUserId, isAdmin, budget, currency = 'EUR' }) {
  const dispatch = useDispatch()
  const { items, status, error, balances, actionStatus, actionError } = useSelector(s => s.expenses)
  const [modal, setModal] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [settleModal, setSettleModal] = useState(null)
  const [filter, setFilter] = useState('all') // all | mine | unsplit
  const [activeSettle, setActiveSettle] = useState(null) // debt shown inline in panel

  useEffect(() => {
    dispatch(fetchExpenses(tripId))
    dispatch(fetchBalances(tripId))
  }, [dispatch, tripId])

  const openAdd = () => { dispatch(clearExpenseActionError()); setModal({ mode: 'add' }) }
  const openEdit = (exp) => { dispatch(clearExpenseActionError()); setModal({ mode: 'edit', expense: exp }) }

  const handleAdd = async (expense) => {
    const result = await dispatch(createExpense({ tripId, expense }))
    if (createExpense.fulfilled.match(result)) { setModal(null); dispatch(fetchBalances(tripId)) }
  }

  const handleEdit = async (updates) => {
    const result = await dispatch(updateExpense({ tripId, expenseId: modal.expense.id, updates }))
    if (updateExpense.fulfilled.match(result)) { setModal(null); dispatch(fetchBalances(tripId)) }
  }

  const handleDelete = async (expenseId) => {
    setDeletingId(expenseId)
    const result = await dispatch(deleteExpense({ tripId, expenseId }))
    setDeletingId(null)
    if (deleteExpense.fulfilled.match(result)) dispatch(fetchBalances(tripId))
  }

  const openSettleModal = (d) => {
    dispatch(clearExpenseActionError())
    setSettleModal({ fromUserId: d.fromUserId, toUserId: d.toUserId, fromName: d.fromName, toName: d.toName, amount: d.amount, currency: d.currency ?? 'EUR', toPaymentLink: d.toPaymentLink ?? null })
  }

  const handleSettle = async () => {
    if (!settleModal) return
    const result = await dispatch(createSettlement({ tripId, fromUserId: settleModal.fromUserId, toUserId: settleModal.toUserId, amount: settleModal.amount, method: 'Cash' }))
    if (createSettlement.fulfilled.match(result)) {
      setSettleModal(null); setActiveSettle(null)
      dispatch(fetchExpenses(tripId)); dispatch(fetchBalances(tripId))
    }
  }

  const debts = balances?.debts ?? []
  const net = balances?.net ?? 0
  const totalSpent = items.reduce((s, e) => s + (e.amount || 0), 0)

  const filteredItems = items.filter(exp => {
    if (filter === 'mine') return exp.paidByUserId === currentUserId
    return true
  })

  const editInitial = modal?.mode === 'edit' ? {
    id: modal.expense.id, title: modal.expense.title, amount: modal.expense.amount,
    category: modal.expense.category, paidByUserId: modal.expense.paidByUserId,
    splitAmong: members.map(m => m.userId),
  } : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 0, alignItems: 'start' }}>
      {/* ---- Main column ---- */}
      <div style={{ borderRight: '2px solid var(--border-strong)', minHeight: '80vh', padding: '22px 28px' }}>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          <div style={{ background: 'var(--surface-solid)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
            <div className="kicker" style={{ marginBottom: 6 }}>Total cheltuit</div>
            <div style={{ font: '800 22px/1 Archivo, sans-serif', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>{totalSpent.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</div>
          </div>
          <div style={{ background: 'var(--surface-solid)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
            <div className="kicker" style={{ marginBottom: 6 }}>Pe persoană / zi</div>
            <div style={{ font: '800 22px/1 Archivo, sans-serif', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--teal-500)' }}>
              {members.length > 0 ? (totalSpent / members.length).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'} €
            </div>
          </div>
          <BudgetAlertCard tripId={tripId} budget={budget} currency={currency} spent={totalSpent} canEdit={isAdmin} />
        </div>

        {/* Filter + add */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="kicker">Cheltuieli · {filteredItems.length}</div>
            <div style={{ display: 'flex', background: 'rgba(18,41,74,.07)', borderRadius: 999, padding: 3, gap: 2 }}>
              {[['all','Toate'],['mine','Ale mele']].map(([v,l]) => (
                <button key={v} onClick={() => setFilter(v)} style={{ padding: '5px 12px', borderRadius: 999, border: 'none', background: filter === v ? '#fff' : 'none', color: filter === v ? 'var(--ink)' : 'var(--text-muted)', font: `${filter === v ? 800 : 400} 12px/1 Archivo, sans-serif`, cursor: 'pointer', boxShadow: filter === v ? '0 1px 3px rgba(11,26,48,.1)' : 'none' }}>{l}</button>
              ))}
            </div>
          </div>
          <button className="btn-primary" onClick={openAdd} style={{ fontSize: 13 }}>+ Adaugă cheltuială</button>
        </div>

        {status === 'loading' && <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Se încarcă…</div>}

        {status === 'succeeded' && filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
            Nicio cheltuială încă. Adaugă prima!
          </div>
        )}

        {filteredItems.map(exp => {
          const cat = EXPENSE_CAT_UI[exp.category] || EXPENSE_CAT_UI.other
          const canEdit = exp.paidByUserId === currentUserId || isAdmin
          const date = exp.date || exp.createdAt
          return (
            <div key={exp.id} className="expense-list-row">
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cat.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '800 14px/1 Archivo, sans-serif', color: 'var(--ink)', marginBottom: 3 }}>{exp.title}</div>
                <div style={{ font: '400 12px/1 Archivo, sans-serif', color: 'var(--text-muted)' }}>
                  {exp.paidByName} a plătit · împărțit în {exp.splitCount || members.length} · {((exp.amount || 0) / (exp.splitCount || members.length)).toFixed(2)} € de persoană
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ font: '800 17px/1 Archivo, sans-serif', fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>{Number(exp.amount).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} €</div>
                {date && <div style={{ font: '400 11px/1 Archivo, sans-serif', color: 'var(--text-faint)', marginTop: 3 }}>{new Date(date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}</div>}
              </div>
              {canEdit && (
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button className="icon-btn-sm" onClick={() => openEdit(exp)} title="Editează">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className="icon-btn-sm" onClick={() => handleDelete(exp.id)} disabled={deletingId === exp.id} title="Șterge" style={{ color: deletingId === exp.id ? 'var(--text-faint)' : undefined }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ---- Right panel ---- */}
      <div style={{ padding: '22px 20px', position: 'sticky', top: 0 }}>
        {/* Sold */}
        <div className="balance-hero-card" style={{ marginBottom: 18 }}>
          <div className="balance-hero-kicker">Soldul tău</div>
          <div className="balance-hero-amount" style={{ color: net >= 0 ? '#fff' : '#fca5a5' }}>
            {net >= 0 ? '+' : ''}{Number(net).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} €
          </div>
          <div className="balance-hero-sub">
            {net > 0 ? `Ai de primit de la ${debts.filter(d => d.toUserId === currentUserId).length} prieteni`
              : net < 0 ? 'Datorezi bani'
              : 'Ești la egal'}
          </div>
        </div>

        {/* Decontare */}
        {debts.length > 0 && (
          <div>
            <div className="kicker" style={{ marginBottom: 12 }}>Decontare · {debts.length} transferuri</div>
            {debts.map(d => {
              const isMe = d.fromUserId === currentUserId
              const isMeRecv = d.toUserId === currentUserId
              const isExpanded = activeSettle === `${d.fromUserId}-${d.toUserId}`
              return (
                <div key={`${d.fromUserId}-${d.toUserId}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <MemberAvatar name={d.fromName} size={34} />
                    <div style={{ flex: 1, font: '400 13px/1 Archivo, sans-serif', color: 'var(--ink)' }}>
                      <b>{isMe ? 'tu' : d.fromName}</b> → <b>{isMeRecv ? 'tu' : d.toName}</b>
                    </div>
                    <div style={{ font: '800 14px/1 Archivo, sans-serif', fontVariantNumeric: 'tabular-nums', color: 'var(--ink)', marginRight: 6 }}>
                      {Number(d.amount).toFixed(2)} €
                    </div>
                    {isMe ? (
                      <button className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => setActiveSettle(isExpanded ? null : `${d.fromUserId}-${d.toUserId}`)}>
                        Plătește
                      </button>
                    ) : (
                      <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => openSettleModal(d)}>
                        Cere
                      </button>
                    )}
                  </div>
                  {isExpanded && isMe && (
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: '12px 14px', margin: '6px 0 10px', border: '1px solid var(--border)' }}>
                      <div style={{ font: '800 13px/1 Archivo, sans-serif', color: 'var(--ink)', marginBottom: 10 }}>
                        {d.toPaymentLink ? `Are link de plată setat` : `${d.toName} nu are link de plată`}
                      </div>
                      {d.toPaymentLink && (
                        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={() => window.open(d.toPaymentLink, '_blank', 'noopener,noreferrer')}>
                          Deschide {d.toPaymentLink.includes('revolut') ? 'Revolut' : 'link'} · {Number(d.amount).toFixed(2)} €
                        </button>
                      )}
                      <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { openSettleModal(d); setActiveSettle(null) }}>
                        Am plătit cash — marchează
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {debts.length === 0 && balances && (
          <div style={{ background: 'rgba(15,155,142,.08)', borderRadius: 'var(--r-md)', padding: '12px 14px', border: '1px solid rgba(15,155,142,.2)', font: '400 13px/1.5 Archivo, sans-serif', color: 'var(--teal-700)' }}>
            ✓ Toate socotelile sunt închise!
          </div>
        )}
      </div>

      <ExpenseModal open={modal !== null} onClose={() => setModal(null)} onSubmit={modal?.mode === 'edit' ? handleEdit : handleAdd} submitting={actionStatus === 'loading'} error={actionError} members={members} initial={editInitial} />
      <SettleModal open={settleModal !== null} debt={settleModal} submitting={actionStatus === 'loading'} onClose={() => setSettleModal(null)} onSettle={handleSettle} />
    </div>
  )
}

const PROPOSAL_CATEGORIES = [
  { value: 0, label: 'Sight' }, { value: 1, label: 'Food' }, { value: 2, label: 'Stay' },
  { value: 3, label: 'Travel' }, { value: 4, label: 'Fun' }, { value: 5, label: 'Transit' },
]

function ProposalCard({ proposal, currentUserId, tripId }) {
  const dispatch = useDispatch()
  const myVote = proposal.votes?.find((v) => v.userId === currentUserId)
  const approvals = proposal.votes?.filter((v) => v.approved).length ?? 0
  const rejections = proposal.votes?.filter((v) => !v.approved).length ?? 0
  const total = proposal.totalMembers ?? 1
  const pct = Math.round((approvals / total) * 100)
  const isOpen = proposal.status === 'Open'

  const vote = (approved) => dispatch(voteProposal({ tripId, proposalId: proposal.id, approved }))

  const statusColor = proposal.status === 'Approved' ? 'var(--owed)' : proposal.status === 'Rejected' ? 'var(--owe)' : 'var(--brand)'

  return (
    <div style={{
      borderRadius: 'var(--r-lg)', border: '1.5px solid var(--border-subtle)',
      background: 'var(--surface-card)', overflow: 'hidden',
      boxShadow: 'var(--shadow-xs)', margin: '4px 0',
    }}>
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="calendar" size={15} color="var(--brand)" />
        <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Propunere activitate
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-semibold)', color: statusColor }}>
          {proposal.status === 'Approved' ? '✓ Aprobată' : proposal.status === 'Rejected' ? '✗ Respinsă' : 'În vot'}
        </span>
      </div>

      <div style={{ padding: '10px 14px' }}>
        <p style={{ margin: '0 0 2px', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', fontSize: 'var(--fs-sm)' }}>
          {proposal.title}
        </p>
        {proposal.description && (
          <p style={{ margin: '2px 0', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{proposal.description}</p>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
          {proposal.location && (
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Icon name="pin" size={12} /> {proposal.location}
            </span>
          )}
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Icon name="clock" size={12} /> {new Date(proposal.startTime).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
          {proposal.cost && (
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Icon name="wallet" size={12} /> ${proposal.cost}
            </span>
          )}
        </div>

        <div style={{ margin: '10px 0 6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{approvals} din {total} aprobă</span>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{pct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: 'var(--border-subtle)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--owed)', borderRadius: 99, transition: 'width 0.3s' }} />
          </div>
        </div>

        {isOpen && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              onClick={() => vote(true)}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: 'var(--fs-xs)',
                fontWeight: 'var(--fw-semibold)', border: '1.5px solid',
                borderColor: myVote?.approved === true ? 'var(--owed)' : 'var(--border-subtle)',
                background: myVote?.approved === true ? 'var(--owed)' : 'transparent',
                color: myVote?.approved === true ? '#fff' : 'var(--text-muted)',
              }}
            >
              ✓ Aprob ({approvals})
            </button>
            <button
              onClick={() => vote(false)}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: 'var(--fs-xs)',
                fontWeight: 'var(--fw-semibold)', border: '1.5px solid',
                borderColor: myVote?.approved === false ? 'var(--owe)' : 'var(--border-subtle)',
                background: myVote?.approved === false ? 'var(--owe)' : 'transparent',
                color: myVote?.approved === false ? '#fff' : 'var(--text-muted)',
              }}
            >
              ✗ Resping ({rejections})
            </button>
          </div>
        )}
        <p style={{ margin: '6px 0 0', fontSize: 'var(--fs-xs)', color: 'var(--text-subtle)' }}>
          Propus de {proposal.proposedByName} · {new Date(proposal.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

function ProposalForm({ tripId, onClose }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState({
    title: '', description: '', location: '',
    startTime: '', endTime: '', category: 0, cost: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (!form.title || !form.startTime) return
    setSubmitting(true)
    setError(null)
    const result = await dispatch(createProposal({
      tripId,
      proposal: {
        title: form.title,
        description: form.description || null,
        location: form.location || null,
        startTime: new Date(form.startTime).toISOString(),
        endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
        category: Number(form.category),
        cost: form.cost ? Number(form.cost) : null,
      },
    }))
    setSubmitting(false)
    if (createProposal.fulfilled.match(result)) {
      onClose()
    } else {
      setError(result.payload ?? 'Eroare la trimitere')
    }
  }

  return (
    <div style={{ padding: '12px 0', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="flex items-center justify-between">
        <span style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-sm)', color: 'var(--text-strong)' }}>Propune activitate</span>
        <IconButton icon="x" variant="ghost" size="sm" onClick={onClose} />
      </div>
      <Input placeholder="Titlu *" value={form.title} onChange={(e) => set('title', e.target.value)} />
      <Input placeholder="Descriere" value={form.description} onChange={(e) => set('description', e.target.value)} />
      <Input placeholder="Locație" value={form.location} onChange={(e) => set('location', e.target.value)} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Data/ora start *</label>
          <input type="datetime-local" value={form.startTime} onChange={(e) => set('startTime', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border-subtle)', background: 'var(--surface-card)', color: 'var(--text-body)', fontSize: 'var(--fs-sm)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Data/ora sfârșit</label>
          <input type="datetime-local" value={form.endTime} onChange={(e) => set('endTime', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border-subtle)', background: 'var(--surface-card)', color: 'var(--text-body)', fontSize: 'var(--fs-sm)' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={form.category} onChange={(e) => set('category', e.target.value)}
          style={{ flex: 1, padding: '8px 10px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border-subtle)', background: 'var(--surface-card)', color: 'var(--text-body)', fontSize: 'var(--fs-sm)' }}>
          {PROPOSAL_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <Input placeholder="Cost ($)" value={form.cost} onChange={(e) => set('cost', e.target.value)} style={{ flex: 1 }} />
      </div>
      <Button variant="primary" loading={submitting} onClick={handleSubmit} style={{ width: '100%' }}>
        Trimite propunerea
      </Button>
      {error && <p className="auth-error">{error}</p>}
    </div>
  )
}

const PROPOSAL_CAT_LABELS = ['Mâncare', 'Obiectiv', 'Cazare', 'Drum', 'Distracție']

function Chat({ tripId, currentUserId, members }) {
  const dispatch = useDispatch()
  const { token } = useSelector((s) => s.auth)
  const { messages, status } = useSelector((s) => s.chat)
  const { items: proposals } = useSelector((s) => s.proposals)
  const [text, setText] = useState('')
  const [connected, setConnected] = useState(false)
  const connectionRef = useRef(null)
  const bottomRef = useRef(null)

  // Proposal form state (right panel)
  const [propForm, setPropForm] = useState({ title: '', location: '', startDate: '', startTime: '', endTime: '', category: 0, cost: '' })
  const [propSubmitting, setPropSubmitting] = useState(false)
  const [propError, setPropError] = useState(null)
  const setProp = (k, v) => setPropForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    let cancelled = false
    dispatch(fetchMessages(tripId))
    dispatch(fetchProposals(tripId))

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`https://localhost:7213/hubs/chat`, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    connection.on('ReceiveMessage', (msg) => { if (!cancelled) dispatch(messageReceived(msg)) })
    connection.on('ProposalCreated', (p) => { if (!cancelled) dispatch(proposalReceived(p)) })
    connection.on('ProposalUpdated', (p) => {
      if (!cancelled) {
        dispatch(proposalUpdated(p))
        if (p.status === 'Approved') dispatch(fetchActivities(tripId))
      }
    })

    connectionRef.current = connection
    connection.start()
      .then(() => { if (cancelled) { connection.stop(); return }; setConnected(true); return connection.invoke('JoinTrip', tripId) })
      .catch(() => {})

    return () => { cancelled = true; setConnected(false); connection.stop(); dispatch(clearMessages()); dispatch(clearProposals()) }
  }, [tripId, token, dispatch])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || !connectionRef.current || !connected) return
    setText('')
    try { await connectionRef.current.invoke('SendMessage', tripId, trimmed) } catch {}
  }

  const handlePropSubmit = async () => {
    if (!propForm.title || !propForm.startDate || !propForm.startTime) return
    setPropSubmitting(true); setPropError(null)
    const result = await dispatch(createProposal({
      tripId,
      proposal: {
        title: propForm.title,
        location: propForm.location || null,
        startTime: new Date(`${propForm.startDate}T${propForm.startTime}`).toISOString(),
        endTime: propForm.endTime ? new Date(`${propForm.startDate}T${propForm.endTime}`).toISOString() : null,
        category: Number(propForm.category),
        cost: propForm.cost ? Number(propForm.cost) : null,
      },
    }))
    setPropSubmitting(false)
    if (createProposal.fulfilled.match(result)) {
      setPropForm({ title: '', location: '', startDate: '', startTime: '', endTime: '', category: 0, cost: '' })
    } else {
      setPropError(result.payload ?? 'Eroare la trimitere')
    }
  }

  const feed = [
    ...messages.map((m) => ({ ...m, _type: 'message', _time: new Date(m.sentAt) })),
    ...proposals.map((p) => ({ ...p, _type: 'proposal', _time: new Date(p.createdAt) })),
  ].sort((a, b) => a._time - b._time)

  const MEMBER_COLORS = ['#1f6feb','#0f9b8e','#ff7a45','#7c3aed','#e2564a','#0b6f66']
  const memberColor = (name) => MEMBER_COLORS[(name?.charCodeAt(0) ?? 0) % MEMBER_COLORS.length]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: '80vh' }}>
      {/* ---- Chat feed ---- */}
      <div style={{ display: 'flex', flexDirection: 'column', borderRight: '2px solid var(--border-strong)' }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: '60vh' }}>
          {status === 'loading' && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Se încarcă…</div>}
          {feed.length === 0 && status === 'succeeded' && (
            <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)', fontSize: 14 }}>Niciun mesaj. Fii primul!</div>
          )}

          {feed.map((item) => {
            if (item._type === 'proposal') {
              const total = members.length
              const approvals = item.votes?.filter(v => v.approved)?.length ?? 0
              const rejections = item.votes?.filter(v => !v.approved)?.length ?? 0
              const pct = total > 0 ? Math.round((approvals / total) * 100) : 0
              const isOpen = item.status === 'Open' || item.status === 'Voting' || !item.status
              const myVote = item.votes?.find(v => v.userId === currentUserId)

              return (
                <div key={`prop-${item.id}`} style={{ background: 'var(--surface-solid)', border: '1.5px solid rgba(31,111,235,.3)', borderRadius: 'var(--r-lg)', padding: '12px 14px', margin: '6px 0 6px 36px', boxShadow: 'var(--shadow-blue)', width: '100%', maxWidth: 380, alignSelf: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ font: '800 10px/1 Archivo, sans-serif', letterSpacing: '.1em', color: 'var(--blue-700)', textTransform: 'uppercase' }}>
                      PROPUNERE · {item.startTime ? new Date(item.startTime).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                    <span className={`proposal-badge badge-${isOpen ? 'voting' : item.status?.toLowerCase() === 'approved' ? 'approved' : 'rejected'}`}>
                      {isOpen ? 'SE VOTEAZĂ' : item.status?.toLowerCase() === 'approved' ? 'APROBAT' : 'RESPINS'}
                    </span>
                  </div>
                  <div style={{ font: '800 15px/1.2 Archivo, sans-serif', color: 'var(--ink)', marginBottom: 4 }}>{item.title}</div>
                  {item.location && <div style={{ font: '400 12px/1 Archivo, sans-serif', color: 'var(--text-muted)', marginBottom: 6 }}>📍 {item.location}{item.cost ? ` · ${item.cost} €/pers` : ''}</div>}
                  {/* Progress */}
                  <div style={{ height: 6, borderRadius: 99, background: 'rgba(31,111,235,.1)', overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--blue-500)', borderRadius: 99, transition: 'width .3s' }} />
                  </div>
                  <div style={{ font: '400 11px/1 Archivo, sans-serif', color: 'var(--text-muted)', marginBottom: 8 }}>{approvals} aprobă · {rejections} resping</div>
                  {isOpen && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => dispatch(voteProposal({ tripId, proposalId: item.id, approved: true }))}
                        style={{ flex: 1, padding: '8px 0', borderRadius: 'var(--r-md)', border: `1.5px solid ${myVote?.approved === true ? 'var(--blue-500)' : 'var(--border)'}`, background: myVote?.approved === true ? 'var(--blue-500)' : 'var(--surface-solid)', color: myVote?.approved === true ? '#fff' : 'var(--text-muted)', font: '800 12px/1 Archivo, sans-serif', cursor: 'pointer' }}
                      >Sunt de acord</button>
                      <button
                        onClick={() => dispatch(voteProposal({ tripId, proposalId: item.id, approved: false }))}
                        style={{ flex: 1, padding: '8px 0', borderRadius: 'var(--r-md)', border: `1.5px solid ${myVote?.approved === false ? 'var(--red-500)' : 'var(--border)'}`, background: 'var(--surface-solid)', color: 'var(--text-muted)', font: '800 12px/1 Archivo, sans-serif', cursor: 'pointer' }}
                      >Nu prea</button>
                    </div>
                  )}
                </div>
              )
            }

            const isMe = item.userId === currentUserId
            return (
              <div key={`msg-${item.id}`} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 2 }}>
                {!isMe && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: memberColor(item.userName), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {item.userName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div style={{ maxWidth: '70%' }}>
                  {!isMe && <div style={{ font: '800 10.5px/1 Archivo, sans-serif', color: 'var(--text-muted)', marginBottom: 3, paddingLeft: 4 }}>{item.userName} · {new Date(item.sentAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</div>}
                  <div className={`bubble ${isMe ? 'mine' : 'theirs'}`}>{item.text}</div>
                  {isMe && <div style={{ font: '400 10px/1 Archivo, sans-serif', color: 'var(--text-faint)', textAlign: 'right', marginTop: 3, paddingRight: 4 }}>{new Date(item.sentAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</div>}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="chat-input-bar">
          <button className="chat-propose-btn" title="Adaugă propunere rapid" style={{ flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </button>
          <input
            className="chat-input"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={connected ? 'Scrie un mesaj… (Enter pentru trimitere)' : 'Se conectează…'}
            disabled={!connected}
          />
          <button className="chat-send-btn" onClick={handleSend} disabled={!text.trim() || !connected}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>

      {/* ---- Right panel: proposal form ---- */}
      <div style={{ padding: '20px 18px', borderLeft: '1px solid var(--border)' }}>
        <div className="kicker" style={{ marginBottom: 16 }}>Propunere nouă</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="input-label">Titlu</label>
            <input className="input-field" placeholder="Prânz la Time Out Market" value={propForm.title} onChange={e => setProp('title', e.target.value)} />
          </div>
          <div>
            <label className="input-label">Locație</label>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--blue-500)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 0 0-8-8z"/></svg>
              <input className="input-field" style={{ paddingLeft: 32 }} placeholder="Av. 24 de Julho 49" value={propForm.location} onChange={e => setProp('location', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label className="input-label">Start</label>
              <input className="input-field" type="time" value={propForm.startTime} onChange={e => setProp('startTime', e.target.value)} />
            </div>
            <div>
              <label className="input-label">Final</label>
              <input className="input-field" type="time" value={propForm.endTime} onChange={e => setProp('endTime', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="input-label">Data</label>
            <input className="input-field" type="date" value={propForm.startDate} onChange={e => setProp('startDate', e.target.value)} />
          </div>

          <div>
            <label className="input-label">Categorie</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PROPOSAL_CAT_LABELS.map((l, i) => (
                <button
                  key={l} type="button"
                  onClick={() => setProp('category', i)}
                  style={{ padding: '6px 11px', borderRadius: 999, border: 'none', background: propForm.category === i ? 'var(--blue-500)' : 'rgba(18,41,74,.07)', color: propForm.category === i ? '#fff' : 'var(--text-muted)', font: `${propForm.category === i ? 800 : 400} 12px/1 Archivo, sans-serif`, cursor: 'pointer' }}
                >{l}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Cost estimat / persoană</label>
            <div style={{ position: 'relative' }}>
              <input className="input-field" type="number" placeholder="18,00" value={propForm.cost} onChange={e => setProp('cost', e.target.value)} style={{ paddingRight: 36 }} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', font: '800 12px/1 Archivo, sans-serif', color: 'var(--text-muted)' }}>€</span>
            </div>
          </div>

          {propError && <div className="auth-error" style={{ fontSize: 12 }}>{propError}</div>}

          <button className="btn-primary" style={{ justifyContent: 'center', marginTop: 4 }} disabled={propSubmitting || !propForm.title} onClick={handlePropSubmit}>
            {propSubmitting ? 'Se trimite…' : 'Trimite la vot'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============ MEMBERS ============ */
function UserSearchDropdown({ existingMemberIds, onSelect }) {
  const token = useSelector((state) => state.auth.token)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setDropdownOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await apiRequest(`/users?search=${encodeURIComponent(query.trim())}`, { token })
        const filtered = (data ?? []).filter((u) => !existingMemberIds.includes(u.id))
        setResults(filtered)
        setDropdownOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, token])

  const handleSelect = (user) => {
    onSelect(user)
    setQuery('')
    setResults([])
    setDropdownOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <Input
        label="Search by name or email"
        placeholder="Type to search…"
        leadingIcon="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
        onFocus={() => { if (results.length > 0) setDropdownOpen(true) }}
      />
      {loading && (
        <p style={{ font: "var(--fw-regular) var(--fs-xs)/1 'Inter', sans-serif", color: 'var(--text-muted)', marginTop: 6 }}>
          Searching…
        </p>
      )}
      {dropdownOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          marginTop: 4, background: 'var(--surface-card)',
          border: '1.5px solid var(--border-default)', borderRadius: 'var(--r-md)',
          boxShadow: 'var(--shadow-md)', overflow: 'hidden',
        }}>
          {results.length === 0 ? (
            <div style={{ padding: '12px 14px', font: "var(--fw-regular) var(--fs-sm)/1 'Inter', sans-serif", color: 'var(--text-muted)' }}>
              No users found.
            </div>
          ) : (
            results.map((user) => (
              <div
                key={user.id}
                onMouseDown={() => handleSelect(user)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
              >
                <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                <div>
                  <div style={{ font: "var(--fw-semibold) var(--fs-sm)/1.2 'Inter', sans-serif", color: 'var(--text-strong)' }}>{user.name}</div>
                  <div style={{ font: "var(--fw-regular) var(--fs-xs)/1 'Inter', sans-serif", color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function InviteMemberModal({ open, onClose, onInvite, submitting, error, members }) {
  const [selectedUser, setSelectedUser] = useState(null)
  const existingMemberIds = members.map((m) => m.userId)

  useEffect(() => {
    if (open) setSelectedUser(null)
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedUser) onInvite(selectedUser.email)
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Adaugă un prieten</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="input-label">Caută după nume sau email</label>
              <UserSearchDropdown
                key={open}
                existingMemberIds={existingMemberIds}
                onSelect={setSelectedUser}
              />
            </div>

            {selectedUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--r-lg)', background: 'var(--blue-tint)', border: '1.5px solid var(--blue-500)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: memberColor(selectedUser.name), display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 13px/1 Archivo, sans-serif', color: '#fff', flexShrink: 0 }}>
                  {selectedUser.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '800 14px/1 Archivo, sans-serif', color: 'var(--ink)', marginBottom: 3 }}>{selectedUser.name}</div>
                  <div style={{ font: '400 12px/1 Archivo, sans-serif', color: 'var(--text-muted)' }}>{selectedUser.email}</div>
                </div>
                <button type="button" className="icon-btn-sm" onClick={() => setSelectedUser(null)} title="Renunță la selecție" style={{ flexShrink: 0 }}>×</button>
              </div>
            )}

            {error && <div className="auth-error"><span>⚠</span> {error}</div>}
          </div>
          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Renunț</button>
            <button type="submit" className="btn-primary" disabled={submitting || !selectedUser}>
              {submitting ? 'Se adaugă…' : 'Adaugă în călătorie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const MEMBER_COLORS = ['#1f6feb','#0f9b8e','#ff7a45','#7c3aed','#e2564a','#0b6f66']
function memberColor(name) { return MEMBER_COLORS[(name?.charCodeAt(0) ?? 0) % MEMBER_COLORS.length] }

const DOC_KIND_UI = {
  flight:   { emoji: '✈', label: 'Zbor' },
  stay:     { emoji: '🛏', label: 'Cazare' },
  ticket:   { emoji: '🎟', label: 'Bilet' },
  passport: { emoji: '🛂', label: 'Act de identitate' },
  other:    { emoji: '📄', label: 'Alt document' },
}

function AddDocumentModal({ open, onClose, onSubmit, submitting, members }) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('flight')
  const [note, setNote] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [ownerUserId, setOwnerUserId] = useState('')

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      kind,
      note: note.trim() || null,
      fileUrl: fileUrl.trim() || null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      ownerUserId: ownerUserId ? Number(ownerUserId) : null,
    })
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Adaugă un document</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="input-label">Titlu</label>
              <input className="input-field" placeholder="ex. Zbor OTP → LIS" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div>
              <label className="input-label">Tip</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.entries(DOC_KIND_UI).map(([k, u]) => {
                  const active = kind === k
                  return (
                    <button key={k} type="button" onClick={() => setKind(k)}
                      style={{ padding: '7px 13px', borderRadius: 999, border: active ? '1.5px solid var(--blue-500)' : '1.5px solid var(--border)', background: active ? 'var(--blue-tint)' : 'var(--surface-solid)', color: active ? 'var(--blue-700)' : 'var(--text-muted)', font: `${active ? 800 : 400} 12px/1 Archivo, sans-serif`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{u.emoji}</span>{u.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="input-label">Detalii</label>
              <input className="input-field" placeholder="ex. 12 sep, 07:20 · cod HX-8821" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div>
              <label className="input-label">Link către fișier (opțional)</label>
              <input className="input-field" type="url" placeholder="https://…" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="input-label">Expiră la (opțional)</label>
                <input className="input-field" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Al cui e</label>
                <select className="input-field" value={ownerUserId} onChange={(e) => setOwnerUserId(e.target.value)} style={{ cursor: 'pointer' }}>
                  <option value="">Al grupului</option>
                  {members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Renunț</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Se salvează…' : 'Salvează'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Members({ members, currentUserEmail, isAdmin, tripId }) {
  const dispatch = useDispatch()
  const { memberActionStatus, memberActionError } = useSelector((state) => state.trips)
  const { invite, checklist, documents } = useSelector((state) => state.group)
  const [modalOpen, setModalOpen] = useState(false)
  const [docModalOpen, setDocModalOpen] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [copied, setCopied] = useState(false)
  const [newTask, setNewTask] = useState('')
  const currentUserId = members.find((m) => m.email === currentUserEmail)?.userId

  useEffect(() => {
    dispatch(fetchInvite(tripId))
    dispatch(fetchChecklist(tripId))
    dispatch(fetchDocuments(tripId))
  }, [dispatch, tripId])

  const inviteExpiryDays = invite
    ? Math.max(0, Math.ceil((new Date(invite.expiresAt) - Date.now()) / 86400000))
    : null

  const handleCopy = async () => {
    let link = invite
    if (!link) {
      const result = await dispatch(createInvite(tripId))
      if (!createInvite.fulfilled.match(result)) return
      link = result.payload
    }
    navigator.clipboard?.writeText(link.url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTask.trim()) return
    dispatch(addChecklistItem({ tripId, text: newTask.trim() }))
    setNewTask('')
  }

  const doneCount = checklist.filter((c) => c.done).length

  const handleInvite = async (email) => {
    if (!email) return
    const result = await dispatch(addTripMember({ tripId, email }))
    if (addTripMember.fulfilled.match(result)) setModalOpen(false)
  }

  const handleRemove = async (memberUserId) => {
    setRemovingId(memberUserId)
    await dispatch(removeTripMember({ tripId, memberUserId }))
    setRemovingId(null)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '80vh' }}>
      {/* ---- Left: members ---- */}
      <div style={{ borderRight: '2px solid var(--border-strong)', padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div className="kicker">Prieteni · {members.length}</div>
          <button className="btn-primary" style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => { dispatch(clearMemberActionError()); setModalOpen(true) }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Invită
          </button>
        </div>

        {/* Invite link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--blue-tint)', border: '1.5px dashed #9cc0f7', borderRadius: 'var(--r-lg)', padding: '12px 14px', marginBottom: 18 }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: 'rgba(31,111,235,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--blue-700)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '800 12px/1 Archivo, sans-serif', color: 'var(--blue-700)', marginBottom: 2 }}>
              Link de invitație{invite ? ` · cod ${invite.code}` : ''}
            </div>
            <div style={{ font: '400 12px/1 Archivo, sans-serif', color: 'var(--blue-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {invite
                ? `${invite.url} · expiră în ${inviteExpiryDays} ${inviteExpiryDays === 1 ? 'zi' : 'zile'}`
                : 'Niciun link activ — generează unul ca să inviți pe cineva.'}
            </div>
          </div>
          <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }} onClick={handleCopy}>
            {copied ? '✓ Copiat' : invite ? 'Copiază' : 'Generează'}
          </button>
        </div>

        {/* Member list */}
        {members.map((m) => {
          const isYou = m.email === currentUserEmail
          const canRemove = isAdmin || isYou
          const initials = m.name ? m.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '?'
          const hasRevolut = !!m.paymentLink
          return (
            <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: memberColor(m.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ font: '800 14px/1 Archivo, sans-serif', color: 'var(--ink)' }}>{m.name}</span>
                  {m.role === 'Admin' && <span style={{ background: 'var(--blue-tint)', color: 'var(--blue-700)', font: '800 9px/1 Archivo, sans-serif', letterSpacing: '.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 999 }}>ADMIN</span>}
                  {isYou && <span style={{ background: 'rgba(15,155,142,.1)', color: 'var(--teal-700)', font: '800 9px/1 Archivo, sans-serif', letterSpacing: '.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 999 }}>TU</span>}
                  {!m.userId && <span style={{ background: 'rgba(255,122,69,.1)', color: 'var(--orange-500)', font: '800 9px/1 Archivo, sans-serif', letterSpacing: '.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 999 }}>INVITAT</span>}
                </div>
                <div style={{ font: '400 12px/1 Archivo, sans-serif', color: 'var(--text-muted)' }}>
                  {m.email}{hasRevolut ? ' · Revolut setat' : ''}
                </div>
              </div>
              {canRemove && (
                <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px', color: 'var(--red-500)', borderColor: 'rgba(226,86,74,.3)', flexShrink: 0 }} disabled={removingId === m.userId} onClick={() => handleRemove(m.userId)}>
                  {removingId === m.userId ? '…' : 'Scoate'}
                </button>
              )}
            </div>
          )
        })}
        {memberActionError && <div className="auth-error" style={{ marginTop: 12 }}>{memberActionError}</div>}
      </div>

      {/* ---- Right: documents + checklist, each a fixed-height pane that scrolls on its own ---- */}
      <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20, height: '80vh', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 300, minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
          <div className="kicker">Documente · {documents.length}</div>
          <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => setDocModalOpen(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Adaugă
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
        {documents.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 10 }}>
            Niciun document încă. Adaugă biletele, rezervările sau actele grupului.
          </div>
        )}

        {documents.map((doc) => {
          const ui = DOC_KIND_UI[doc.kind] || DOC_KIND_UI.other
          const alert = doc.isExpiringSoon
          const sub = [
            doc.note,
            doc.ownerUserName,
            doc.expiresAt ? `expiră ${new Date(doc.expiresAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}` : null,
          ].filter(Boolean).join(' · ')
          return (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 'var(--r-lg)', background: alert ? 'rgba(255,122,69,.06)' : 'var(--surface-solid)', border: `1px solid ${alert ? 'rgba(255,122,69,.25)' : 'var(--border)'}`, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: alert ? 'rgba(255,122,69,.12)' : 'var(--blue-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {alert ? '⚠' : ui.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '800 13px/1 Archivo, sans-serif', color: alert ? 'var(--orange-500)' : 'var(--ink)', marginBottom: 3 }}>{doc.title}</div>
                {sub && <div style={{ font: '400 11px/1.4 Archivo, sans-serif', color: alert ? 'var(--orange-700)' : 'var(--text-muted)' }}>{sub}</div>}
              </div>
              {doc.fileUrl && (
                <a className="icon-btn-sm" href={doc.fileUrl} target="_blank" rel="noopener noreferrer" title="Deschide" style={{ flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </a>
              )}
              <button className="icon-btn-sm" title="Șterge" style={{ flexShrink: 0 }} onClick={() => dispatch(deleteDocument({ tripId, documentId: doc.id }))}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          )
        })}
        </div>
      </div>

        {/* Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
            <div className="kicker">Checklist · {doneCount} din {checklist.length}</div>
          </div>

          <form onSubmit={handleAddTask} style={{ display: 'flex', gap: 8, marginBottom: 14, flexShrink: 0 }}>
            <input
              className="input-field" placeholder="Adaugă ceva de pus în bagaj sau de rezolvat…"
              value={newTask} onChange={(e) => setNewTask(e.target.value)} style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} disabled={!newTask.trim()}>
              Adaugă
            </button>
          </form>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
          {checklist.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Niciun element în checklist. Adaugă bagaje comune sau personale.
            </div>
          ) : checklist.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <input
                type="checkbox" className="checkbox-light" checked={c.done}
                onChange={() => dispatch(updateChecklistItem({ tripId, itemId: c.id, changes: { done: !c.done } }))}
              />
              <span style={{ flex: 1, font: '400 13px/1.3 Archivo, sans-serif', color: c.done ? 'var(--text-muted)' : 'var(--ink)', textDecoration: c.done ? 'line-through' : 'none' }}>
                {c.text}
              </span>
              <select
                value={c.assignedUserId ?? ''}
                onChange={(e) => dispatch(updateChecklistItem({ tripId, itemId: c.id, changes: { assignedUserId: e.target.value ? Number(e.target.value) : currentUserId } }))}
                style={{ border: 'none', background: 'none', font: '800 11px/1 Archivo, sans-serif', color: 'var(--text-muted)', cursor: 'pointer', maxWidth: 100 }}
              >
                <option value="">Oricine</option>
                {members.map((m) => <option key={m.userId} value={m.userId}>{m.name.split(' ')[0]}</option>)}
              </select>
              <button className="icon-btn-sm" title="Șterge" style={{ flexShrink: 0 }} onClick={() => dispatch(deleteChecklistItem({ tripId, itemId: c.id }))}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              </button>
            </div>
          ))}
          </div>
        </div>
      </div>

      <InviteMemberModal
        open={modalOpen} onClose={() => setModalOpen(false)} onInvite={handleInvite}
        submitting={memberActionStatus === 'loading'} error={memberActionError}
        members={members}
      />

      <AddDocumentModal
        open={docModalOpen} onClose={() => setDocModalOpen(false)} members={members}
        onSubmit={async (document) => {
          const result = await dispatch(addDocument({ tripId, document }))
          if (addDocument.fulfilled.match(result)) setDocModalOpen(false)
        }}
      />
    </div>
  )
}

const QUICK_PROMPTS = [
  { icon: '🔍', text: 'Ce merită văzut în zonă?' },
  { icon: '🍽', text: 'Unde se mănâncă bine?' },
  { icon: '🚌', text: 'Cum mă deplasez local?' },
  { icon: '🤝', text: 'Obiceiuri locale de știut' },
  { icon: '🌧', text: 'Ce fac dacă plouă?' },
]

function AiChat({ tripId, destination, members, startDate, endDate, budget, currency = 'EUR', expenses }) {
  const { token } = useSelector((s) => s.auth)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastTiers, setLastTiers] = useState(null) // { eco, mid, prem, details }
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    setLastTiers(null)

    const userMsg = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: null, loading: true }])
    setLoading(true)

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'https://localhost:7213'}/api/trips/${tripId}/ai/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: msg, history: messages.map(m => ({ role: m.role, content: m.content || '' })) }),
        }
      )
      const data = await res.json()
      const reply = data.reply ?? data.message ?? 'Eroare la răspuns.'

      // Try to extract budget tiers from response
      const tierMatch = reply.match(/economic[^\n]*(\d+)\s*€.*\n.*mediu[^\n]*(\d+)\s*€.*\n.*premium[^\n]*(\d+)\s*€/i)
      if (tierMatch) {
        setLastTiers({ eco: tierMatch[1], mid: tierMatch[2], prem: tierMatch[3] })
      }

      setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: reply, loading: false }])
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: 'Eroare de conexiune. Încearcă din nou.', loading: false }])
    } finally {
      setLoading(false)
    }
  }

  const renderContent = (text) => text
    ?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    ?.replace(/\n/g, '<br/>') ?? ''

  const totalDays = startDate && endDate ? Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 1 : null
  const totalSpent = (expenses ?? []).reduce((s, e) => s + (e.amount || 0), 0)
  const budgetLeft = budget != null && budget > 0 ? budget - totalSpent : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 460px', minHeight: '80vh' }}>
      {/* ---- Main: chat ---- */}
      <div style={{ display: 'flex', flexDirection: 'column', borderRight: '2px solid var(--border-strong)' }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="kicker" style={{ marginBottom: 6 }}>Asistent · {destination}{startDate ? `, ${new Date(startDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}–${new Date(endDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}` : ''}{members?.length ? `, ${members.length} persoane` : ''}</div>
          <h2 style={{ font: '800 28px/1.1 Archivo, sans-serif', letterSpacing: '-0.025em', color: 'var(--ink)', margin: 0 }}>
            Ce vrei să pun la cale?
          </h2>
        </div>

        {/* Feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: '40vh' }}>
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            if (msg.loading) {
              return (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: 'var(--blue-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✨</div>
                  <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: '0 16px 16px 16px', padding: '10px 14px', font: '400 14px/1 Archivo, sans-serif', color: 'var(--text-muted)' }}>
                    Se gândește…
                  </div>
                </div>
              )
            }
            return (
              <div key={i} style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 10 }}>
                {!isUser && <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: 'var(--blue-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✨</div>}
                <div style={{
                  maxWidth: '75%',
                  padding: '10px 14px',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                  background: isUser ? 'var(--blue-500)' : 'var(--surface-solid)',
                  color: isUser ? '#fff' : 'var(--ink)',
                  font: '400 14px/1.6 Archivo, sans-serif',
                  border: isUser ? 'none' : '1px solid var(--border)',
                }}>
                  <span dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
                </div>
              </div>
            )
          })}

          {/* Budget tiers when detected */}
          {lastTiers && (
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px 16px', marginTop: 4 }}>
              <div className="kicker" style={{ marginBottom: 12, color: 'var(--blue-700)' }}>Ce adaug în plan, varianta medie</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'Economic', amount: lastTiers.eco, border: 'var(--border)', accent: 'var(--text-muted)' },
                  { label: 'Mediu · Recomandat', amount: lastTiers.mid, border: 'var(--blue-500)', accent: 'var(--blue-700)' },
                  { label: 'Premium', amount: lastTiers.prem, border: 'rgba(255,122,69,.5)', accent: 'var(--orange-500)' },
                ].map((t, idx) => (
                  <div key={idx} style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', border: `2px solid ${t.border}`, background: 'var(--surface-solid)' }}>
                    <div style={{ font: `800 9px/1 Archivo, sans-serif`, letterSpacing: '.1em', textTransform: 'uppercase', color: t.accent, marginBottom: 6 }}>{t.label}</div>
                    <div style={{ font: '800 22px/1 Archivo, sans-serif', color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{t.amount} €</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" style={{ fontSize: 12 }}>Adaugă toate în plan</button>
                <button className="btn-secondary" style={{ fontSize: 12 }}>Trimite la vot în chat</button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
            placeholder={`Întreabă orice despre ${destination}…`}
            disabled={loading}
          />
          <button className="chat-send-btn" onClick={() => send()} disabled={!input.trim() || loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>

      {/* ---- Right panel: quick prompts + context ---- */}
      <div style={{ padding: '24px 24px' }}>
        <div className="kicker" style={{ marginBottom: 14 }}>Întrebări rapide</div>
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.text}
            onClick={() => send(p.text)}
            disabled={loading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-solid)', color: 'var(--text-muted)', font: '400 14px/1.3 Archivo, sans-serif', cursor: 'pointer', marginBottom: 9, textAlign: 'left', transition: 'all 120ms' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue-300)'; e.currentTarget.style.color = 'var(--ink)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <span>{p.icon}</span>
            <span>{p.text}</span>
          </button>
        ))}

        {/* Context box */}
        <div style={{ marginTop: 24, padding: '18px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)' }}>
          <div className="kicker" style={{ marginBottom: 12 }}>Contextul folosit</div>
          {[
            { label: 'Destinație', value: destination },
            { label: 'Perioadă', value: startDate ? `${new Date(startDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}–${new Date(endDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}` : '—' },
            { label: 'Buget rămas', value: budgetLeft != null ? `${Math.round(budgetLeft)} ${currency}` : '—' },
            { label: 'Zile libere', value: totalDays ? `${totalDays} zile` : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ font: '400 13px/1 Archivo, sans-serif', color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ font: '800 13px/1 Archivo, sans-serif', color: 'var(--ink)' }}>{value}</span>
            </div>
          ))}
          <div style={{ font: '400 11px/1.4 Archivo, sans-serif', color: 'var(--text-faint)', marginTop: 8 }}>
            Asistentul vede planul și bugetul călătoriei, nu și conversațiile private.
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============ RECAPITULARE ============ */
function Recap({ trip, expenses, activities }) {
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const perPerson = trip.members?.length > 0 ? totalSpent / trip.members.length : 0

  const catTotals = {}
  expenses.forEach(e => {
    const k = e.category || 'other'
    catTotals[k] = (catTotals[k] || 0) + (e.amount || 0)
  })

  const CAT_LABELS = { food: 'Mâncare', stay: 'Cazare', transport: 'Transport', sight: 'Obiective', fun: 'Distracție', other: 'Altele' }
  const CAT_COLORS = { food: '#ff7a45', stay: '#0f9b8e', transport: '#1f6feb', sight: '#1f6feb', fun: '#7c3aed', other: '#9ca3af' }

  return (
    <div style={{ padding: '0 0 60px' }}>
      {/* Dark hero */}
      <div style={{ background: 'linear-gradient(160deg, #12294a 0%, #0b1a30 100%)', padding: '28px 32px', marginBottom: 0 }}>
        <div className="kicker" style={{ color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>Călătorie încheiată · {trip.destination?.toUpperCase()}</div>
        <div style={{ font: '800 36px/1.1 Archivo, sans-serif', letterSpacing: '-0.03em', color: '#fff', marginBottom: 8 }}>{trip.title}</div>
        <div style={{ font: '400 13px/1 Archivo, sans-serif', color: 'rgba(255,255,255,.5)', marginBottom: 20 }}>
          {trip.startDate ? new Date(trip.startDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' }) : ''}
          {trip.endDate ? ` – ${new Date(trip.endDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''} · {trip.members?.length || 0} prieteni
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" style={{ background: 'rgba(255,255,255,.1)', border: '1.5px solid rgba(255,255,255,.2)', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Salvează PDF
          </button>
          <button className="btn-secondary" style={{ background: 'rgba(255,255,255,.1)', border: '1.5px solid rgba(255,255,255,.2)', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Refolosește ca șablon
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '2px solid var(--border-strong)' }}>
        {[
          { label: 'Total', value: `${totalSpent.toLocaleString('ro-RO', { minimumFractionDigits: 0 })} €`, color: 'var(--ink)' },
          { label: 'Pe persoană', value: `${Math.round(perPerson).toLocaleString('ro-RO')} €`, color: 'var(--ink)' },
          { label: 'Sub buget cu', value: '— €', color: 'var(--teal-500)' },
          { label: 'Activități', value: String(activities.length || 0), color: 'var(--ink)' },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '20px 24px', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
            <div className="kicker" style={{ marginBottom: 8 }}>{s.label}</div>
            <div style={{ font: '800 28px/1 Archivo, sans-serif', color: s.color, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts + top voted */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* Bar chart */}
        <div style={{ padding: '24px 28px', borderRight: '1px solid var(--border)' }}>
          <div className="kicker" style={{ marginBottom: 16 }}>Cheltuieli pe categorii</div>
          {Object.keys(catTotals).length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nicio cheltuială.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(catTotals).sort((a,b) => b[1]-a[1]).map(([cat, amount]) => {
                const maxAmt = Math.max(...Object.values(catTotals))
                const pct = (amount / maxAmt) * 100
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 80, font: '400 12px/1 Archivo, sans-serif', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>{CAT_LABELS[cat] || cat}</div>
                    <div style={{ flex: 1, height: 28, background: 'var(--bg)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: CAT_COLORS[cat] || '#9ca3af', borderRadius: 'var(--r-sm)', transition: 'width .4s' }} />
                    </div>
                    <div style={{ font: '800 13px/1 Archivo, sans-serif', color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', width: 60, flexShrink: 0 }}>{amount.toFixed(0)} €</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top voted */}
        <div style={{ padding: '24px 28px' }}>
          <div className="kicker" style={{ marginBottom: 16 }}>Cel mai bine votate</div>
          {activities.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nicio activitate.</div>
          ) : (
            activities.slice(0, 5).map((a, i) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', marginBottom: 10 }}>
                <div style={{ font: '800 18px/1 Archivo, sans-serif', color: 'var(--text-faint)', width: 24, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '800 14px/1 Archivo, sans-serif', color: 'var(--ink)', marginBottom: 2 }}>{a.title}</div>
                  <div style={{ font: '400 12px/1 Archivo, sans-serif', color: 'var(--text-muted)' }}>activitate planificată</div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
            ))
          )}

          <div style={{ background: 'rgba(15,155,142,.08)', border: '1.5px solid rgba(15,155,142,.2)', borderRadius: 'var(--r-lg)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal-500)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <div style={{ font: '400 13px/1.5 Archivo, sans-serif', color: 'var(--teal-700)' }}>
              <b>Toate socotelile sunt închise.</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============ PAGE ============ */
function formatDateRangeShort(start, end) {
  if (!start) return ''
  const opts = { month: 'short', day: 'numeric' }
  const s = new Date(start).toLocaleDateString('ro-RO', opts)
  if (!end) return s
  const e = new Date(end).toLocaleDateString('ro-RO', { ...opts, year: 'numeric' })
  return `${s} – ${e}`
}

function TripDetail() {
  const { tripId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(s => s.auth.user)
  const { current: trip, currentStatus: status, currentError: error } = useSelector(s => s.trips)
  const { items: activities } = useSelector(s => s.activities)
  const { items: expenses } = useSelector(s => s.expenses)
  const [tab, setTab] = useState('itinerary')

  useEffect(() => { dispatch(fetchTripById(tripId)) }, [dispatch, tripId])

  if (!trip && status !== 'loading') {
    return (
      <>
        <AppRail user={user} activeTab={tab} onTabChange={setTab} />
        <div className="app-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>😕</div>
            <div style={{ font: '800 20px/1 Archivo, sans-serif', color: 'var(--ink)', marginBottom: 8 }}>Călătoria nu a fost găsită</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>{error || 'Nu ai acces la această călătorie.'}</div>
            <button className="btn-secondary" onClick={() => navigate('/')}>← Înapoi la călătorii</button>
          </div>
        </div>
      </>
    )
  }

  if (!trip) {
    return (
      <>
        <AppRail user={user} activeTab={tab} onTabChange={setTab} />
        <div className="app-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)', fontSize: 14 }}>
          Se încarcă…
        </div>
      </>
    )
  }

  const currentMember = trip.members.find(m => m.email === user?.email)
  const isAdmin = currentMember?.role === 'Admin'
  const currentUserId = currentMember?.userId
  const phase = tripPhase(trip.startDate, trip.endDate)

  const tabs = [
    { value: 'itinerary', label: 'Plan' },
    { value: 'expenses', label: 'Bani' },
    { value: 'chat', label: 'Chat' },
    { value: 'members', label: 'Prieteni' },
    { value: 'ai', label: '✦ Asistent' },
    ...(phase === 'Completed' ? [{ value: 'recap', label: 'Recapitulare' }] : []),
  ]

  return (
    <>
      <AppRail user={user} activeTab={tab} onTabChange={setTab} />
      <div className="app-content">
        {/* ---- Workspace header ---- */}
        <div className="workspace-header">
          <div className="workspace-breadcrumb">
            <Link to="/" style={{ color: 'inherit' }}>Călătorii</Link>
            {' / '}
            {trip.destination}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div className="workspace-title">{trip.title}</div>
              <div className="workspace-meta">
                <span className="workspace-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {formatDateRangeShort(trip.startDate, trip.endDate)}
                </span>
                <span className="workspace-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {trip.members?.length || 0} prieteni
                </span>
                <span className="workspace-meta-item" style={{ color: phase === 'Active' ? 'var(--teal-700)' : phase === 'Completed' ? 'var(--text-faint)' : 'var(--blue-700)' }}>
                  {phase === 'Active' ? '● ÎN DESFĂȘURARE' : phase === 'Upcoming' ? '↑ VIITOARE' : '✓ ÎNCHEIATĂ'}
                </span>
                {trip.budget > 0 && (
                  <span className="workspace-meta-item">
                    buget {new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 }).format(trip.budget)} {trip.currency}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 4 }}>
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setTab('members')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Invită
              </button>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setTab('itinerary')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Adaugă ceva
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="tab-bar">
            {tabs.map(({ value, label }) => (
              <button key={value} className={`tab-item ${tab === value ? 'active' : ''}`} onClick={() => setTab(value)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ---- Tab content ---- */}
        <div key={tab}>
          {tab === 'itinerary' && (
            <Itinerary
              tripId={trip.id} tripStartDate={trip.startDate} tripEndDate={trip.endDate}
              members={trip.members} currentUserEmail={user?.email} isAdmin={isAdmin}
              budget={trip.budget} currency={trip.currency}
            />
          )}
          {tab === 'expenses' && (
            <Expenses tripId={trip.id} members={trip.members} currentUserId={currentUserId} isAdmin={isAdmin} budget={trip.budget} currency={trip.currency} />
          )}
          {tab === 'members' && (
            <Members members={trip.members} currentUserEmail={user?.email} isAdmin={isAdmin} tripId={trip.id} />
          )}
          {tab === 'chat' && <Chat tripId={trip.id} currentUserId={currentUserId} members={trip.members} />}
          {tab === 'ai' && <AiChat tripId={trip.id} destination={trip.destination} members={trip.members} startDate={trip.startDate} endDate={trip.endDate} budget={trip.budget} currency={trip.currency} expenses={expenses} />}
          {tab === 'recap' && <Recap trip={trip} expenses={expenses} activities={activities} />}
        </div>
      </div>
    </>
  )
}

export default TripDetail
