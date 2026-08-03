import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { previewInvite, joinByInvite } from '../features/group/groupSlice'
import { fetchTrips } from '../features/trips/tripsSlice'
import '../styles/ds/index.css'
import '../styles/trip-detail.css'

/**
 * Landing page for an invite link. The preview is public so someone can see what
 * they are joining before signing in; joining itself needs an account.
 */
function JoinTrip() {
  const { token } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const authToken = useSelector((s) => s.auth.token)

  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await dispatch(previewInvite(token))
      if (cancelled) return
      if (previewInvite.fulfilled.match(result)) setPreview(result.payload)
      else setError(result.payload || 'Invitația nu a putut fi deschisă.')
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [dispatch, token])

  const handleJoin = async () => {
    if (!authToken) {
      // Come back here after signing in.
      localStorage.setItem('pendingInvite', token)
      navigate('/login')
      return
    }
    setJoining(true)
    const result = await dispatch(joinByInvite(token))
    setJoining(false)
    if (joinByInvite.fulfilled.match(result)) {
      localStorage.removeItem('pendingInvite')
      await dispatch(fetchTrips())
      navigate(`/trips/${result.payload.tripId}`)
    } else {
      setError(result.payload || 'Nu te-am putut adăuga în călătorie.')
    }
  }

  const fmt = (d) => new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 460, background: 'var(--surface-solid)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', boxShadow: '0 16px 48px rgba(11,26,48,.14)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(160deg, #12294a 0%, #0b1a30 100%)', padding: '26px 28px' }}>
          <div style={{ font: '800 10.5px/1 Archivo, sans-serif', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>
            Invitație
          </div>
          <div style={{ font: '800 26px/1.15 Archivo, sans-serif', letterSpacing: '-0.02em', color: '#fff' }}>
            {loading ? 'Se încarcă…' : preview ? preview.tripTitle : 'Invitație invalidă'}
          </div>
        </div>

        <div style={{ padding: '22px 28px' }}>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}><span>⚠</span> {error}</div>}

          {preview && (
            <>
              <div style={{ font: '400 14px/1.6 Archivo, sans-serif', color: 'var(--text-body)', marginBottom: 20 }}>
                <b>{preview.invitedByName}</b> te invită în {preview.tripTitle} — {preview.destination},{' '}
                {fmt(preview.startDate)}–{fmt(preview.endDate)}. Sunteți deja {preview.memberCount}{' '}
                {preview.memberCount === 1 ? 'persoană' : 'persoane'}.
              </div>

              <button
                className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleJoin} disabled={joining}
              >
                {joining ? 'Se procesează…' : authToken ? 'Intră în călătorie' : 'Conectează-te ca să intri'}
              </button>
            </>
          )}

          {!loading && !preview && (
            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/')}>
              Înapoi acasă
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default JoinTrip
