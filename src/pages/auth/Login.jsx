import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { login, clearAuthError } from '../../features/auth/authSlice'
import { apiRequest } from '../../api/client'
import '../../styles/ds/index.css'
import '../../styles/trip-detail.css'

// Matches the message AuthService throws for an unverified account — the one
// case where the fix is "send it again", not "try again".
const UNVERIFIED_MARKER = 'Confirmă-ți adresa de email'

function AuthLayout({ mode, onModeChange, children, error, onResend, resendStatus }) {
  return (
    <div className="auth-layout">
      <div className="auth-panel-left">
        <div className="auth-panel-left-logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <path d="M16 2C10.5 2 6 6.4 6 11.9 6 19.5 16 30 16 30V2Z" fill="#1f6feb" />
            <path d="M16 2c5.5 0 10 4.4 10 9.9C26 19.5 16 30 16 30V2Z" fill="#4f97ff" />
            <circle cx="16" cy="11.6" r="3.1" fill="#fff" />
          </svg>
          <span style={{ font: '800 20px/1 Archivo, sans-serif', letterSpacing: '-0.02em', color: '#fff' }}>TripSplit</span>
        </div>
        <div className="auth-panel-left-content">
          <div className="auth-panel-left-title">Planificați împreună. Socotelile le ținem noi.</div>
          <div className="auth-panel-left-sub">
            Itinerar pe zile, propuneri votate în chat, cheltuieli împărțite automat
            și un asistent care umple golurile din program.
          </div>
          <div className="auth-stats">
            <div>
              <div className="auth-stat-value">3 min</div>
              <div className="auth-stat-label">De la idee la plan</div>
            </div>
            <div>
              <div className="auth-stat-value">0</div>
              <div className="auth-stat-label">Calcule pe hârtie</div>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-panel-right">
        <div className="auth-form-card">
          <div className="auth-seg-control">
            <button className={`auth-seg-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => onModeChange('login')}>
              Intră în cont
            </button>
            <button className={`auth-seg-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => onModeChange('register')}>
              Cont nou
            </button>
          </div>
          {error && (
            <div className="auth-error">
              <span>⚠</span> {error}
            </div>
          )}
          {error?.includes(UNVERIFIED_MARKER) && (
            resendStatus === 'sent' ? (
              <div style={{ font: '400 13px/1.5 Archivo, sans-serif', color: 'var(--teal-700)', marginBottom: 14 }}>
                Ți-am trimis un link nou — verifică inboxul (și spam-ul).
              </div>
            ) : (
              <button
                type="button" className="btn-secondary"
                style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: 14 }}
                disabled={resendStatus === 'sending'}
                onClick={onResend}
              >
                {resendStatus === 'sending' ? 'Se trimite…' : 'Retrimite emailul de confirmare'}
              </button>
            )
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error } = useSelector(s => s.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resendStatus, setResendStatus] = useState('idle') // idle | sending | sent

  const handleResend = async () => {
    setResendStatus('sending')
    try {
      await apiRequest('/auth/resend-verification', { method: 'POST', body: { email } })
    } catch {
      // Same outcome either way — see the endpoint's own comment.
    }
    setResendStatus('sent')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(clearAuthError())
    const result = await dispatch(login({ email, password }))
    if (login.fulfilled.match(result)) {
      // Someone who arrived from an invite link goes back to it after signing in.
      const pendingInvite = localStorage.getItem('pendingInvite')
      navigate(pendingInvite ? `/invite/${pendingInvite}` : '/')
    }
  }

  return (
    <AuthLayout
      mode="login" onModeChange={m => m === 'register' && navigate('/register')} error={error}
      onResend={handleResend} resendStatus={resendStatus}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="input-label">Email</label>
          <input className="input-field" type="email" placeholder="ana@exemplu.ro" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <label className="input-label" style={{ marginBottom: 0 }}>Parolă</label>
            <Link to="/forgot-password" style={{ fontSize: 12, fontWeight: 800, color: 'var(--blue-700)', letterSpacing: '0.01em' }}>Am uitat parola</Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              className="input-field" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required
              style={{ paddingRight: 44 }}
            />
            <button
              type="button" onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Ascunde parola' : 'Arată parola'}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>
        <button type="submit" className="btn-primary" style={{ marginTop: 4, justifyContent: 'center' }} disabled={status === 'loading'}>
          {status === 'loading' ? 'Se conectează…' : 'Intră în cont'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 600 }}>SAU</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <div style={{ fontSize: 13, textAlign: 'center', color: 'var(--text-muted)' }}>
          Nu ai cont?{' '}
          <Link to="/register" style={{ fontWeight: 800, color: 'var(--blue-700)' }}>Creează unul</Link>
        </div>
      </form>
    </AuthLayout>
  )
}

export default Login
