import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'
import { fetchTrips, createTrip, clearTripsError } from '../features/trips/tripsSlice'
import '../styles/ds/index.css'
import '../styles/trip-detail.css'

function formatDateRange(start, end) {
  if (!start) return ''
  const opts = { month: 'short', day: 'numeric', year: 'numeric' }
  const s = new Date(start).toLocaleDateString('en-US', opts)
  if (!end) return s
  return `${s} – ${new Date(end).toLocaleDateString('en-US', opts)}`
}

function tripPhase(start, end) {
  const now = new Date()
  if (now < new Date(start)) return 'upcoming'
  if (now > new Date(end)) return 'completed'
  return 'active'
}

function daysUntil(start) {
  const diff = new Date(start) - new Date()
  return Math.ceil(diff / 86400000)
}

function AppRail({ user, onLogout }) {
  const navigate = useNavigate()
  return (
    <nav className="app-rail">
      <div className="rail-logo">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 2C10.5 2 6 6.4 6 11.9 6 19.5 16 30 16 30V2Z" fill="#1f6feb" />
          <path d="M16 2c5.5 0 10 4.4 10 9.9C26 19.5 16 30 16 30V2Z" fill="#4f97ff" />
          <circle cx="16" cy="11.6" r="3.1" fill="#fff" />
        </svg>
      </div>

      <button className="rail-item active" onClick={() => navigate('/')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span className="rail-item-label">Acasă</span>
      </button>

      <div className="rail-spacer" />

      <button className="rail-item" onClick={() => navigate('/profile')}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#3d86f5,#1f6feb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="rail-item-label">Profil</span>
      </button>

      <button className="rail-item" onClick={onLogout} style={{ marginTop: 4 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span className="rail-item-label">Ieșire</span>
      </button>
    </nav>
  )
}

function CreateTripModal({ open, onClose, onCreate, submitting, error }) {
  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onCreate({ title, destination, startDate, endDate })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Călătorie nouă</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1 }}>×</button>
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

function TripCard({ trip, onClick }) {
  const phase = tripPhase(trip.startDate, trip.endDate)
  const days = daysUntil(trip.startDate)

  return (
    <div className="trip-card" onClick={onClick}>
      <div className="trip-card-cover" style={{ background: `linear-gradient(135deg, #3d86f5 0%, #0b1a30 100%)` }}>
        <span className={`trip-card-status ${phase}`}>
          {phase === 'active' && '● ÎN DESFĂȘURARE'}
          {phase === 'upcoming' && `↑ ÎN ${days > 0 ? days : 0} ZILE`}
          {phase === 'completed' && '✓ ÎNCHEIATĂ'}
        </span>
        <span className="trip-card-destination">{trip.destination}</span>
      </div>
      <div className="trip-card-body">
        <div className="trip-card-title">{trip.title}</div>
        <div className="trip-card-dates">{formatDateRange(trip.startDate, trip.endDate)}</div>
        {trip.members?.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: -8, marginTop: 10 }}>
            {trip.members.slice(0, 5).map((m, i) => (
              <div key={m.id || i} style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg,#3d86f5,#1f6feb)',
                border: '2px solid #fff',
                marginLeft: i > 0 ? -9 : 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: '#fff',
                flexShrink: 0,
              }}>
                {(m.name || m.email || '?')[0].toUpperCase()}
              </div>
            ))}
            {trip.members.length > 5 && (
              <div style={{ marginLeft: 6, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                +{trip.members.length - 5}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Home() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(s => s.auth.user)
  const { items: trips, status, error } = useSelector(s => s.trips)
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)

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

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const upcoming = trips.filter(t => tripPhase(t.startDate, t.endDate) === 'upcoming')
  const nearest = upcoming.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0]
  const daysLeft = nearest ? daysUntil(nearest.startDate) : null

  return (
    <>
      <AppRail user={user} onLogout={handleLogout} />
      <div className="app-content">
        <div className="home-header">
          <div className="home-header-left">
            <div className="home-greeting">BUNĂ, {user?.name?.toUpperCase() || 'TRAVELER'}</div>
            <h1 className="home-title">
              {daysLeft > 0
                ? `Mai sunt ${daysLeft} zile până plecați`
                : trips.length > 0
                ? `Ai ${trips.length} ${trips.length === 1 ? 'călătorie' : 'călătorii'}`
                : 'Planifică prima ta aventură'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn-primary" onClick={() => { dispatch(clearTripsError()); setModalOpen(true) }}>
              + Călătorie nouă
            </button>
          </div>
        </div>

        {status === 'loading' && (
          <div style={{ padding: '40px 32px', color: 'var(--text-muted)', fontSize: 14 }}>Se încarcă…</div>
        )}

        {status !== 'loading' && trips.length === 0 && (
          <div style={{ padding: '60px 32px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: 'var(--blue-tint)', borderRadius: 'var(--r-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 28 }}>🌍</div>
            <div style={{ font: '800 20px/1 Archivo, sans-serif', color: 'var(--ink)', marginBottom: 8 }}>Nicio călătorie încă</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Creează prima ta călătorie și împarte cheltuielile cu grupul.</div>
            <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Călătorie nouă</button>
          </div>
        )}

        {trips.length > 0 && (
          <div className="trips-grid">
            {trips.map(trip => (
              <TripCard key={trip.id} trip={trip} onClick={() => navigate(`/trips/${trip.id}`)} />
            ))}
          </div>
        )}
      </div>

      <CreateTripModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
        submitting={creating}
        error={error}
      />
    </>
  )
}

export default Home
