import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { register, clearAuthError } from '../../features/auth/authSlice'
import '../../styles/ds/index.css'
import '../../styles/trip-detail.css'

function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error } = useSelector(s => s.auth)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(clearAuthError())
    const result = await dispatch(register({ name, email, password }))
    if (register.fulfilled.match(result)) {
      // Someone who arrived from an invite link goes back to it after signing up.
      const pendingInvite = localStorage.getItem('pendingInvite')
      navigate(pendingInvite ? `/invite/${pendingInvite}` : '/')
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-panel-left">
        <div className="auth-panel-left-logo">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <path d="M16 2C10.5 2 6 6.4 6 11.9 6 19.5 16 30 16 30V2Z" fill="#1f6feb" />
            <path d="M16 2c5.5 0 10 4.4 10 9.9C26 19.5 16 30 16 30V2Z" fill="#4f97ff" />
            <circle cx="16" cy="11.6" r="3.1" fill="#fff" />
          </svg>
        </div>
        <div className="auth-panel-left-content">
          <div className="auth-panel-left-title">Planificați împreună. Socotelile le ținem noi.</div>
          <div className="auth-panel-left-sub">TripSplit face din orice aventură de grup o experiență fără stress — itinerar, cheltuieli și chat, totul într-un singur loc.</div>
          <div className="auth-stats">
            <div><div className="auth-stat-value">100%</div><div className="auth-stat-label">Gratuit de folosit</div></div>
            <div><div className="auth-stat-value">Real-time</div><div className="auth-stat-label">Chat & propuneri</div></div>
            <div><div className="auth-stat-value">AI</div><div className="auth-stat-label">Asistent destinație</div></div>
          </div>
        </div>
      </div>
      <div className="auth-panel-right">
        <div className="auth-form-card">
          <div className="auth-seg-control">
            <button className="auth-seg-btn" onClick={() => navigate('/login')}>Intră în cont</button>
            <button className="auth-seg-btn active">Cont nou</button>
          </div>
          {error && <div className="auth-error"><span>⚠</span> {error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="input-label">Nume</label>
              <input className="input-field" type="text" placeholder="Ana Popescu" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input className="input-field" type="email" placeholder="ana@exemplu.ro" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="input-label">Parolă</label>
              <input className="input-field" type="password" placeholder="Minim 8 caractere" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: 4, justifyContent: 'center' }} disabled={status === 'loading'}>
              {status === 'loading' ? 'Se creează contul…' : 'Creează contul'}
            </button>
            <div style={{ fontSize: 13, textAlign: 'center', color: 'var(--text-muted)' }}>
              Ai deja cont?{' '}
              <Link to="/login" style={{ fontWeight: 800, color: 'var(--blue-700)' }}>Intră în cont</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
