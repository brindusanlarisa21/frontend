import { Fragment, useEffect, useRef, useState } from 'react'
import * as signalR from '@microsoft/signalr'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../features/auth/authSlice'
import {
  Button, IconButton, Input, Badge, Card, Avatar,
  TripCover, SegmentedControl, Icon, Chip, ActivityCard, DatePicker, ActivityMap, LocationSearch,
  BalanceHero, ExpenseRow, SettleUpRow,
} from '../../components/ds'
import { fetchTripById, addTripMember, removeTripMember, clearMemberActionError } from '../../features/trips/tripsSlice'
import { fetchActivities, createActivity, deleteActivity, clearActivityActionError } from '../../features/activities/activitiesSlice'
import { fetchExpenses, createExpense, updateExpense, deleteExpense, fetchBalances, settleDebt, createSettlement, clearExpenseActionError } from '../../features/expenses/expensesSlice'
import { fetchMessages, messageReceived, clearMessages } from '../../features/chat/chatSlice'
import { fetchProposals, createProposal, voteProposal, proposalReceived, proposalUpdated, clearProposals } from '../../features/proposals/proposalsSlice'
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
    { value: 'members', label: 'Grup', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { value: 'ai', label: 'AI', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg> },
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
      <div className="col g4" style={{ padding: 22 }}>
        <Input
          label="Title" placeholder="e.g. Visit the Louvre"
          value={title} onChange={(e) => setTitle(e.target.value)} required
        />
        <LocationSearch label="Place" onSelect={setPlace} />
        <div>
          <label style={{ font: "var(--fw-semibold) var(--fs-sm)/1 'Inter', sans-serif", color: 'var(--text-body)', display: 'block', marginBottom: 6 }}>
            Category
          </label>
          <div className="flex g2 wrap-wrap">
            {CATEGORY_OPTIONS.map((c) => (
              <Chip key={c.value} icon={c.icon} selected={category === c.value} onClick={() => setCategory(c.value)}>
                {c.label}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex g3">
          <DatePicker
            label="Date" value={date} onChange={setDate}
            required containerStyle={{ flex: 1 }}
          />
          <Input
            label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)}
            required containerStyle={{ flex: 1 }}
          />
        </div>
        {error && <p className="auth-error">{error}</p>}
      </div>
      <div className="flex g3" style={{ padding: '16px 22px', borderTop: '1px solid var(--border-subtle)' }}>
        <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Adding…' : 'Add activity'}
        </Button>
      </div>
    </form>
  )
}

function AddActivityModal({ open, onClose, onSubmit, submitting, error, defaultDate }) {
  return (
    <div className={`overlay${open ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet">
        <div className="flex items-center justify-between" style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2>Add activity</h2>
          <IconButton icon="x" variant="ghost" label="Close" onClick={onClose} />
        </div>
        <ActivityForm key={open} onClose={onClose} onSubmit={onSubmit} submitting={submitting} error={error} defaultDate={defaultDate} />
      </div>
    </div>
  )
}

function Itinerary({ tripId, tripStartDate, tripEndDate, members, currentUserEmail, isAdmin }) {
  const dispatch = useDispatch()
  const { items, status, error, actionStatus, actionError } = useSelector((state) => state.activities)
  const [modalOpen, setModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const currentUserId = members.find((m) => m.email === currentUserEmail)?.userId

  const dayRange = buildDayRange(tripStartDate, tripEndDate)
  const [selectedDay, setSelectedDay] = useState(() => {
    const todayKey = dayKey(new Date().toISOString())
    return dayRange.includes(todayKey) ? todayKey : (dayRange[0] || todayKey)
  })

  useEffect(() => {
    dispatch(fetchActivities(tripId))
  }, [dispatch, tripId])

  const openModal = () => {
    dispatch(clearActivityActionError())
    setModalOpen(true)
  }

  const handleAdd = async (activity) => {
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

  return (
    <Fragment>
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <h2>Itinerary</h2>
        <Button size="sm" leadingIcon="plus" onClick={openModal}>Add activity</Button>
      </div>

      {status === 'loading' && <p style={{ color: 'var(--text-muted)' }}>Loading activities…</p>}
      {status === 'failed' && <p className="auth-error">{error}</p>}

      {status === 'succeeded' && items.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div
            style={{
              width: 56, height: 56, margin: '0 auto 16px', borderRadius: 'var(--r-pill)',
              background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--brand)',
            }}
          >
            <Icon name="compass" size={26} />
          </div>
          <h2>No activities yet</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Start building your itinerary by adding the first activity.
          </p>
        </Card>
      )}

      {status === 'succeeded' && items.length > 0 && (
        <div className="split-main">
          <div style={{ minWidth: 0 }}>
            <div className="flex g2 ts-scroll" style={{ overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
              {dayRange.map((key) => {
                const { weekday, day } = formatDayPill(key)
                return (
                  <Chip key={key} selected={selectedDay === key} onClick={() => setSelectedDay(key)} style={{ flex: 'none' }}>
                    {weekday} {day}
                  </Chip>
                )
              })}
            </div>

            <div className="overline" style={{ marginBottom: 10 }}>{formatDayHeading(selectedDay)}</div>

            {dayItems.length === 0 && (
              <p style={{ color: 'var(--text-muted)' }}>No activities planned for this day yet.</p>
            )}

            <div className="tl-rail col g3">
              {dayItems.map((a) => {
                const canDelete = isAdmin || a.createdByUserId === currentUserId
                return (
                  <div key={a.id} className="flex items-center g2">
                    <ActivityCard
                      style={{ flex: 1 }}
                      time={formatTime(a.startTime)}
                      title={a.title}
                      place={a.location}
                      category={a.category?.toLowerCase()}
                      cost={a.cost != null ? `$${Number(a.cost).toFixed(2)}` : undefined}
                    />
                    {canDelete && (
                      <IconButton
                        icon="x" variant="ghost" size="sm" label="Delete activity"
                        disabled={deletingId === a.id}
                        onClick={() => handleDelete(a.id)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <ActivityMap activities={items} height={420} />
        </div>
      )}

      {actionError && <p className="auth-error" style={{ marginTop: 12 }}>{actionError}</p>}

      <AddActivityModal
        open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAdd}
        submitting={actionStatus === 'loading'} error={actionError}
        defaultDate={selectedDay}
      />
    </Fragment>
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

function ExpenseForm({ onClose, onSubmit, submitting, error, members, initial }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '')
  const [category, setCategory] = useState(initial?.category ?? 'food')
  const [paidByUserId, setPaidByUserId] = useState(
    initial?.paidByUserId != null ? String(initial.paidByUserId) : String(members[0]?.userId ?? '')
  )
  const [splitAmong, setSplitAmong] = useState(
    () => new Set(
      initial?.splitAmong
        ? initial.splitAmong.map(String)
        : members.map((m) => String(m.userId))
    )
  )

  const toggleMember = (uid) => {
    setSplitAmong((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) { if (next.size > 1) next.delete(uid) }
      else next.add(uid)
      return next
    })
  }

  const isEdit = Boolean(initial?.id)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !amount || !paidByUserId) return
    onSubmit({
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      paidByUserId: parseInt(paidByUserId, 10),
      splitAmong: [...splitAmong].map(Number),
    })
  }

  const splitCount = splitAmong.size
  const perPerson = amount && splitCount > 0
    ? (parseFloat(amount) / splitCount).toFixed(2)
    : null

  return (
    <form onSubmit={handleSubmit}>
      <div className="col g4" style={{ padding: 22 }}>
        <Input
          label="Title" placeholder="e.g. Dinner at La Piazza"
          value={title} onChange={(e) => setTitle(e.target.value)} required
        />
        <Input
          label="Amount" type="number" min="0.01" step="0.01" placeholder="0.00"
          value={amount} onChange={(e) => setAmount(e.target.value)} required
        />
        <div>
          <label style={{ font: "var(--fw-semibold) var(--fs-sm)/1 'Inter', sans-serif", color: 'var(--text-body)', display: 'block', marginBottom: 6 }}>
            Category
          </label>
          <div className="flex g2 wrap-wrap">
            {EXPENSE_CATEGORY_OPTIONS.map((c) => (
              <Chip key={c.value} icon={c.icon} selected={category === c.value} onClick={() => setCategory(c.value)}>
                {c.label}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <label style={{ font: "var(--fw-semibold) var(--fs-sm)/1 'Inter', sans-serif", color: 'var(--text-body)', display: 'block', marginBottom: 6 }}>
            Paid by
          </label>
          <select value={paidByUserId} onChange={(e) => setPaidByUserId(e.target.value)} style={selectStyle}>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ font: "var(--fw-semibold) var(--fs-sm)/1 'Inter', sans-serif", color: 'var(--text-body)' }}>
              Split between
            </label>
            {perPerson && (
              <span style={{ font: "var(--fw-medium) var(--fs-xs)/1 'Inter', sans-serif", color: 'var(--text-muted)' }}>
                ${perPerson} each
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map((m) => {
              const uid = String(m.userId)
              const checked = splitAmong.has(uid)
              return (
                <label
                  key={uid}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 'var(--r-md)', cursor: 'pointer',
                    border: `1.5px solid ${checked ? 'var(--brand)' : 'var(--border-default)'}`,
                    background: checked ? 'var(--brand-soft)' : 'var(--surface-card)',
                    transition: 'all .12s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMember(uid)}
                    style={{ accentColor: 'var(--brand)', width: 16, height: 16, flexShrink: 0 }}
                  />
                  <Avatar name={m.name} src={m.avatarUrl} size="sm" />
                  <span style={{ font: "var(--fw-medium) var(--fs-sm)/1 'Inter', sans-serif", color: 'var(--text-strong)', flex: 1 }}>
                    {m.name}
                  </span>
                  {checked && perPerson && (
                    <span style={{ font: "var(--fw-semibold) var(--fs-xs)/1 'Inter', sans-serif", color: 'var(--brand)' }}>
                      ${perPerson}
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        </div>
        {error && <p className="auth-error">{error}</p>}
      </div>
      <div className="flex g3" style={{ padding: '16px 22px', borderTop: '1px solid var(--border-subtle)' }}>
        <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? (isEdit ? 'Saving…' : 'Adding…') : (isEdit ? 'Save changes' : 'Add expense')}
        </Button>
      </div>
    </form>
  )
}

function ExpenseModal({ open, onClose, onSubmit, submitting, error, members, initial }) {
  const isEdit = Boolean(initial?.id)
  return (
    <div className={`overlay${open ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet">
        <div className="flex items-center justify-between" style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2>{isEdit ? 'Edit expense' : 'Add expense'}</h2>
          <IconButton icon="x" variant="ghost" label="Close" onClick={onClose} />
        </div>
        <ExpenseForm
          key={open ? (initial?.id ?? 'new') : 'closed'}
          onClose={onClose}
          onSubmit={onSubmit}
          submitting={submitting}
          error={error}
          members={members}
          initial={initial}
        />
      </div>
    </div>
  )
}

function SettleModal({ open, debt, submitting, error, onClose, onSettle }) {
  if (!open || !debt) return null

  const hasLink = !!debt.toPaymentLink

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Settle up</h2>
          <IconButton icon="x" variant="ghost" size="sm" onClick={onClose} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <Avatar name={debt.fromName} size="md" />
            <Icon name="arrowRight" size={18} color="var(--text-subtle)" />
            <Avatar name={debt.toName} size="md" />
          </div>
          <p style={{ margin: '0 0 4px', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
            <b style={{ color: 'var(--text-strong)' }}>{debt.fromName}</b> plătește{' '}
            <b style={{ color: 'var(--text-strong)' }}>{debt.toName}</b>
          </p>
          <p style={{ margin: 0, fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
            {debt.currency} {Number(debt.amount).toFixed(2)}
          </p>
        </div>

        {hasLink ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              padding: 12, borderRadius: 'var(--r-md)', background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Icon name="creditCard" size={18} color="var(--brand)" />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Link de plată {debt.toName}</p>
                <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {debt.toPaymentLink}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button
                variant="primary"
                style={{ width: '100%' }}
                onClick={() => window.open(debt.toPaymentLink, '_blank', 'noopener,noreferrer')}
              >
                Deschide link de plată
              </Button>
              <Button
                variant="secondary"
                style={{ width: '100%' }}
                loading={submitting}
                onClick={() => onSettle()}
              >
                Am plătit — marchează ca settled
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              padding: 12, borderRadius: 'var(--r-md)', background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)', marginBottom: 16,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <Icon name="info" size={16} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
                <b>{debt.toName}</b> nu a setat un link de plată. Plătește prin bancă, Revolut sau cash, apoi confirmă.
              </p>
            </div>
            <Button
              variant="primary"
              style={{ width: '100%' }}
              loading={submitting}
              onClick={() => onSettle()}
            >
              Am plătit — marchează ca settled
            </Button>
          </div>
        )}

        {error && <p className="auth-error" style={{ marginTop: 8 }}>{error}</p>}
      </div>
    </div>
  )
}

function Expenses({ tripId, members, currentUserId, isAdmin }) {
  const dispatch = useDispatch()
  const { items, status, error, balances, actionStatus, actionError } = useSelector((state) => state.expenses)
  const [modal, setModal] = useState(null) // null | { mode: 'add' } | { mode: 'edit', expense }
  const [deletingId, setDeletingId] = useState(null)
  const [settleModal, setSettleModal] = useState(null) // null | { fromUserId, toUserId, fromName, toName, amount, currency }

  useEffect(() => {
    dispatch(fetchExpenses(tripId))
    dispatch(fetchBalances(tripId))
  }, [dispatch, tripId])

  const openAdd = () => {
    dispatch(clearExpenseActionError())
    setModal({ mode: 'add' })
  }

  const openEdit = (exp) => {
    dispatch(clearExpenseActionError())
    // Build splitAmong from splits stored on expense, fall back to all members
    setModal({ mode: 'edit', expense: exp })
  }

  const handleAdd = async (expense) => {
    const result = await dispatch(createExpense({ tripId, expense }))
    if (createExpense.fulfilled.match(result)) {
      setModal(null)
      dispatch(fetchBalances(tripId))
    }
  }

  const handleEdit = async (updates) => {
    const expenseId = modal.expense.id
    const result = await dispatch(updateExpense({ tripId, expenseId, updates }))
    if (updateExpense.fulfilled.match(result)) {
      setModal(null)
      dispatch(fetchBalances(tripId))
    }
  }

  const handleDelete = async (expenseId) => {
    setDeletingId(expenseId)
    const result = await dispatch(deleteExpense({ tripId, expenseId }))
    setDeletingId(null)
    if (deleteExpense.fulfilled.match(result)) dispatch(fetchBalances(tripId))
  }

  const openSettleModal = (d) => {
    dispatch(clearExpenseActionError())
    setSettleModal({
      fromUserId: d.fromUserId, toUserId: d.toUserId,
      fromName: d.fromName, toName: d.toName,
      amount: d.amount, currency: d.currency ?? 'USD',
      toPaymentLink: d.toPaymentLink ?? null,
    })
  }

  const handleSettle = async () => {
    if (!settleModal) return
    const result = await dispatch(createSettlement({
      tripId,
      fromUserId: settleModal.fromUserId,
      toUserId: settleModal.toUserId,
      amount: settleModal.amount,
      method: 'Cash',
    }))
    if (createSettlement.fulfilled.match(result)) {
      setSettleModal(null)
      dispatch(fetchExpenses(tripId))
      dispatch(fetchBalances(tripId))
    }
  }

  const debts = balances?.debts ?? []
  const modalOpen = modal !== null
  const isEditMode = modal?.mode === 'edit'

  // Build initial values for edit modal
  const editInitial = isEditMode ? {
    id: modal.expense.id,
    title: modal.expense.title,
    amount: modal.expense.amount,
    category: modal.expense.category,
    paidByUserId: modal.expense.paidByUserId,
    // We don't have splitAmong list from response — default to all members
    splitAmong: members.map((m) => m.userId),
  } : null

  return (
    <Fragment>
      {balances && (
        <BalanceHero
          net={balances.net ?? 0}
          youOwe={balances.youOwe ?? 0}
          youAreOwed={balances.youAreOwed ?? 0}
          style={{ marginBottom: 20 }}
        />
      )}

      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <h2>Expenses</h2>
        <Button size="sm" leadingIcon="plus" onClick={openAdd}>Add expense</Button>
      </div>

      {status === 'loading' && <p style={{ color: 'var(--text-muted)' }}>Loading expenses…</p>}
      {status === 'failed' && <p className="auth-error">{error}</p>}

      {status === 'succeeded' && items.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 48, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 16px', borderRadius: 'var(--r-pill)',
            background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--brand)',
          }}>
            <Icon name="wallet" size={26} />
          </div>
          <h2>No expenses yet</h2>
          <p style={{ color: 'var(--text-muted)' }}>Add the first expense to start tracking costs.</p>
        </Card>
      )}

      {status === 'succeeded' && items.length > 0 && (
        <Card style={{ marginBottom: 24, padding: '0 16px' }}>
          {items.map((exp, i) => {
            const youPaid = exp.paidByUserId === currentUserId
            const canEdit = youPaid || isAdmin
            return (
              <Fragment key={exp.id}>
                {i > 0 && <div style={{ height: 1, background: 'var(--border-subtle)' }} />}
                <div className="flex items-center g2">
                  <ExpenseRow
                    style={{ flex: 1 }}
                    title={exp.title}
                    category={exp.category}
                    paidBy={exp.paidByName}
                    total={exp.amount}
                    currency={exp.currency ?? 'USD'}
                    yourShare={exp.yourShare}
                    youPaid={youPaid}
                    settled={exp.settled}
                    splitCount={exp.splitCount}
                  />
                  {canEdit && (
                    <div className="flex g1">
                      <IconButton
                        icon="edit" variant="ghost" size="sm" label="Edit expense"
                        onClick={() => openEdit(exp)}
                      />
                      <IconButton
                        icon="x" variant="ghost" size="sm" label="Delete expense"
                        disabled={deletingId === exp.id}
                        onClick={() => handleDelete(exp.id)}
                      />
                    </div>
                  )}
                </div>
              </Fragment>
            )
          })}
        </Card>
      )}

      {debts.length > 0 && (
        <>
          <h2 style={{ marginBottom: 12 }}>Settle up</h2>
          <div className="col g3">
            {debts.map((d) => (
              <SettleUpRow
                key={`${d.fromUserId}-${d.toUserId}`}
                from={{ name: d.fromName }}
                to={{ name: d.toName }}
                amount={d.amount}
                currency={d.currency ?? 'USD'}
                settled={d.settled}
                onSettle={() => openSettleModal(d)}
              />
            ))}
          </div>
        </>
      )}

      {actionError && <p className="auth-error" style={{ marginTop: 12 }}>{actionError}</p>}

      <ExpenseModal
        open={modalOpen}
        onClose={() => setModal(null)}
        onSubmit={isEditMode ? handleEdit : handleAdd}
        submitting={actionStatus === 'loading'}
        error={actionError}
        members={members}
        initial={editInitial}
      />

      <SettleModal
        open={settleModal !== null}
        debt={settleModal}
        submitting={actionStatus === 'loading'}
        error={actionError}
        onClose={() => setSettleModal(null)}
        onSettle={handleSettle}
      />
    </Fragment>
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

function Chat({ tripId, currentUserId }) {
  const dispatch = useDispatch()
  const { token } = useSelector((s) => s.auth)
  const { messages, status } = useSelector((s) => s.chat)
  const { items: proposals } = useSelector((s) => s.proposals)
  const [text, setText] = useState('')
  const [connected, setConnected] = useState(false)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const connectionRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    dispatch(fetchMessages(tripId))
    dispatch(fetchProposals(tripId))

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`https://localhost:7213/hubs/chat`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    connection.on('ReceiveMessage', (msg) => {
      if (!cancelled) dispatch(messageReceived(msg))
    })
    connection.on('ProposalCreated', (p) => {
      if (!cancelled) dispatch(proposalReceived(p))
    })
    connection.on('ProposalUpdated', (p) => {
      if (!cancelled) {
        dispatch(proposalUpdated(p))
        if (p.status === 'Approved') dispatch(fetchActivities(tripId))
      }
    })

    connectionRef.current = connection

    connection.start()
      .then(() => {
        if (cancelled) { connection.stop(); return }
        setConnected(true)
        return connection.invoke('JoinTrip', tripId)
      })
      .catch(() => {})

    return () => {
      cancelled = true
      setConnected(false)
      connection.stop()
      dispatch(clearMessages())
      dispatch(clearProposals())
    }
  }, [tripId, token, dispatch])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || !connectionRef.current || !connected) return
    setText('')
    try {
      await connectionRef.current.invoke('SendMessage', tripId, trimmed)
    } catch (err) {
      console.error('Send error:', err)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Interleave messages and proposals sorted by time
  const feed = [
    ...messages.map((m) => ({ ...m, _type: 'message', _time: new Date(m.sentAt) })),
    ...proposals.map((p) => ({ ...p, _type: 'proposal', _time: new Date(p.createdAt) })),
  ].sort((a, b) => a._time - b._time)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '60vh', minHeight: 320 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {status === 'loading' && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>Se încarcă...</p>
        )}
        {feed.length === 0 && status === 'succeeded' && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Icon name="message" size={32} color="var(--text-subtle)" style={{ marginBottom: 8 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>Niciun mesaj încă. Fii primul!</p>
          </div>
        )}
        {feed.map((item) => {
          if (item._type === 'proposal') {
            return (
              <ProposalCard
                key={`proposal-${item.id}`}
                proposal={item}
                currentUserId={currentUserId}
                tripId={tripId}
              />
            )
          }
          const isMe = item.userId === currentUserId
          return (
            <div key={`msg-${item.id}`} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
              {!isMe && <Avatar name={item.userName} size="sm" />}
              <div style={{ maxWidth: '70%' }}>
                {!isMe && (
                  <p style={{ margin: '0 0 2px 4px', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 'var(--fw-medium)' }}>
                    {item.userName}
                  </p>
                )}
                <div style={{
                  padding: '8px 12px',
                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isMe ? 'var(--brand)' : 'var(--surface-raised)',
                  color: isMe ? '#fff' : 'var(--text-body)',
                  fontSize: 'var(--fs-sm)', lineHeight: 1.4,
                  border: isMe ? 'none' : '1px solid var(--border-subtle)',
                  wordBreak: 'break-word',
                }}>
                  {item.text}
                </div>
                <p style={{ margin: '2px 4px 0', fontSize: 'var(--fs-xs)', color: 'var(--text-subtle)', textAlign: isMe ? 'right' : 'left' }}>
                  {new Date(item.sentAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {showProposalForm && (
        <ProposalForm tripId={tripId} onClose={() => setShowProposalForm(false)} />
      )}

      {!showProposalForm && (
        <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
          <IconButton
            icon="calendar"
            variant="ghost"
            size="sm"
            onClick={() => setShowProposalForm(true)}
            title="Propune activitate"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={connected ? 'Scrie un mesaj... (Enter pentru trimite)' : 'Se conectează...'}
            disabled={!connected}
            rows={1}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 'var(--r-lg)',
              border: '1.5px solid var(--border-subtle)',
              background: 'var(--surface-input, var(--surface-card))',
              color: 'var(--text-body)',
              fontSize: 'var(--fs-sm)', resize: 'none', fontFamily: 'var(--font-body)',
              outline: 'none', lineHeight: 1.4,
            }}
          />
          <Button variant="primary" onClick={handleSend} disabled={!text.trim() || !connected}>
            <Icon name="arrowRight" size={18} />
          </Button>
        </div>
      )}
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

  return (
    <div className={`overlay${open ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet">
        <div className="flex items-center justify-between" style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2>Add a traveler</h2>
          <IconButton icon="x" variant="ghost" label="Close" onClick={onClose} />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="col g4" style={{ padding: 22 }}>
            <UserSearchDropdown
              key={open}
              existingMemberIds={existingMemberIds}
              onSelect={setSelectedUser}
            />
            {selectedUser && (
              <div className="flex items-center g3" style={{
                padding: '10px 14px', borderRadius: 'var(--r-md)',
                background: 'var(--brand-soft)', border: '1.5px solid var(--brand)',
              }}>
                <Avatar name={selectedUser.name} src={selectedUser.avatarUrl} size="sm" />
                <div className="grow">
                  <div style={{ font: "var(--fw-semibold) var(--fs-sm)/1.2 'Inter', sans-serif", color: 'var(--text-strong)' }}>{selectedUser.name}</div>
                  <div style={{ font: "var(--fw-regular) var(--fs-xs)/1 'Inter', sans-serif", color: 'var(--text-muted)', marginTop: 2 }}>{selectedUser.email}</div>
                </div>
                <IconButton icon="x" variant="ghost" size="sm" label="Clear" onClick={() => setSelectedUser(null)} />
              </div>
            )}
            {error && <p className="auth-error">{error}</p>}
          </div>
          <div className="flex g3" style={{ padding: '16px 22px', borderTop: '1px solid var(--border-subtle)' }}>
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
            <Button type="submit" fullWidth disabled={submitting || !selectedUser}>
              {submitting ? 'Adding…' : 'Add to trip'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Members({ members, currentUserEmail, isAdmin, tripId }) {
  const dispatch = useDispatch()
  const { memberActionStatus, memberActionError } = useSelector((state) => state.trips)
  const [modalOpen, setModalOpen] = useState(false)
  const [removingId, setRemovingId] = useState(null)

  const openModal = () => {
    dispatch(clearMemberActionError())
    setModalOpen(true)
  }

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
    <Fragment>
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <h2>Travelers · {members.length}</h2>
        <Button size="sm" leadingIcon="plus" onClick={openModal}>Add member</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }} className="mem-grid">
        {members.map((m) => {
          const isYou = m.email === currentUserEmail
          const canRemove = isAdmin || isYou
          return (
            <Card key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name={m.name} src={m.avatarUrl} size="lg" />
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="flex items-center g2">
                  <span style={{ font: "var(--fw-bold) var(--fs-title)/1.2 var(--font-display)", color: 'var(--text-strong)' }}>{m.name}</span>
                  <Badge tone={isYou ? 'accent' : m.role === 'Admin' ? 'brand' : 'neutral'}>{isYou ? 'You' : m.role}</Badge>
                </div>
                <div style={{ font: "var(--fw-regular) var(--fs-sm)/1 var(--font-body)", color: 'var(--text-muted)', marginTop: 4 }}>{m.email}</div>
              </div>
              {canRemove && (
                <IconButton
                  icon="x" variant="ghost" label={isYou ? 'Leave trip' : 'Remove member'}
                  disabled={removingId === m.userId}
                  onClick={() => handleRemove(m.userId)}
                />
              )}
            </Card>
          )
        })}
      </div>
      {memberActionError && <p className="auth-error" style={{ marginTop: 12 }}>{memberActionError}</p>}
      <InviteMemberModal
        open={modalOpen} onClose={() => setModalOpen(false)} onInvite={handleInvite}
        submitting={memberActionStatus === 'loading'} error={memberActionError}
        members={members}
      />
    </Fragment>
  )
}

const QUICK_PROMPTS = [
  'Ce activități îmi recomanzi în zonă?',
  'Unde pot mânca bine? Low/mid/high budget',
  'Ce obiceiuri locale trebuie să știu?',
  'Transport local — cum mă deplasez?',
  'Ce să vizitez în prima zi?',
]

function AiChat({ tripId, destination }) {
  const { token } = useSelector((s) => s.auth)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Bună! Sunt asistentul tău AI pentru călătoria în **${destination}**. 🌍\n\nTe pot ajuta cu:\n- 🏛️ Recomandări de activități și atracții\n- 🍽️ Restaurante și mâncare locală\n- 🚌 Transport și deplasare\n- 🎭 Obiceiuri și cultură locală\n- 💰 Variante budget, mid-range și premium\n\nCe vrei să știi?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const msg = text ?? input.trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', content: msg }
    const history = messages.filter((m) => m.role !== 'assistant' || messages.indexOf(m) > 0)
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '...' }])
    setLoading(true)

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'https://localhost:7213'}/api/trips/${tripId}/ai/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            message: msg,
            history: history.map((m) => ({ role: m.role, content: m.content })),
          }),
        }
      )
      const data = await res.json()
      const reply = data.reply ?? data.message ?? 'Eroare la răspuns.'
      setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: 'Eroare de conexiune. Încearcă din nou.' }])
    } finally {
      setLoading(false)
    }
  }

  const renderContent = (text) => {
    // Simple markdown-like rendering
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '65vh', minHeight: 360 }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          const isLoading = msg.content === '...'
          return (
            <div key={i} style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start' }}>
              {!isUser && (
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--blue-700), var(--cyan-500))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>✨</div>
              )}
              <div style={{
                maxWidth: '78%',
                padding: '10px 14px',
                borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isUser ? 'var(--brand)' : 'var(--surface-raised)',
                color: isUser ? '#fff' : 'var(--text-body)',
                fontSize: 'var(--fs-sm)', lineHeight: 1.6,
                border: isUser ? 'none' : '1px solid var(--border-subtle)',
              }}>
                {isLoading ? (
                  <span style={{ opacity: 0.5 }}>Se gândește...</span>
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => send(p)}
            disabled={loading}
            style={{
              padding: '4px 10px', borderRadius: 'var(--r-pill)', fontSize: 'var(--fs-xs)',
              border: '1.5px solid var(--border-subtle)', background: 'var(--surface-card)',
              color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'var(--fw-medium)',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Întreabă orice despre destinație..."
          disabled={loading}
          rows={1}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 'var(--r-lg)',
            border: '1.5px solid var(--border-subtle)',
            background: 'var(--surface-input, var(--surface-card))',
            color: 'var(--text-body)', fontSize: 'var(--fs-sm)',
            resize: 'none', fontFamily: 'var(--font-body)', outline: 'none', lineHeight: 1.4,
          }}
        />
        <Button variant="primary" onClick={() => send()} disabled={!input.trim() || loading}>
          <Icon name="arrowRight" size={18} />
        </Button>
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

  const tabLabels = {
    itinerary: 'PLAN',
    expenses: 'BANI',
    chat: 'CHAT',
    members: 'PRIETENI',
    ai: '✨ AI',
  }

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
          <div className="workspace-title">{trip.title}</div>
          <div className="workspace-meta">
            <span className="workspace-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {formatDateRangeShort(trip.startDate, trip.endDate)}
            </span>
            <span className="workspace-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {trip.members?.length || 0} membri
            </span>
            <span className="workspace-meta-item" style={{ color: phase === 'active' ? 'var(--teal-700)' : phase === 'completed' ? 'var(--text-faint)' : 'var(--blue-700)' }}>
              {phase === 'active' ? '● ÎN DESFĂȘURARE' : phase === 'upcoming' ? '↑ VIITOARE' : '✓ ÎNCHEIATĂ'}
            </span>
          </div>

          {/* Tab bar */}
          <div className="tab-bar">
            {Object.entries(tabLabels).map(([value, label]) => (
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
            />
          )}
          {tab === 'expenses' && (
            <Expenses tripId={trip.id} members={trip.members} currentUserId={currentUserId} isAdmin={isAdmin} />
          )}
          {tab === 'members' && (
            <Members members={trip.members} currentUserEmail={user?.email} isAdmin={isAdmin} tripId={trip.id} />
          )}
          {tab === 'chat' && <Chat tripId={trip.id} currentUserId={currentUserId} members={trip.members} />}
          {tab === 'ai' && <AiChat tripId={trip.id} destination={trip.destination} />}
        </div>
      </div>
    </>
  )
}

export default TripDetail
