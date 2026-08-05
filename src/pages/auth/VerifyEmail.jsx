import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../../api/client'
import '../../styles/ds/index.css'
import '../../styles/trip-detail.css'

/**
 * Landing page for the link in the verification email. Confirms the address,
 * then sends the user to sign in.
 */
function VerifyEmail() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [status, setStatus] = useState('working') // working | done | failed
  const [error, setError] = useState(null)
  const [resendEmail, setResendEmail] = useState('')
  const [resent, setResent] = useState(false)

  // Guards against the double invocation React StrictMode does in development,
  // which would consume the single-use token and report failure.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    if (!token) {
      setStatus('failed')
      setError('Linkul nu conține un cod de confirmare.')
      return
    }

    apiRequest('/auth/verify-email', { method: 'POST', body: { token } })
      .then(() => setStatus('done'))
      .catch((e) => { setStatus('failed'); setError(e.message) })
  }, [token])

  const handleResend = async (e) => {
    e.preventDefault()
    try {
      await apiRequest('/auth/resend-verification', { method: 'POST', body: { email: resendEmail } })
      setResent(true)
    } catch { setResent(true) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440, background: 'var(--surface-solid)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', boxShadow: '0 16px 48px rgba(11,26,48,.14)', padding: '32px 28px', textAlign: 'center' }}>

        {status === 'working' && (
          <>
            <div style={{ font: '800 20px/1.2 Archivo, sans-serif', color: 'var(--ink)', marginBottom: 8 }}>Se confirmă…</div>
            <div style={{ font: '400 14px/1.6 Archivo, sans-serif', color: 'var(--text-muted)' }}>Durează o clipă.</div>
          </>
        )}

        {status === 'done' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 14 }}>✓</div>
            <div style={{ font: '800 22px/1.2 Archivo, sans-serif', color: 'var(--ink)', marginBottom: 10 }}>
              Adresa e confirmată
            </div>
            <div style={{ font: '400 14px/1.6 Archivo, sans-serif', color: 'var(--text-muted)', marginBottom: 22 }}>
              Poți intra în cont.
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/login')}>
              Intră în cont
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 14 }}>⚠</div>
            <div style={{ font: '800 22px/1.2 Archivo, sans-serif', color: 'var(--ink)', marginBottom: 10 }}>
              Confirmarea nu a reușit
            </div>
            <div style={{ font: '400 14px/1.6 Archivo, sans-serif', color: 'var(--text-muted)', marginBottom: 22 }}>
              {error}
            </div>

            {resent ? (
              <div style={{ font: '400 14px/1.6 Archivo, sans-serif', color: 'var(--teal-700)' }}>
                Dacă adresa există și nu e confirmată, ți-am trimis un link nou.
              </div>
            ) : (
              <form onSubmit={handleResend} style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
                <label className="input-label">Trimite un link nou</label>
                <input
                  className="input-field" type="email" placeholder="adresa ta de email"
                  value={resendEmail} onChange={(e) => setResendEmail(e.target.value)} required
                />
                <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                  Trimite
                </button>
              </form>
            )}

            <div style={{ marginTop: 18, font: '400 13px/1 Archivo, sans-serif' }}>
              <Link to="/login" style={{ fontWeight: 800, color: 'var(--blue-700)' }}>Înapoi la autentificare</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail
