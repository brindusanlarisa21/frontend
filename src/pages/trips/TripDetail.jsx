import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import * as signalR from '@microsoft/signalr'
import {
  House, CalendarDays, Wallet, MessageCircle, Users, Sparkles, ChartColumn,
  Landmark, UtensilsCrossed, BedDouble, Plane, Ticket, Bus, Pencil, Trash2,
  // Aliased: `Navigation` is also a DOM global, and the bare name resolves to
  // the browser interface, which throws when React calls it as a component.
  Navigation as NavigationIcon, Paperclip, FileText, MoreHorizontal,
} from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../features/auth/authSlice'
import {
  Button, IconButton, Input, Badge, Card, Avatar,
  TripCover, SegmentedControl, Icon, Chip, ActivityCard, DatePicker, ActivityMap, LocationSearch,
  BalanceHero, ExpenseRow, SettleUpRow,
} from '../../components/ds'
import { fetchTripById, updateTrip, addTripMember, removeTripMember, clearMemberActionError } from '../../features/trips/tripsSlice'
import { fetchActivities, createActivity, updateActivity, deleteActivity, clearActivityActionError } from '../../features/activities/activitiesSlice'
import { fetchExpenses, createExpense, updateExpense, deleteExpense, fetchBalances, settleDebt, createSettlement, clearExpenseActionError } from '../../features/expenses/expensesSlice'
import { fetchMessages, messageReceived, clearMessages } from '../../features/chat/chatSlice'
import { fetchProposals, createProposal, voteProposal, proposalReceived, proposalUpdated, clearProposals } from '../../features/proposals/proposalsSlice'
import {
  fetchInvite, createInvite,
  fetchChecklist, addChecklistItem, updateChecklistItem, deleteChecklistItem,
  fetchDocuments, addDocument, uploadDocument, updateDocument, deleteDocument,
} from '../../features/group/groupSlice'
import { apiRequest } from '../../api/client'
import { API_ORIGIN } from '../../api/config'
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
    fetch(`${API_ORIGIN}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setName(d.name ?? ''); setPaymentLink(d.paymentLink ?? '') })
  }, [open, token])

  const handleSave = async () => {
    setSaving(true)
    await fetch(`${API_ORIGIN}/api/users/me`, {
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

function AppRail({ user, activeTab, onTabChange, showRecap }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const railTabs = [
    { value: 'itinerary', label: 'Plan', icon: <CalendarDays size={21} strokeWidth={1.9} /> },
    { value: 'expenses', label: 'Bani', icon: <Wallet size={21} strokeWidth={1.9} /> },
    { value: 'chat', label: 'Chat', icon: <MessageCircle size={21} strokeWidth={1.9} /> },
    { value: 'members', label: 'Prieteni', icon: <Users size={21} strokeWidth={1.9} /> },
    { value: 'ai', label: 'Asistent', icon: <Sparkles size={21} strokeWidth={1.9} /> },
    // Only exists once the trip is over, so it lives here rather than in a second tab bar.
    ...(showRecap ? [{ value: 'recap', label: 'Recap', icon: <ChartColumn size={21} strokeWidth={1.9} /> }] : []),
  ]

  return (
    <nav className="app-rail">
      <div className="rail-logo">
        <Link to="/"><Logo size={32} /></Link>
      </div>
      <button className="rail-item" onClick={() => navigate('/')}>
        <House size={21} strokeWidth={1.9} />
        <span className="rail-item-label">Acasă</span>
      </button>
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

function ActivityForm({ onClose, onSubmit, submitting, error, defaultDate, initial }) {
  const start = initial?.startTime ? new Date(initial.startTime) : null
  const pad = (n) => String(n).padStart(2, '0')

  const [title, setTitle] = useState(initial?.title ?? '')
  const [place, setPlace] = useState(
    initial?.location ? { location: initial.location, latitude: initial.latitude, longitude: initial.longitude } : null,
  )
  const [category, setCategory] = useState(initial?.category?.toLowerCase() ?? 'sight')
  const [cost, setCost] = useState(initial?.cost != null ? String(initial.cost) : '')
  const [date, setDate] = useState(start ? start.toLocaleDateString('en-CA') : defaultDate)
  const [time, setTime] = useState(start ? `${pad(start.getHours())}:${pad(start.getMinutes())}` : '09:00')
  const [duration, setDuration] = useState(
    initial?.endTime ? String(Math.round((new Date(initial.endTime) - start) / 60000)) : '',
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !date || !time) return
    const startsAt = new Date(`${date}T${time}`)
    const minutes = duration.trim() ? Number(duration) : null
    onSubmit({
      title: title.trim(),
      description: null,
      category,
      cost: cost.trim() ? Number(cost) : null,
      startTime: startsAt.toISOString(),
      endTime: minutes ? new Date(startsAt.getTime() + minutes * 60000).toISOString() : null,
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

        <LocationSearch label="Loc" onSelect={setPlace} initialValue={initial?.location ?? ''} />

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

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
          <div>
            <label className="input-label">Data</label>
            <input className="input-field" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="input-label">Ora</label>
            <input className="input-field" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
          <div>
            <label className="input-label">Durată (minute)</label>
            <input className="input-field" type="number" min="0" step="15" placeholder="ex. 90" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Cost / persoană</label>
            <input className="input-field" type="number" min="0" step="0.01" placeholder="ex. 14" value={cost} onChange={(e) => setCost(e.target.value)} />
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

function ActivityModal({ open, onClose, onSubmit, submitting, error, defaultDate, initial }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{initial ? 'Editează activitatea' : 'Adaugă o activitate'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <ActivityForm
          key={initial?.id ?? defaultDate}
          onClose={onClose} onSubmit={onSubmit} submitting={submitting} error={error}
          defaultDate={defaultDate} initial={initial}
        />
      </div>
    </div>
  )
}

const CAT_UI = {
  sight:   { emoji: '🏛', Icon: Landmark,        bg: 'rgba(31,111,235,.12)',  color: '#1f6feb', stripe: '#1f6feb' },
  food:    { emoji: '🍽', Icon: UtensilsCrossed, bg: 'rgba(255,122,69,.12)',  color: '#ff7a45', stripe: '#ff7a45' },
  stay:    { emoji: '🛏', Icon: BedDouble,       bg: 'rgba(15,155,142,.12)',  color: '#0f9b8e', stripe: '#0f9b8e' },
  travel:  { emoji: '✈', Icon: Plane,           bg: 'rgba(31,111,235,.12)',  color: '#1f6feb', stripe: '#1f6feb' },
  fun:     { emoji: '🎟', Icon: Ticket,          bg: 'rgba(124,58,237,.12)',  color: '#7c3aed', stripe: '#7c3aed' },
  transit: { emoji: '🚌', Icon: Bus,             bg: 'rgba(156,163,175,.12)', color: '#6b7280', stripe: '#9ca3af' },
}

/**
 * Where to send someone who wants directions. Coordinates win when we have
 * them — a place name can be ambiguous — and the URL opens the native app on
 * a phone, the website on a desktop.
 */
function mapsUrl({ latitude, longitude, location }) {
  if (latitude != null && longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
  }
  if (location) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
  }
  return null
}

/** True when the document carries a file we can open, uploaded or linked. */
const hasFile = (doc) => Boolean(doc && (doc.originalFileName || doc.fileUrl))

/**
 * Opens a document in a new tab. Uploaded files sit behind the API's
 * membership check, so they need the token — which a plain <a href> cannot
 * carry. The tab is opened before the request so the browser still counts it
 * as a click and does not swallow it as a popup.
 */
async function openDocument(tripId, doc, token) {
  if (!doc.originalFileName) {
    if (doc.fileUrl) window.open(doc.fileUrl, '_blank', 'noopener')
    return
  }

  const tab = window.open('', '_blank')
  try {
    const res = await fetch(`${API_ORIGIN}/api/trips/${tripId}/documents/${doc.id}/file`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Fișierul nu a putut fi deschis.')
    const url = URL.createObjectURL(await res.blob())
    if (tab) tab.location = url
    else window.open(url, '_blank', 'noopener')
    // The tab holds its own reference by now; free ours after it has loaded.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    tab?.close()
    alert(err.message)
  }
}

function formatFileSize(bytes) {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** "45 min", "2 h", "1 h 30" — plainer than a raw minute count. */
function formatDuration(minutes) {
  const m = Math.round(minutes)
  if (m <= 0) return null
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest === 0 ? `${h} h` : `${h} h ${rest}`
}

function formatWeekRange({ from, to }) {
  const opts = { day: 'numeric', month: 'short' }
  const a = new Date(`${from}T00:00:00`).toLocaleDateString('ro-RO', opts)
  const b = new Date(`${to}T00:00:00`).toLocaleDateString('ro-RO', opts)
  return from === to ? a : `${a} – ${b}`
}

/** Groups a trip's days into weeks of seven, counted from the start date. */
function buildWeeks(dayKeys) {
  const weeks = []
  for (let i = 0; i < dayKeys.length; i += 7) {
    const days = dayKeys.slice(i, i + 7)
    weeks.push({ index: weeks.length + 1, days, from: days[0], to: days[days.length - 1] })
  }
  return weeks
}

function Itinerary({ tripId, tripStartDate, tripEndDate, members, currentUserEmail, isAdmin, currency = 'EUR' }) {
  const dispatch = useDispatch()
  const { items, status, error, actionStatus, actionError } = useSelector((state) => state.activities)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [selectedWeek, setSelectedWeek] = useState('all')
  // The activity a document is being attached to, from the timeline.
  const [attachTo, setAttachTo] = useState(null)
  const [attaching, setAttaching] = useState(false)
  const [attachError, setAttachError] = useState(null)
  // The activity whose document list popover is open, from the "⋯" menu.
  const [docsFor, setDocsFor] = useState(null)
  const { documents } = useSelector((state) => state.group)
  const token = useSelector((state) => state.auth.token)
  const currentUserId = members.find((m) => m.email === currentUserEmail)?.userId

  const dayRange = buildDayRange(tripStartDate, tripEndDate)

  useEffect(() => {
    dispatch(fetchActivities(tripId))
    // The timeline shows each activity's attached paper, so it needs the list
    // even though the documents tab is where they are managed.
    dispatch(fetchDocuments(tripId))
  }, [dispatch, tripId])

  // Every document belonging to an activity, not just one — an activity can
  // carry a boarding pass, a hotel voucher and a ticket at once.
  const docsByActivity = useMemo(() => {
    const map = new Map()
    for (const d of documents) {
      if (d.activityId == null) continue
      const list = map.get(d.activityId) ?? []
      list.push(d)
      map.set(d.activityId, list)
    }
    return map
  }, [documents])

  const handleAttach = async (doc) => {
    setAttaching(true)
    setAttachError(null)
    const result = doc.file
      ? await dispatch(uploadDocument({ tripId, ...doc }))
      : await dispatch(addDocument({ tripId, document: { ...doc, file: undefined } }))
    setAttaching(false)
    if (result.meta.requestStatus === 'fulfilled') setAttachTo(null)
    else setAttachError(result.payload ?? 'Documentul nu a putut fi salvat.')
  }

  // On phones there is no room for a side panel, so the map takes over the
  // main column instead of sitting under the timeline.
  const [showMap, setShowMap] = useState(false)

  const handleAdd = async (activity) => {
    dispatch(clearActivityActionError())
    const result = await dispatch(createActivity({ tripId, activity }))
    if (createActivity.fulfilled.match(result)) setModalOpen(false)
  }

  const handleEdit = async (activity) => {
    dispatch(clearActivityActionError())
    const result = await dispatch(updateActivity({ tripId, activityId: editing.id, activity }))
    if (updateActivity.fulfilled.match(result)) setEditing(null)
  }

  const handleDelete = async (activityId) => {
    setDeletingId(activityId)
    await dispatch(deleteActivity({ tripId, activityId }))
    setDeletingId(null)
  }

  const weeks = buildWeeks(dayRange)
  const visibleWeeks = selectedWeek === 'all' ? weeks : weeks.filter((w) => w.index === selectedWeek)
  const visibleDays = visibleWeeks.flatMap((w) => w.days)

  const visibleItems = items
    .filter((a) => visibleDays.includes(dayKey(a.startTime)))
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

  const totalCost = visibleItems.reduce((s, a) => s + (a.cost || 0), 0)
  const todayKey = dayKey(new Date().toISOString())

  // Today when there is something on, otherwise the next day that has anything —
  // before a trip starts, "today" is always empty and the panel would sit blank.
  const upcomingDay = (() => {
    const byDay = new Map()
    for (const a of items) {
      const key = dayKey(a.startTime)
      if (!byDay.has(key)) byDay.set(key, [])
      byDay.get(key).push(a)
    }
    if (byDay.has(todayKey)) return { key: todayKey, isToday: true, items: byDay.get(todayKey) }

    const next = [...byDay.keys()].filter((k) => k > todayKey).sort()[0]
    return next ? { key: next, isToday: false, items: byDay.get(next) } : null
  })()

  const todayItems = (upcomingDay?.items ?? [])
    .slice()
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

  return (
    <div className="split tall-main plan-split" style={{ '--side-w': '560px' }}>
      {/* ---- Main: week picker + timeline ---- */}
      <div className="split-main plan-main">
        {/* Week pills */}
        <div className="day-picker-wrap">
          <div className="day-picker">
            <button
              className={`day-pill week-pill${selectedWeek === 'all' ? ' active' : ''}`}
              onClick={() => setSelectedWeek('all')}
            >
              <span className="day-pill-wd">Toate</span>
              <span className="day-pill-d">{items.length}</span>
            </button>
            {weeks.map((w) => {
              const count = items.filter((a) => w.days.includes(dayKey(a.startTime))).length
              return (
                <button
                  key={w.index}
                  className={`day-pill week-pill${selectedWeek === w.index ? ' active' : ''}`}
                  onClick={() => setSelectedWeek(w.index)}
                >
                  <span className="day-pill-wd">Săpt. {w.index}</span>
                  <span className="day-pill-d">{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Heading */}
        <div className="day-section">
          <div className="day-heading">
            <span className="day-heading-title">
              {selectedWeek === 'all'
                ? 'Tot planul'
                : `Săptămâna ${selectedWeek}`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {visibleItems.length > 0 && (
                <span className="day-heading-meta">{visibleItems.length} PLANURI{totalCost > 0 ? ` · ${totalCost} € EST.` : ''}</span>
              )}
              <button
                className="btn-secondary mobile-only"
                style={{ fontSize: 12, padding: '7px 12px', alignItems: 'center', gap: 6 }}
                onClick={() => setShowMap((v) => !v)}
              >
                {showMap ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    Lista
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 0 0-8-8z"/></svg>
                    Harta
                  </>
                )}
              </button>
              <button className="btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => setModalOpen(true)}>
                + Adaugă
              </button>
            </div>
          </div>

          {/* Phone map view — replaces the timeline rather than sitting under it. */}
          {showMap && (
            <div className="mobile-only-block" style={{ padding: '16px 0 20px' }}>
              <ActivityMap activities={items} height={440} />
            </div>
          )}

          <div className={`tl-scroll${showMap ? ' hide-on-mobile' : ''}`}>
          {status === 'loading' && <div style={{ padding: '20px 0', color: 'var(--text-muted)', fontSize: 14 }}>Se încarcă…</div>}
          {status === 'failed' && <div className="auth-error" style={{ marginTop: 16 }}>{error}</div>}

          {status === 'succeeded' && visibleItems.length === 0 && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 14 }}>
                {selectedWeek === 'all'
                  ? 'Nicio activitate planificată încă.'
                  : `Nimic planificat în săptămâna ${selectedWeek}.`}
              </div>
              <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setModalOpen(true)}>+ Adaugă activitate</button>
            </div>
          )}

          {/* Vertical timeline, grouped by week and then by day */}
          {visibleWeeks.map((week) => (
            <section key={week.index} className="tl-week">
              <header className="tl-week-head">
                <span className="tl-week-title">Săptămâna {week.index}</span>
                <span className="tl-week-range">{formatWeekRange(week)}</span>
              </header>

              {week.days.map((dk) => {
                const ofDay = items
                  .filter((a) => dayKey(a.startTime) === dk)
                  .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                if (ofDay.length === 0) return null

                return (
                  <div key={dk} className="tl-day">
                    <div className={`tl-day-label${dk === todayKey ? ' is-today' : ''}`}>
                      {new Date(`${dk}T00:00:00`).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
                      {dk === todayKey && <span className="tl-today-badge">AZI</span>}
                    </div>

                    <ol className="tl">
                      {ofDay.map((a, i) => {
                        const cat = CAT_UI[a.category?.toLowerCase()] || CAT_UI.sight
                        const Icon = cat.Icon
                        const canEdit = isAdmin || a.createdByUserId === currentUserId
                        return (
                          <li key={a.id} className="tl-item">
                            <div className="tl-opposite">
                              <span className="tl-time">
                                {new Date(a.startTime).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {a.endTime && (
                                <span className="tl-duration">
                                  {formatDuration((new Date(a.endTime) - new Date(a.startTime)) / 60000)}
                                </span>
                              )}
                            </div>

                            <div className="tl-separator">
                              <span className="tl-dot" style={{ background: cat.bg, color: cat.color, borderColor: cat.stripe }}>
                                <Icon size={16} strokeWidth={2.1} />
                              </span>
                              {i < ofDay.length - 1 && <span className="tl-connector" />}
                            </div>

                            <div className="tl-content">
                              <div className="tl-card">
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div className="tl-title">{a.title}</div>
                                  <div className="tl-meta">
                                    {a.location && <span className="tl-place">{a.location}</span>}
                                    {a.cost != null && (
                                      <span style={{ color: cat.color, fontWeight: 800 }}>{a.cost} {currency} / pers</span>
                                    )}
                                  </div>
                                </div>
                                <div className="tl-actions">
                                  {mapsUrl(a) && (
                                    <a
                                      className="icon-btn-sm"
                                      href={mapsUrl(a)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={`Deschide ${a.location} în hărți`}
                                    >
                                      <NavigationIcon size={13} strokeWidth={2.2} />
                                    </a>
                                  )}
                                  <ActivityMenu
                                    activity={a}
                                    docs={docsByActivity.get(a.id) ?? []}
                                    canEdit={canEdit}
                                    deleting={deletingId === a.id}
                                    onEdit={() => setEditing(a)}
                                    onDelete={() => handleDelete(a.id)}
                                    onAddDocument={() => setAttachTo(a)}
                                    onViewDocuments={() => setDocsFor(a)}
                                  />
                                </div>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                )
              })}
            </section>
          ))}
          </div>
        </div>
      </div>

      {/* ---- Right panel: map + budget ---- */}
      <div className="split-side hide-on-mobile">
        <div className="panel-sticky" style={{ padding: 24 }}>
        {/* Map — renders its own framed box, so it must not sit in a centering flex wrapper */}
        <div style={{ marginBottom: 18 }}>
          <ActivityMap activities={items} height={300} />
        </div>

        {/* What is on today, regardless of which week the timeline shows */}
        {todayItems.length > 0 && (
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>
              {upcomingDay.isToday
                ? 'Ziua de azi'
                : `Urmează · ${new Date(`${upcomingDay.key}T00:00:00`).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'short' })}`}
            </div>
            {todayItems.slice(0, 4).map((a) => {
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
      </div>

      <ActivityModal
        open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAdd}
        submitting={actionStatus === 'loading'} error={actionError}
        defaultDate={dayRange[0]}
      />

      <ActivityModal
        open={editing !== null} onClose={() => setEditing(null)} onSubmit={handleEdit}
        submitting={actionStatus === 'loading'} error={actionError}
        defaultDate={dayRange[0]} initial={editing}
      />

      <AddDocumentModal
        open={attachTo !== null} onClose={() => { setAttachTo(null); setAttachError(null) }} onSubmit={handleAttach}
        submitting={attaching} error={attachError} members={members} activity={attachTo}
      />

      <ActivityDocsModal
        activity={docsFor}
        docs={docsFor ? (docsByActivity.get(docsFor.id) ?? []) : []}
        tripId={tripId} token={token}
        onClose={() => setDocsFor(null)}
        onAddAnother={() => { setAttachTo(docsFor); setDocsFor(null) }}
      />
    </div>
  )
}

/**
 * The "⋯" menu on a timeline row. Directions stay a bare icon beside it —
 * everyone can use them, so they are not worth a click to reveal — while
 * document and edit actions, which apply to fewer people or need a confirm,
 * live behind the menu instead of crowding the row with buttons.
 */
function ActivityMenu({ activity, docs, canEdit, deleting, onEdit, onDelete, onAddDocument, onViewDocuments }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const withClose = (fn) => () => { setOpen(false); fn() }

  return (
    <div className="activity-menu" ref={ref}>
      <button className="icon-btn-sm" title="Mai multe" onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal size={15} strokeWidth={2.2} />
      </button>
      {open && (
        <div className="activity-menu-dropdown" role="menu">
          <button className="activity-menu-item" onClick={withClose(onViewDocuments)}>
            <FileText size={14} strokeWidth={2.2} />
            Documente{docs.length > 0 && <span className="activity-menu-count">{docs.length}</span>}
          </button>
          <button className="activity-menu-item" onClick={withClose(onAddDocument)}>
            <Paperclip size={14} strokeWidth={2.2} />
            Adaugă document
          </button>
          {canEdit && (
            <>
              <div className="activity-menu-sep" />
              <button className="activity-menu-item" onClick={withClose(onEdit)}>
                <Pencil size={14} strokeWidth={2.2} />
                Editează
              </button>
              <button className="activity-menu-item activity-menu-danger" disabled={deleting} onClick={withClose(onDelete)}>
                <Trash2 size={14} strokeWidth={2.2} />
                {deleting ? 'Se șterge…' : 'Șterge'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** All documents attached to one activity, opened from the timeline's "⋯" menu. */
function ActivityDocsModal({ activity, docs, tripId, token, onClose, onAddAnother }) {
  const dispatch = useDispatch()
  if (!activity) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Documente · {activity.title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {docs.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Niciun document atașat încă.</div>
          )}
          {docs.map((doc) => {
            const ui = DOC_KIND_UI[doc.kind] || DOC_KIND_UI.other
            return (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--r-lg)', background: 'var(--surface-solid)', border: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: 'var(--blue-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                  {ui.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0, font: '800 13px/1.3 Archivo, sans-serif', color: 'var(--ink)' }}>{doc.title}</div>
                {hasFile(doc) && (
                  <button className="icon-btn-sm" title="Deschide" style={{ flexShrink: 0 }} onClick={() => openDocument(tripId, doc, token)}>
                    <FileText size={13} strokeWidth={2.2} />
                  </button>
                )}
                <button className="icon-btn-sm" title="Șterge" style={{ flexShrink: 0 }} onClick={() => dispatch(deleteDocument({ tripId, documentId: doc.id }))}>
                  <Trash2 size={13} strokeWidth={2.2} />
                </button>
              </div>
            )
          })}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Închide</button>
          <button type="button" className="btn-primary" onClick={onAddAnother}>Adaugă un document</button>
        </div>
      </div>
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

// Keys match TripSplit.Common.Enums.ExpenseCategory exactly (lowercased) — the
// server does Enum.TryParse on this string and rejects anything that isn't
// one of its six names, so a UI label that doesn't map to one silently fails
// every expense filed under it.
const EXPENSE_CAT_UI = {
  food:    { label: 'Mâncare',      emoji: '🍽', bg: 'rgba(255,122,69,.12)', color: 'var(--orange-500)' },
  stay:    { label: 'Cazare',       emoji: '🛏', bg: 'rgba(15,155,142,.10)', color: 'var(--teal-500)' },
  travel:  { label: 'Călătorie',    emoji: '✈',  bg: 'rgba(31,111,235,.10)', color: 'var(--blue-500)' },
  transit: { label: 'Transport local', emoji: '🚗', bg: 'rgba(31,111,235,.10)', color: 'var(--blue-500)' },
  fun:     { label: 'Distracție',   emoji: '🎟', bg: 'rgba(124,58,237,.10)', color: '#7c3aed' },
  shop:    { label: 'Cumpărături',  emoji: '🛍', bg: 'rgba(156,163,175,.12)', color: '#6b7280' },
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

function ExpenseForm({ onClose, onSubmit, submitting, error, members, initial, currency = 'EUR' }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '')
  const [expCurrency, setExpCurrency] = useState(initial?.currency ?? currency)
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
    onSubmit({ title: title.trim(), amount: parseFloat(amount), currency: expCurrency, category, paidByUserId: parseInt(paidByUserId, 10), splitAmong: [...splitAmong].map(Number) })
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
              {/* Each expense keeps its own currency — the trip's currency is only
                  the default a new one starts with. Balances net per currency,
                  never converting, so this choice sticks with the expense. */}
              <select className="input-field" value={expCurrency} onChange={e => setExpCurrency(e.target.value)} style={{ width: 82, cursor: 'pointer', paddingLeft: 8 }}>
                <option>EUR</option><option>RON</option><option>USD</option><option>GBP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cine a plătit + Categorie */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
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

function ExpenseModal({ open, onClose, onSubmit, submitting, error, members, initial, currency = 'EUR' }) {
  if (!open) return null
  const isEdit = Boolean(initial?.id)
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Editează cheltuiala' : 'Adaugă o cheltuială'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <ExpenseForm key={open ? (initial?.id ?? 'new') : 'closed'} onClose={onClose} onSubmit={onSubmit} submitting={submitting} error={error} members={members} initial={initial} currency={currency} />
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

/** True while the layout is in its stacked, phone/tablet form. */
function useIsMobileLayout() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)')
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isMobile
}

/**
 * A titled section that collapses on the stacked layout, where everything
 * competes for one column. On desktop it is just a heading plus its content.
 */
function CollapsibleSection({ title, actions, defaultOpen = true, open: openProp, onToggle, className = '', children }) {
  const isMobile = useIsMobileLayout()
  const [openState, setOpenState] = useState(defaultOpen)
  // Controlled when a parent coordinates several sections, uncontrolled otherwise.
  const controlled = openProp !== undefined
  const open = controlled ? openProp : openState
  const toggle = () => (controlled ? onToggle?.(!open) : setOpenState((v) => !v))
  const expanded = !isMobile || open

  return (
    <div className={`${isMobile ? 'section-card' : ''} ${className}`.trim()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: expanded ? 16 : 0 }}>
        {isMobile ? (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer' }}
          >
            <span className="kicker">{title}</span>
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 140ms' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        ) : (
          <div className="kicker">{title}</div>
        )}
        {actions && expanded && <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>{actions}</div>}
      </div>
      {expanded && children}
    </div>
  )
}

/**
 * The creditor's side of a debt. Paying and requesting are different actions:
 * here you nudge the other person and confirm receipt — you never "pay".
 */
function RequestModal({ open, debt, submitting, onClose, onConfirmReceived }) {
  const [copied, setCopied] = useState(false)
  if (!open || !debt) return null

  const amount = `${Number(debt.amount).toFixed(2)} ${debt.currency}`
  const myLink = debt.toPaymentLink

  const reminder = myLink
    ? `Salut! Mai ai de decontat ${amount} din călătorie. Poți trimite aici: ${myLink}`
    : `Salut! Mai ai de decontat ${amount} din călătorie.`

  const copyReminder = () => {
    navigator.clipboard?.writeText(reminder).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <span className="modal-title">Cere de la {debt.fromName}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <div style={{ font: '400 13px/1 Archivo, sans-serif', color: 'var(--text-muted)', marginBottom: 6 }}>
              <b style={{ color: 'var(--ink)' }}>{debt.fromName}</b> îți datorează
            </div>
            <div style={{ font: '800 28px/1 Archivo, sans-serif', letterSpacing: '-0.02em', color: 'var(--teal-500)', fontVariantNumeric: 'tabular-nums' }}>
              {amount}
            </div>
          </div>

          <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-sm)', padding: '10px 14px', font: '400 13px/1.5 Archivo, sans-serif', color: 'var(--text-body)', border: '1px solid var(--border)' }}>
            {reminder}
          </div>

          {!myLink && (
            <div style={{ font: '400 12px/1.5 Archivo, sans-serif', color: 'var(--text-muted)' }}>
              Nu ai un link de plată setat. Adaugă unul în profil ca să primești banii mai ușor.
            </div>
          )}

          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={copyReminder}>
            {copied ? '✓ Copiat' : 'Copiază mesajul de reamintire'}
          </button>

          <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting} onClick={onConfirmReceived}>
            {submitting ? 'Se marchează…' : 'Am primit banii — marchează'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Expenses({ tripId, members, currentUserId, isAdmin, currency = 'EUR' }) {
  const dispatch = useDispatch()
  const { items, status, error, balances, actionStatus, actionError } = useSelector(s => s.expenses)
  const [modal, setModal] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [settleModal, setSettleModal] = useState(null)
  const [requestModal, setRequestModal] = useState(null)
  const [filter, setFilter] = useState('all') // all | mine | unsplit
  // On phones the two sections behave as an accordion: opening one closes the other.
  const [openSection, setOpenSection] = useState('expenses')
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

  const openRequestModal = (d) => {
    dispatch(clearExpenseActionError())
    setRequestModal({ fromUserId: d.fromUserId, toUserId: d.toUserId, fromName: d.fromName, toName: d.toName, amount: d.amount, currency: d.currency ?? 'EUR', toPaymentLink: d.toPaymentLink ?? null })
  }

  const settleDebtOf = async (debt, close) => {
    if (!debt) return
    const result = await dispatch(createSettlement({ tripId, fromUserId: debt.fromUserId, toUserId: debt.toUserId, amount: debt.amount, method: 'Cash', currency: debt.currency ?? currency }))
    if (createSettlement.fulfilled.match(result)) {
      close(); setActiveSettle(null)
      dispatch(fetchExpenses(tripId)); dispatch(fetchBalances(tripId))
    }
  }

  const handleSettle = () => settleDebtOf(settleModal, () => setSettleModal(null))
  const handleConfirmReceived = () => settleDebtOf(requestModal, () => setRequestModal(null))

  const debts = balances?.debts ?? []
  // Sorted by the backend so the currency with the biggest open balance
  // leads — usually the only one that matters, on a single-currency trip.
  const byCurrency = balances?.byCurrency ?? []
  const primaryBalance = byCurrency[0] ?? { currency, net: 0, youOwe: 0, youAreOwed: 0 }
  const totalsByCurrency = items.reduce((acc, e) => {
    const c = e.currency || currency
    acc[c] = (acc[c] || 0) + (e.amount || 0)
    return acc
  }, {})

  const filteredItems = items.filter(exp => {
    if (filter !== 'mine') return true
    // The server already says whether this is yours; fall back to the id only
    // when the flag is missing, since a client-derived id can be undefined.
    return typeof exp.youPaid === 'boolean'
      ? exp.youPaid
      : exp.paidByUserId === currentUserId
  })

  const editInitial = modal?.mode === 'edit' ? {
    id: modal.expense.id, title: modal.expense.title, amount: modal.expense.amount,
    category: modal.expense.category, paidByUserId: modal.expense.paidByUserId,
    currency: modal.expense.currency ?? currency,
    // Falls back to everyone only if an older cached expense has no split
    // list yet — a real one always comes back from the server now.
    splitAmong: modal.expense.splitAmong ?? members.map(m => m.userId),
  } : null

  return (
    <div className="split money-split" style={{ '--side-w': '420px' }}>
      {/* ---- Main column ---- */}
      <div className="split-main tall-main money-main" style={{ padding: '22px 28px' }}>

        {/* Sold — the number that matters most, so it leads the page. Nothing
            converts between currencies, so a trip with more than one shows a
            balance per currency instead of one number that would quietly mix
            them. */}
        <div className="balance-hero-card" style={{ marginBottom: 18 }}>
          <div className="balance-hero-kicker">Soldul tău{byCurrency.length > 1 ? ` · ${primaryBalance.currency}` : ''}</div>
          <div className="balance-hero-amount" style={{ color: primaryBalance.net >= 0 ? '#fff' : '#fca5a5' }}>
            {primaryBalance.net >= 0 ? '+' : ''}{Number(primaryBalance.net).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {primaryBalance.currency}
          </div>
          <div className="balance-hero-sub">
            {primaryBalance.net > 0 ? `Ai de primit de la ${debts.filter(d => d.toUserId === currentUserId && d.currency === primaryBalance.currency).length} prieteni`
              : primaryBalance.net < 0 ? 'Datorezi bani'
              : 'Ești la egal'}
          </div>
          {byCurrency.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.14)' }}>
              {byCurrency.slice(1).map(b => (
                <div key={b.currency} style={{ display: 'flex', justifyContent: 'space-between', font: '700 13px/1 Archivo, sans-serif', color: 'rgba(255,255,255,.75)' }}>
                  <span>{b.currency}</span>
                  <span style={{ color: b.net >= 0 ? '#fff' : '#fca5a5' }}>
                    {b.net >= 0 ? '+' : ''}{Number(b.net).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {b.currency}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        <div style={{ background: 'var(--surface-solid)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '14px 16px', boxShadow: 'var(--shadow-card)', marginBottom: 24 }}>
          <div className="kicker" style={{ marginBottom: 6 }}>Total cheltuit</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(totalsByCurrency).length === 0 ? (
              <div style={{ font: '800 22px/1 Archivo, sans-serif', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>
                0,00 {currency}
              </div>
            ) : Object.entries(totalsByCurrency).map(([c, sum]) => (
              <div key={c} style={{ font: '800 22px/1 Archivo, sans-serif', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>
                {sum.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {c}
              </div>
            ))}
          </div>
        </div>

        <CollapsibleSection
          title={`Cheltuieli · ${filteredItems.length}`}
          className="expenses-section"
          open={openSection === 'expenses'}
          onToggle={(next) => setOpenSection(next ? 'expenses' : null)}
          actions={
            <>
              <div style={{ display: 'flex', background: 'rgba(18,41,74,.07)', borderRadius: 999, padding: 3, gap: 2 }}>
                {[['all','Toate'],['mine','Ale mele']].map(([v,l]) => (
                  <button key={v} onClick={() => setFilter(v)} style={{ padding: '5px 12px', borderRadius: 999, border: 'none', background: filter === v ? '#fff' : 'none', color: filter === v ? 'var(--ink)' : 'var(--text-muted)', font: `${filter === v ? 800 : 400} 12px/1 Archivo, sans-serif`, cursor: 'pointer', boxShadow: filter === v ? '0 1px 3px rgba(11,26,48,.1)' : 'none' }}>{l}</button>
                ))}
              </div>
              <button className="btn-primary" onClick={openAdd} style={{ fontSize: 13, whiteSpace: 'nowrap' }}>+ Adaugă</button>
            </>
          }
        >

        <div className="expense-scroll">
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
        </CollapsibleSection>
      </div>

      {/* ---- Right panel — docks to the bottom of the screen on phones ---- */}
      <div className="split-side settle-dock">
        <div className="panel-sticky" style={{ padding: '22px 20px' }}>
        {/* Decontare — collapsed by default on phones so the list stays in view */}
        {debts.length > 0 && (
          <CollapsibleSection
            title={`Decontare · ${debts.length} transferuri`}
            open={openSection === 'settle'}
            onToggle={(next) => setOpenSection(next ? 'settle' : null)}
          >
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
                    {isMe && (
                      <button className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => setActiveSettle(isExpanded ? null : `${d.fromUserId}-${d.toUserId}`)}>
                        Plătește
                      </button>
                    )}
                    {isMeRecv && (
                      <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => openRequestModal(d)}>
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
          </CollapsibleSection>
        )}

        {debts.length === 0 && balances && (
          <div style={{ background: 'rgba(15,155,142,.08)', borderRadius: 'var(--r-md)', padding: '12px 14px', border: '1px solid rgba(15,155,142,.2)', font: '400 13px/1.5 Archivo, sans-serif', color: 'var(--teal-700)' }}>
            ✓ Toate socotelile sunt închise!
          </div>
        )}
        </div>
      </div>

      <ExpenseModal open={modal !== null} onClose={() => setModal(null)} onSubmit={modal?.mode === 'edit' ? handleEdit : handleAdd} submitting={actionStatus === 'loading'} error={actionError} members={members} initial={editInitial} currency={currency} />
      <SettleModal open={settleModal !== null} debt={settleModal} submitting={actionStatus === 'loading'} onClose={() => setSettleModal(null)} onSettle={handleSettle} />
      <RequestModal open={requestModal !== null} debt={requestModal} submitting={actionStatus === 'loading'} onClose={() => setRequestModal(null)} onConfirmReceived={handleConfirmReceived} />
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

// Order must match the backend ActivityCategory enum — the index is sent as the category.
const PROPOSAL_CAT_LABELS = ['Obiectiv', 'Mâncare', 'Cazare', 'Drum', 'Distracție', 'Transport']
const ACTIVITY_CAT_ORDER = ['sight', 'food', 'stay', 'travel', 'fun', 'transit']

function Chat({ tripId, currentUserId, members }) {
  const dispatch = useDispatch()
  const { token } = useSelector((s) => s.auth)
  const { messages, status } = useSelector((s) => s.chat)
  const { items: proposals } = useSelector((s) => s.proposals)
  const [text, setText] = useState('')
  const [connected, setConnected] = useState(false)
  const connectionRef = useRef(null)
  const feedRef = useRef(null)

  // Proposal form — opened from the calendar button in the composer
  const [propOpen, setPropOpen] = useState(false)
  const [propForm, setPropForm] = useState({ title: '', location: '', startDate: '', startTime: '', endTime: '', category: 0, cost: '' })
  const [propSubmitting, setPropSubmitting] = useState(false)
  const [propError, setPropError] = useState(null)
  const setProp = (k, v) => setPropForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    let cancelled = false
    dispatch(fetchMessages(tripId))
    dispatch(fetchProposals(tripId))

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_ORIGIN}/hubs/chat`, { accessTokenFactory: () => token })
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
      setPropOpen(false)
    } else {
      setPropError(result.payload ?? 'Eroare la trimitere')
    }
  }

  const feed = [
    ...messages.map((m) => ({ ...m, _type: 'message', _time: new Date(m.sentAt) })),
    ...proposals.map((p) => ({ ...p, _type: 'proposal', _time: new Date(p.createdAt) })),
  ].sort((a, b) => a._time - b._time)

  // Pin the feed to the newest entry — proposals count too, not just messages.
  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [feed.length])

  const MEMBER_COLORS = ['#1f6feb','#0f9b8e','#ff7a45','#7c3aed','#e2564a','#0b6f66']
  const memberColor = (name) => MEMBER_COLORS[(name?.charCodeAt(0) ?? 0) % MEMBER_COLORS.length]

  return (
    <>
      {/* ---- Chat feed — only the messages scroll, so the composer stays put ---- */}
      <div className="chat-pane">
        {/* Messages */}
        <div ref={feedRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                <div key={`prop-${item.id}`} className="proposal-card" style={{ background: 'var(--surface-solid)', border: '1.5px solid rgba(31,111,235,.3)', borderRadius: 'var(--r-lg)', padding: '12px 14px', margin: '6px 0 6px 36px', boxShadow: 'var(--shadow-blue)', width: '100%', maxWidth: 380, alignSelf: 'flex-start' }}>
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

        </div>

        {/* Input bar */}
        <div className="chat-input-bar">
          <button className="chat-propose-btn" title="Propune o activitate la vot" onClick={() => setPropOpen(true)} style={{ flexShrink: 0 }}>
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

      {/* ---- Proposal form, opened from the calendar button in the composer ---- */}
      {propOpen && (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPropOpen(false)}>
        <div className="modal-box">
          <div className="modal-header">
            <span className="modal-title">Propunere nouă</span>
            <button onClick={() => setPropOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
          </div>

        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8 }}>
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
        </div>

          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn-secondary" onClick={() => setPropOpen(false)}>Renunț</button>
            <button className="btn-primary" disabled={propSubmitting || !propForm.title} onClick={handlePropSubmit}>
              {propSubmitting ? 'Se trimite…' : 'Trimite la vot'}
            </button>
          </div>
        </div>
      </div>
      )}
    </>
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

/**
 * Used both from the documents list and from an activity on the timeline. When
 * `activity` is given the document is tied to it and the picker is hidden —
 * there is only one answer, and offering it as a choice invites getting it wrong.
 */
function AddDocumentModal({ open, onClose, onSubmit, submitting, error, members, activities = [], activity = null, initial = null, onAddAnother = null, presetActivityId = null }) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('flight')
  const [note, setNote] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [file, setFile] = useState(null)
  const [expiresAt, setExpiresAt] = useState('')
  const [ownerUserId, setOwnerUserId] = useState('')
  const [activityId, setActivityId] = useState('')

  // A fresh open starts blank, and an attach-to-activity open starts with that
  // activity's name so the common case needs no typing.
  useEffect(() => {
    if (!open) return
    setTitle(initial?.title ?? activity?.title ?? '')
    setKind(initial?.kind ?? 'flight')
    setNote(initial?.note ?? '')
    setFileUrl(initial?.originalFileName ? '' : (initial?.fileUrl ?? ''))
    setFile(null)
    setExpiresAt(initial?.expiresAt ? initial.expiresAt.slice(0, 10) : '')
    setOwnerUserId(initial?.ownerUserId ? String(initial.ownerUserId) : '')
    setActivityId(initial?.activityId ? String(initial.activityId) : (presetActivityId ? String(presetActivityId) : ''))
  }, [open, activity, initial, presetActivityId])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      kind,
      note: note.trim() || null,
      fileUrl: fileUrl.trim() || null,
      file,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      ownerUserId: ownerUserId ? Number(ownerUserId) : null,
      activityId: activity ? activity.id : (activityId ? Number(activityId) : null),
    })
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-box-tall">
        <div className="modal-header">
          <span className="modal-title">
            {initial ? 'Editează documentul'
              : activity ? `Document pentru „${activity.title}”`
              : 'Adaugă un document'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-form-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

            {initial?.originalFileName ? (
              <div style={{ font: "400 12px/1.4 Archivo, sans-serif", color: 'var(--text-faint)' }}>
                Fișier atașat: {initial.originalFileName} · {formatFileSize(initial.sizeBytes)}
              </div>
            ) : (
            <div>
              <label className="input-label">Atașament (PDF, imagine, orice — max 10 MB)</label>
              <input
                className="input-field"
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.heic,.webp,.txt"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                style={{ padding: 8, cursor: 'pointer' }}
              />
              {file && (
                <div style={{ marginTop: 6, font: "400 12px/1.3 Archivo, sans-serif", color: 'var(--text-faint)' }}>
                  {file.name} · {formatFileSize(file.size)}
                </div>
              )}
            </div>
            )}

            {!file && !initial?.originalFileName && (
              <div>
                <label className="input-label">Sau un link către fișier (opțional)</label>
                <input className="input-field" type="url" placeholder="https://…" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
              </div>
            )}

            {!activity && activities.length > 0 && (
              <div>
                <label className="input-label">Legat de o activitate (opțional)</label>
                <select className="input-field" value={activityId} onChange={(e) => setActivityId(e.target.value)} style={{ cursor: 'pointer' }}>
                  <option value="">Fără activitate</option>
                  {activities.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
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
          <div className="modal-actions">
            {initial?.activityId != null && onAddAnother && (
              <button type="button" className="btn-secondary" style={{ marginRight: 'auto' }} onClick={onAddAnother}>
                + Alt document pentru aceeași activitate
              </button>
            )}
            {error && <div className="auth-error" style={{ flex: 1, margin: 0 }}>{error}</div>}
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
  // Phones show these three as an accordion, like the money tab.
  const [openSection, setOpenSection] = useState('members')
  const [editingDoc, setEditingDoc] = useState(null)
  const [presetActivityId, setPresetActivityId] = useState(null)
  const [docSubmitting, setDocSubmitting] = useState(false)
  const [docError, setDocError] = useState(null)
  const token = useSelector((state) => state.auth.token)
  const activities = useSelector((state) => state.activities.items)
  const currentUserId = members.find((m) => m.email === currentUserEmail)?.userId

  useEffect(() => {
    dispatch(fetchInvite(tripId))
    dispatch(fetchChecklist(tripId))
    dispatch(fetchDocuments(tripId))
    // Needed for the "belongs to activity" picker in the document form.
    dispatch(fetchActivities(tripId))
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

  // Only what concerns you: shared items and the ones assigned to you. Someone
  // else's packing list is noise on a screen this small.
  const myChecklist = checklist.filter(
    (c) => c.assignedUserId == null || c.assignedUserId === currentUserId,
  )
  const doneCount = myChecklist.filter((c) => c.done).length

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
    <div className="split tall-main members-split" style={{ '--side-w': 'minmax(0, 1fr)' }}>
      {/* ---- Left: members ---- */}
      <div className="split-main members-main" style={{ padding: '22px 24px' }}>
        <CollapsibleSection
          title={`Prieteni · ${members.length}`}
          className="members-section members-section-first"
          open={openSection === 'members'}
          onToggle={(next) => setOpenSection(next ? 'members' : null)}
          actions={
            <button className="btn-primary" style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => { dispatch(clearMemberActionError()); setModalOpen(true) }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Invită
            </button>
          }
        >

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
        <div className="pane-scroll">
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
        </div>
        {memberActionError && <div className="auth-error" style={{ marginTop: 12 }}>{memberActionError}</div>}
        </CollapsibleSection>
      </div>

      {/* ---- Right: documents + checklist, each a fixed-height pane that scrolls on its own ---- */}
      <div className="split-side stack-panes" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <CollapsibleSection
        title={`Documente · ${documents.length}`}
        className="members-section"
        open={openSection === 'documents'}
        onToggle={(next) => setOpenSection(next ? 'documents' : null)}
        actions={
          <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => setDocModalOpen(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Adaugă
          </button>
        }
      >
        <div className="pane-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
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
            doc.activityTitle ? `pentru ${doc.activityTitle}` : null,
            doc.originalFileName ? `${doc.originalFileName} · ${formatFileSize(doc.sizeBytes)}` : null,
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
              {hasFile(doc) && (
                <button className="icon-btn-sm" title="Deschide" style={{ flexShrink: 0 }} onClick={() => openDocument(tripId, doc, token)}>
                  <FileText size={13} strokeWidth={2.2} />
                </button>
              )}
              <button className="icon-btn-sm" title="Editează" style={{ flexShrink: 0 }} onClick={() => setEditingDoc(doc)}>
                <Pencil size={13} strokeWidth={2.2} />
              </button>
              <button className="icon-btn-sm" title="Șterge" style={{ flexShrink: 0 }} onClick={() => dispatch(deleteDocument({ tripId, documentId: doc.id }))}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          )
        })}
        </div>
      </CollapsibleSection>

        {/* Checklist */}
        <CollapsibleSection
          title={`Checklist · ${doneCount} din ${myChecklist.length}`}
          className="members-section members-section-last"
          open={openSection === 'checklist'}
          onToggle={(next) => setOpenSection(next ? 'checklist' : null)}
        >
          <form onSubmit={handleAddTask} style={{ display: 'flex', gap: 8, marginBottom: 14, flexShrink: 0 }}>
            <input
              className="input-field" placeholder="Adaugă ceva de pus în bagaj sau de rezolvat…"
              value={newTask} onChange={(e) => setNewTask(e.target.value)} style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} disabled={!newTask.trim()}>
              Adaugă
            </button>
          </form>

          <div className="pane-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
          {myChecklist.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Niciun element în checklist. Adaugă bagaje comune sau personale.
            </div>
          ) : myChecklist.map((c) => (
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
                onChange={(e) => dispatch(updateChecklistItem({
                  tripId, itemId: c.id,
                  changes: e.target.value
                    ? { assignedUserId: Number(e.target.value) }
                    : { unassign: true },
                }))}
                style={{ border: 'none', background: 'none', font: '800 11px/1 Archivo, sans-serif', color: 'var(--text-muted)', cursor: 'pointer', maxWidth: 100 }}
              >
                <option value="">Toți</option>
                {members.map((m) => <option key={m.userId} value={m.userId}>{m.name.split(' ')[0]}</option>)}
              </select>
              <button className="icon-btn-sm" title="Șterge" style={{ flexShrink: 0 }} onClick={() => dispatch(deleteChecklistItem({ tripId, itemId: c.id }))}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              </button>
            </div>
          ))}
          </div>
        </CollapsibleSection>
      </div>

      <InviteMemberModal
        open={modalOpen} onClose={() => setModalOpen(false)} onInvite={handleInvite}
        submitting={memberActionStatus === 'loading'} error={memberActionError}
        members={members}
      />

      <AddDocumentModal
        open={docModalOpen} onClose={() => { setDocModalOpen(false); setDocError(null); setPresetActivityId(null) }} members={members}
        activities={activities} submitting={docSubmitting} error={docError} presetActivityId={presetActivityId}
        onSubmit={async (document) => {
          setDocSubmitting(true)
          setDocError(null)
          const result = document.file
            ? await dispatch(uploadDocument({ tripId, ...document }))
            : await dispatch(addDocument({ tripId, document: { ...document, file: undefined } }))
          setDocSubmitting(false)
          if (result.meta.requestStatus === 'fulfilled') setDocModalOpen(false)
          else setDocError(result.payload ?? 'Documentul nu a putut fi salvat.')
        }}
      />

      <AddDocumentModal
        open={editingDoc !== null} onClose={() => { setEditingDoc(null); setDocError(null) }} members={members}
        activities={activities} initial={editingDoc} submitting={docSubmitting} error={docError}
        onAddAnother={() => {
          setPresetActivityId(editingDoc.activityId)
          setEditingDoc(null)
          setDocError(null)
          setDocModalOpen(true)
        }}
        onSubmit={async (document) => {
          setDocSubmitting(true)
          setDocError(null)
          const result = await dispatch(updateDocument({
            tripId, documentId: editingDoc.id, document: { ...document, file: undefined },
          }))
          setDocSubmitting(false)
          if (result.meta.requestStatus === 'fulfilled') setEditingDoc(null)
          else setDocError(result.payload ?? 'Documentul nu a putut fi salvat.')
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

/**
 * The assistant appends a ```plan JSON block when its answer contains a concrete
 * schedule. Pull it out so the prose renders clean and the items become actions.
 */
function extractAiPlan(reply) {
  const match = reply?.match(/```plan\s*([\s\S]*?)```/i)
  if (!match) return { text: reply, plan: null }

  const text = reply.replace(match[0], '').trim()
  try {
    const parsed = JSON.parse(match[1].trim())
    const cleanItems = (list) =>
      Array.isArray(list) ? list.filter((i) => i?.title && i?.time) : []

    const topLevelItems = cleanItems(parsed.items)

    const tiers = (Array.isArray(parsed.tiers) ? parsed.tiers : [])
      .filter((t) => t?.level && t?.amount != null)
      .map((t) => ({
        level: String(t.level).toLowerCase(),
        amount: t.amount,
        summary: t.summary,
        items: cleanItems(t.items),
      }))

    const perTier = tiers.filter((t) => t.items.length > 0)

    // Every tier brought its own schedule — picking one swaps the plan below.
    if (perTier.length === tiers.length && perTier.length > 0) {
      return { text, plan: { day: parsed.day, tiers: perTier, perTierItems: true } }
    }

    if (topLevelItems.length === 0) {
      return perTier.length > 0
        ? { text, plan: { day: parsed.day, tiers: perTier, perTierItems: true } }
        : { text, plan: null }
    }

    // Older replies carried one shared schedule; show the tiers as prices only.
    return {
      text,
      plan: { day: parsed.day, tiers, items: topLevelItems, perTierItems: false },
    }
  } catch {
    // A malformed block should never break the answer.
    return { text, plan: null }
  }
}

const TIER_UI = {
  economic: { label: 'Economic', accent: 'var(--teal-700)', border: 'var(--border)' },
  mediu:    { label: 'Mediu · Recomandat', accent: 'var(--blue-700)', border: 'var(--blue-500)' },
  premium:  { label: 'Premium', accent: 'var(--orange-500)', border: 'rgba(255,122,69,.45)' },
}

function AiTierCards({ tiers, currency, selected, onSelect }) {
  const selectable = typeof onSelect === 'function'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tiers.length}, 1fr)`, gap: 12, marginLeft: 42, marginTop: 4 }}>
      {tiers.map((t) => {
        const ui = TIER_UI[t.level] || TIER_UI.economic
        // Without per-tier schedules there is nothing to switch, so highlight the
        // recommended one instead of pretending the cards are a picker.
        const active = selectable ? t.level === selected : t.level === 'mediu'
        return (
          <button
            key={t.level}
            type="button"
            disabled={!selectable}
            onClick={selectable ? () => onSelect(t.level) : undefined}
            aria-pressed={selectable ? active : undefined}
            style={{
              textAlign: 'left', cursor: selectable ? 'pointer' : 'default',
              padding: '14px 16px', borderRadius: 'var(--r-lg)',
              border: `${active ? 2 : 1}px solid ${active ? ui.border : 'var(--border)'}`,
              background: active ? 'var(--surface-solid)' : 'rgba(255,255,255,.55)',
              boxShadow: active ? '0 6px 18px rgba(11,26,48,.10)' : 'none',
              transition: 'all 140ms',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ font: '800 9.5px/1 Archivo, sans-serif', letterSpacing: '.1em', textTransform: 'uppercase', color: active ? ui.accent : 'var(--text-muted)' }}>
                {ui.label}
              </span>
              {active && selectable && <span style={{ color: ui.accent, font: '800 11px/1 Archivo, sans-serif' }}>✓</span>}
            </div>
            <div style={{ font: '800 26px/1 Archivo, sans-serif', letterSpacing: '-0.02em', color: active ? 'var(--ink)' : 'var(--text-body)', fontVariantNumeric: 'tabular-nums', marginBottom: 10 }}>
              {t.amount} {currency}
            </div>
            {t.summary && (
              <div style={{ font: '400 12px/1.5 Archivo, sans-serif', color: 'var(--text-muted)' }}>{t.summary}</div>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Tier picker plus the schedule for whichever tier is chosen. The two buttons
 * always act on the tier currently selected.
 */
function AiPlanBlock({ plan, currency, dayRange, onAdd, onPropose, busy, done }) {
  const tiers = plan.tiers ?? []
  const selectable = plan.perTierItems === true
  const [selected, setSelected] = useState(() => {
    if (tiers.length === 0) return null
    return (tiers.find((t) => t.level === 'mediu') ?? tiers[0]).level
  })

  const activeTier = selectable ? tiers.find((t) => t.level === selected) ?? null : null
  const items = activeTier?.items ?? plan.items ?? []
  if (items.length === 0) return null

  return (
    <>
      {tiers.length > 0 && (
        <AiTierCards
          tiers={tiers} currency={currency}
          selected={selectable ? selected : null}
          onSelect={selectable ? setSelected : null}
        />
      )}
      <AiPlanCard
        key={selected}
        items={items}
        tierLabel={activeTier ? TIER_UI[activeTier.level]?.label : null}
        planDay={plan.day}
        currency={currency}
        dayRange={dayRange}
        busy={busy}
        done={done?.[selected ?? 'default']}
        onAdd={(day) => onAdd(items, day, selected ?? 'default')}
        onPropose={(day) => onPropose(items, day, selected ?? 'default')}
      />
    </>
  )
}

/** Day picker that always opens downward — a native select flips up near the bottom. */
function DayDropdown({ value, options, onChange, format }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          height: 32, padding: '0 10px 0 12px',
          borderRadius: 999,
          border: `1.5px solid ${open ? 'var(--blue-500)' : 'var(--border)'}`,
          background: 'var(--surface-solid)',
          font: '800 12px/1 Archivo, sans-serif',
          color: 'var(--ink)',
          cursor: 'pointer',
          transition: 'border-color 120ms',
        }}
      >
        {format(value)}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 140ms' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20,
            minWidth: 200, maxHeight: 240, overflowY: 'auto',
            background: 'var(--surface-solid)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            boxShadow: '0 12px 32px rgba(11,26,48,.16)',
            padding: 5,
          }}
        >
          {options.map((opt) => {
            const active = opt === value
            return (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => { onChange(opt); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  width: '100%', textAlign: 'left',
                  padding: '8px 10px', borderRadius: 'var(--r-sm)', border: 'none',
                  background: active ? 'var(--blue-tint)' : 'transparent',
                  font: `${active ? 800 : 400} 12.5px/1.2 Archivo, sans-serif`,
                  color: active ? 'var(--blue-700)' : 'var(--text-body)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg)' }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                {format(opt)}
                {active && <span>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AiPlanCard({ items, tierLabel, planDay, currency, dayRange, onAdd, onPropose, busy, done }) {
  const [day, setDay] = useState(() => (dayRange.includes(planDay) ? planDay : dayRange[0]))
  const total = items.reduce((s, i) => s + (i.cost || 0), 0)

  const dayLabel = (key) =>
    new Date(`${key}T00:00:00`).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'short' })

  return (
    <div style={{ background: 'rgba(31,111,235,.045)', border: '1.5px solid rgba(31,111,235,.22)', borderRadius: 'var(--r-lg)', padding: '16px 18px', marginTop: 12, marginLeft: 42 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div className="kicker" style={{ color: 'var(--blue-700)' }}>
          Ce adaug în plan{tierLabel ? `, varianta ${tierLabel.split(' · ')[0].toLowerCase()}` : ''}
        </div>
        <DayDropdown value={day} options={dayRange} onChange={setDay} format={dayLabel} />
      </div>

      {items.map((item, i) => {
        const cat = CAT_UI[item.category?.toLowerCase()] || CAT_UI.sight
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '8px 0' }}>
            <span style={{ font: '800 13px/1.4 Archivo, sans-serif', color: 'var(--ink)', width: 46, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {item.time}
            </span>
            <span style={{ flex: 1, minWidth: 0, font: '400 13px/1.4 Archivo, sans-serif', color: 'var(--blue-700)' }}>
              {item.title}
              {item.location && <span style={{ color: 'var(--text-muted)' }}> · {item.location}</span>}
              {item.durationMin && <span style={{ color: 'var(--text-muted)' }}> · {item.durationMin >= 60 ? `${Math.round(item.durationMin / 60)} h` : `${item.durationMin}′`}</span>}
              {item.cost != null && <span style={{ color: cat.color, fontWeight: 800 }}> · {item.cost} {currency}</span>}
            </span>
          </div>
        )
      })}

      {total > 0 && (
        <div style={{ font: '400 11.5px/1 Archivo, sans-serif', color: 'var(--text-muted)', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(31,111,235,.15)' }}>
          Total estimat: <b style={{ color: 'var(--ink)' }}>{total} {currency}</b> / persoană
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={busy || done === 'added'} onClick={() => onAdd(day)}>
          {done === 'added' ? '✓ Adăugat în plan' : busy ? 'Se adaugă…' : 'Adaugă în plan'}
        </button>
        <button className="btn-secondary" style={{ fontSize: 13 }} disabled={busy || done === 'proposed'} onClick={() => onPropose(day)}>
          {done === 'proposed' ? '✓ Trimis la vot' : 'Trimite la vot în chat'}
        </button>
      </div>
    </div>
  )
}

function AiChat({ tripId, destination, members, startDate, endDate, budget, currency = 'EUR', expenses, initialPrompt }) {
  const { token } = useSelector((s) => s.auth)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [planBusy, setPlanBusy] = useState(false)
  const [planDone, setPlanDone] = useState({}) // message index -> 'added' | 'proposed'
  const [promptsOpen, setPromptsOpen] = useState(false)
  const feedRef = useRef(null)
  const dispatch = useDispatch()

  const dayRange = buildDayRange(startDate, endDate)

  // Restore the stored thread so the conversation survives reloads and tab switches.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const history = await apiRequest(`/trips/${tripId}/ai/messages`, { token })
        if (cancelled || !Array.isArray(history)) return
        setMessages(history.map((m) => {
          if (m.role !== 'assistant') return { role: m.role, content: m.content }
          const { text, plan } = extractAiPlan(m.content)
          return { role: 'assistant', content: text, plan }
        }))
      } catch {
        // An unreachable history endpoint should still leave a usable chat.
      }
    })()
    return () => { cancelled = true }
  }, [tripId, token])

  // A question typed on the home screen is sent once, on arrival.
  const sentInitial = useRef(false)
  useEffect(() => {
    if (!initialPrompt || sentInitial.current) return
    sentInitial.current = true
    send(initialPrompt)
  }, [initialPrompt]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pin the feed to the newest message. Scrolling the container (not a sentinel)
  // keeps the page itself still.
  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  const planItemPayload = (item, day) => {
    const start = new Date(`${day}T${item.time}`)
    const end = item.durationMin ? new Date(start.getTime() + item.durationMin * 60000) : null
    return { start, end }
  }

  const markDone = (msgIndex, tier, state) =>
    setPlanDone((prev) => ({ ...prev, [msgIndex]: { ...prev[msgIndex], [tier]: state } }))

  const addPlanToItinerary = async (items, day, tier, msgIndex) => {
    setPlanBusy(true)
    for (const item of items) {
      const { start, end } = planItemPayload(item, day)
      await dispatch(createActivity({
        tripId,
        activity: {
          title: item.title,
          description: null,
          category: item.category?.toLowerCase() || 'sight',
          cost: item.cost ?? null,
          startTime: start.toISOString(),
          endTime: end ? end.toISOString() : null,
          location: item.location ?? null,
          latitude: null,
          longitude: null,
        },
      }))
    }
    setPlanBusy(false)
    markDone(msgIndex, tier, 'added')
  }

  const sendPlanToVote = async (items, day, tier, msgIndex) => {
    setPlanBusy(true)
    for (const item of items) {
      const { start, end } = planItemPayload(item, day)
      const categoryIndex = Math.max(0, ACTIVITY_CAT_ORDER.indexOf(item.category?.toLowerCase()))
      await dispatch(createProposal({
        tripId,
        proposal: {
          title: item.title,
          description: null,
          location: item.location ?? null,
          startTime: start.toISOString(),
          endTime: end ? end.toISOString() : null,
          category: categoryIndex,
          cost: item.cost ?? null,
        },
      }))
    }
    setPlanBusy(false)
    markDone(msgIndex, tier, 'proposed')
  }

  const send = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: null, loading: true }])
    setLoading(true)

    try {
      const res = await fetch(
        `${API_ORIGIN}/api/trips/${tripId}/ai/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: msg }),
        }
      )
      const data = await res.json()
      const reply = data.reply ?? data.message ?? 'Eroare la răspuns.'

      const { text, plan } = extractAiPlan(reply)
      setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: text, plan, loading: false }])
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
    <div className="split split-fixed" style={{ '--side-w': '460px' }}>
      {/* ---- Main: chat — only the feed scrolls, so the input stays put ---- */}
      <div className="split-main">
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="kicker">Asistent · {destination}{startDate ? `, ${new Date(startDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}–${new Date(endDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}` : ''}{members?.length ? `, ${members.length} persoane` : ''}</div>
        </div>

        {/* Feed */}
        <div ref={feedRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
              <Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 10 }}>
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

              {msg.plan && dayRange.length > 0 && (
                <AiPlanBlock
                  plan={msg.plan} currency={currency} dayRange={dayRange}
                  busy={planBusy} done={planDone[i]}
                  onAdd={(items, day, tier) => addPlanToItinerary(items, day, tier, i)}
                  onPropose={(items, day, tier) => sendPlanToVote(items, day, tier, i)}
                />
              )}
              </Fragment>
            )
          })}


        </div>

        {/* Input */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="chat-propose-btn mobile-only"
            title="Întrebări rapide"
            onClick={() => setPromptsOpen(true)}
            style={{ flexShrink: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>
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

      {/* ---- Right panel: quick prompts + context (a sheet on phones) ---- */}
      <div className="split-side hide-on-mobile" style={{ padding: 24 }}>
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

      {promptsOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPromptsOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <span className="modal-title">Întrebări rapide</span>
              <button onClick={() => setPromptsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.text}
                  onClick={() => { setPromptsOpen(false); send(p.text) }}
                  disabled={loading}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-solid)', color: 'var(--text-body)', font: '400 14px/1.3 Archivo, sans-serif', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span>{p.icon}</span>
                  <span>{p.text}</span>
                </button>
              ))}

              <div style={{ marginTop: 8, padding: '14px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)' }}>
                <div className="kicker" style={{ marginBottom: 10 }}>Contextul folosit</div>
                {[
                  { label: 'Destinație', value: destination },
                  { label: 'Perioadă', value: startDate ? `${new Date(startDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}–${new Date(endDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}` : '—' },
                  { label: 'Buget rămas', value: budgetLeft != null ? `${Math.round(budgetLeft)} ${currency}` : '—' },
                  { label: 'Zile libere', value: totalDays ? `${totalDays} zile` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ font: '400 13px/1 Archivo, sans-serif', color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ font: '800 13px/1 Archivo, sans-serif', color: 'var(--ink)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
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

  const CAT_LABELS = { food: 'Mâncare', stay: 'Cazare', travel: 'Călătorie', transit: 'Transport local', fun: 'Distracție', shop: 'Cumpărături' }
  const CAT_COLORS = { food: '#ff7a45', stay: '#0f9b8e', travel: '#1f6feb', transit: '#1f6feb', fun: '#7c3aed', shop: '#9ca3af' }

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', borderBottom: '2px solid var(--border-strong)' }}>
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
      <div className="split" style={{ '--side-w': 'minmax(0, 1fr)' }}>
        {/* Bar chart */}
        <div className="split-main" style={{ padding: '24px 28px' }}>
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
        <div className="split-side" style={{ padding: '24px 28px' }}>
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
  // Home can deep-link straight into a tab, optionally with a question for the assistant.
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState(() => searchParams.get('tab') || 'itinerary')
  const initialPrompt = searchParams.get('q')

  useEffect(() => {
    // Consume the params so a reload does not re-send the question.
    if (searchParams.get('tab') || searchParams.get('q')) setSearchParams({}, { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <>
      <AppRail user={user} activeTab={tab} onTabChange={setTab} showRecap={phase === 'Completed'} />
      <div className="app-content workspace-content">
        {/* ---- Workspace header ---- */}
        <div className="workspace-header">
          <div className="workspace-breadcrumb">
            <Link to="/" style={{ color: 'inherit' }}>Călătorii</Link>
            {' / '}
            {trip.destination}
          </div>
          <div>
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
          </div>

        </div>

        {/* ---- Tab content ---- */}
        <div key={tab} className="tab-content">
          {tab === 'itinerary' && (
            <Itinerary
              tripId={trip.id} tripStartDate={trip.startDate} tripEndDate={trip.endDate}
              members={trip.members} currentUserEmail={user?.email} isAdmin={isAdmin}
              currency={trip.currency}
            />
          )}
          {tab === 'expenses' && (
            <Expenses tripId={trip.id} members={trip.members} currentUserId={currentUserId} isAdmin={isAdmin} currency={trip.currency} />
          )}
          {tab === 'members' && (
            <Members members={trip.members} currentUserEmail={user?.email} isAdmin={isAdmin} tripId={trip.id} />
          )}
          {tab === 'chat' && <Chat tripId={trip.id} currentUserId={currentUserId} members={trip.members} />}
          {tab === 'ai' && <AiChat tripId={trip.id} destination={trip.destination} members={trip.members} startDate={trip.startDate} endDate={trip.endDate} budget={trip.budget} currency={trip.currency} expenses={expenses} initialPrompt={initialPrompt} />}
          {tab === 'recap' && <Recap trip={trip} expenses={expenses} activities={activities} />}
        </div>
      </div>
    </>
  )
}

export default TripDetail
