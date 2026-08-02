import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'
import { fetchTrips, createTrip, clearTripsError } from '../features/trips/tripsSlice'
import { Button, IconButton, Input, Card, Avatar, TripCover } from '../components/ds'
import '../styles/ds/index.css'
import '../styles/trip-detail.css'

function formatDateRange(start, end) {
  if (!start) return ''
  const opts = { month: 'short', day: 'numeric', year: 'numeric' }
  const startStr = new Date(start).toLocaleDateString('en-US', opts)
  if (!end) return startStr
  return `${startStr} – ${new Date(end).toLocaleDateString('en-US', opts)}`
}

function TopBar({ user }) {
  const navigate = useNavigate()
  return (
    <header className="topbar">
      <div className="app-wrap app-wrap-wide flex items-center g4" style={{ height: '100%' }}>
        <div className="brand-lockup">TripSplit</div>
        <div className="grow" />
        <button
          onClick={() => navigate('/profile')}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
        >
          <Avatar name={user?.name || user?.email || '?'} size="md" ring />
        </button>
      </div>
    </header>
  )
}

function CreateTripModal({ open, onClose, onCreate, submitting, error }) {
  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onCreate({ title, destination, startDate, endDate })
  }

  return (
    <div className={`overlay${open ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet">
        <div className="flex items-center justify-between" style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2>New trip</h2>
          <IconButton icon="x" variant="ghost" label="Close" onClick={onClose} />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="col g4" style={{ padding: 22 }}>
            <Input label="Trip name" placeholder="e.g. Lisbon" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Input label="Destination" placeholder="e.g. Portugal" value={destination} onChange={(e) => setDestination(e.target.value)} required />
            <div className="flex g3">
              <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required containerStyle={{ flex: 1 }} />
              <Input label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required containerStyle={{ flex: 1 }} />
            </div>
            {error && <p className="auth-error">{error}</p>}
          </div>
          <div className="flex g3" style={{ padding: '16px 22px', borderTop: '1px solid var(--border-subtle)' }}>
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
            <Button type="submit" fullWidth disabled={submitting}>{submitting ? 'Creating…' : 'Create trip'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Home() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const { items: trips, status, error } = useSelector((state) => state.trips)
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    dispatch(fetchTrips())
  }, [dispatch])

  const openModal = () => {
    dispatch(clearTripsError())
    setModalOpen(true)
  }

  const handleCreate = async (tripData) => {
    setCreating(true)
    const result = await dispatch(createTrip(tripData))
    setCreating(false)
    if (createTrip.fulfilled.match(result)) setModalOpen(false)
  }

  return (
    <div className="ts-root">
      <TopBar user={user} />
      <main className="app-wrap app-wrap-wide" style={{ padding: '24px 24px 80px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <h1>Your trips</h1>
          <Button leadingIcon="plus" onClick={openModal}>New trip</Button>
        </div>

        {status === 'loading' && <p>Loading trips…</p>}
        {status === 'failed' && <p className="auth-error">{error}</p>}

        {status !== 'loading' && trips.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 48 }}>
            <h2>No trips yet</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
              Create your first trip to start splitting expenses with friends.
            </p>
          </Card>
        ) : (
          <div className="trip-grid">
            {trips.map((trip) => (
              <TripCover
                key={trip.id}
                title={trip.title}
                location={trip.destination}
                dates={formatDateRange(trip.startDate, trip.endDate)}
                people={(trip.members || []).map((m) => ({ name: m.name || m.email || 'Member' }))}
                height={180}
                onClick={() => navigate(`/trips/${trip.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateTripModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
        submitting={creating}
        error={error}
      />
    </div>
  )
}

export default Home
