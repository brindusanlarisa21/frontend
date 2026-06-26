import { Fragment, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Button, IconButton, Input, Badge, Card, Avatar,
  TripCover, SegmentedControl, Icon, Chip, ActivityCard, DatePicker, ActivityMap, LocationSearch,
} from '../../components/ds'
import { fetchTripById, addTripMember, removeTripMember, clearMemberActionError } from '../../features/trips/tripsSlice'
import { fetchActivities, createActivity, deleteActivity, clearActivityActionError } from '../../features/activities/activitiesSlice'
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

function TopBar({ tripTitle, user }) {
  return (
    <header className="topbar">
      <div className="app-wrap app-wrap-wide flex items-center g4" style={{ height: '100%' }}>
        <Link to="/" style={{ display: 'flex' }}><Logo /></Link>
        <div className="flex items-center g2" style={{ color: 'var(--text-muted)', font: "var(--fw-medium) var(--fs-sm)/1 var(--font-body)" }}>
          <Link to="/" className="hide-sm">Trips</Link>
          {tripTitle && <span className="hide-sm">/</span>}
          {tripTitle && <b style={{ color: 'var(--text-strong)', fontWeight: 'var(--fw-bold)' }}>{tripTitle}</b>}
        </div>
        <div className="grow" />
        <Avatar name={user?.name || user?.email || '?'} size="md" ring />
      </div>
    </header>
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

function Expenses() {
  return (
    <ComingSoon
      icon="wallet"
      title="Expenses are on the way"
      description="Splitting costs and settling up aren't connected yet."
    />
  )
}

function Chat() {
  return (
    <ComingSoon
      icon="message"
      title="Trip chat is on the way"
      description="Group messaging for this trip isn't connected yet."
    />
  )
}

/* ============ MEMBERS ============ */
function InviteMemberModal({ open, onClose, onInvite, submitting, error }) {
  const [email, setEmail] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onInvite(email.trim())
  }

  return (
    <div className={`overlay${open ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet">
        <div className="flex items-center justify-between" style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2>Invite a traveler</h2>
          <IconButton icon="x" variant="ghost" label="Close" onClick={onClose} />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="col g4" style={{ padding: 22 }}>
            <Input
              label="Email address" type="email" placeholder="friend@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
            {error && <p className="auth-error">{error}</p>}
          </div>
          <div className="flex g3" style={{ padding: '16px 22px', borderTop: '1px solid var(--border-subtle)' }}>
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
            <Button type="submit" fullWidth disabled={submitting}>{submitting ? 'Inviting…' : 'Send invite'}</Button>
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
        <Button size="sm" leadingIcon="plus" onClick={openModal}>Invite</Button>
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
      />
    </Fragment>
  )
}

/* ============ PAGE ============ */
const TABS = [
  { value: 'itinerary', label: 'Itinerary' }, { value: 'expenses', label: 'Expenses' },
  { value: 'members', label: 'Members' }, { value: 'chat', label: 'Chat' },
]

function TripDetail() {
  const { tripId } = useParams()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const { current: trip, currentStatus: status, currentError: error } = useSelector((state) => state.trips)
  const [tab, setTab] = useState('itinerary')

  useEffect(() => {
    dispatch(fetchTripById(tripId))
  }, [dispatch, tripId])

  if (status === 'failed' || (status === 'succeeded' && !trip)) {
    return (
      <div className="ts-root">
        <TopBar user={user} />
        <main className="app-wrap app-wrap-wide" style={{ padding: '20px 24px 80px' }}>
          <Card style={{ textAlign: 'center', padding: 48 }}>
            <h2>Trip not found</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
              {error || "This trip doesn't exist or you don't have access to it."}
            </p>
            <Link to="/"><Button variant="secondary">Back to trips</Button></Link>
          </Card>
        </main>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="ts-root">
        <TopBar user={user} />
        <main className="app-wrap app-wrap-wide" style={{ padding: '20px 24px 80px' }}>
          <p>Loading trip…</p>
        </main>
      </div>
    )
  }

  const isAdmin = trip.members.find((m) => m.email === user?.email)?.role === 'Admin'
  const people = trip.members.map((m) => ({ name: m.name, src: m.avatarUrl }))

  return (
    <div className="ts-root">
      <TopBar tripTitle={trip.title} user={user} />
      <main className="app-wrap app-wrap-wide" style={{ padding: '20px 24px 80px' }}>
        <TripCover
          title={trip.title} location={trip.destination} dates={formatDateRange(trip.startDate, trip.endDate)}
          people={people} gradient="sky" status={tripPhase(trip.startDate, trip.endDate)} height={224}
          style={{ marginBottom: 18 }}
        />

        <div className="flex items-center g4 wrap-wrap" style={{ position: 'sticky', top: 64, zIndex: 30, background: 'var(--surface-canvas)', padding: '10px 0 14px' }}>
          <div style={{ flex: 1, minWidth: 280, maxWidth: 460 }}>
            <SegmentedControl options={TABS} value={tab} onChange={setTab} />
          </div>
        </div>

        <div className="panel-in" key={tab} style={{ marginTop: 6 }}>
          {tab === 'itinerary' && (
            <Itinerary
              tripId={trip.id} tripStartDate={trip.startDate} tripEndDate={trip.endDate} members={trip.members}
              currentUserEmail={user?.email} isAdmin={isAdmin}
            />
          )}
          {tab === 'expenses' && <Expenses />}
          {tab === 'members' && (
            <Members members={trip.members} currentUserEmail={user?.email} isAdmin={isAdmin} tripId={trip.id} />
          )}
          {tab === 'chat' && <Chat />}
        </div>
      </main>
    </div>
  )
}

export default TripDetail
