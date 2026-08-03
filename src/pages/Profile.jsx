import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../features/auth/authSlice'
import '../styles/ds/index.css'
import '../styles/trip-detail.css'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'https://localhost:7213'

function AppRail({ user }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  return (
    <nav className="app-rail">
      <div className="rail-logo">
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 2C10.5 2 6 6.4 6 11.9 6 19.5 16 30 16 30V2Z" fill="#1f6feb" />
            <path d="M16 2c5.5 0 10 4.4 10 9.9C26 19.5 16 30 16 30V2Z" fill="#4f97ff" />
            <circle cx="16" cy="11.6" r="3.1" fill="#fff" />
          </svg>
        </button>
      </div>
      <button className="rail-item" onClick={() => navigate('/')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span className="rail-item-label">Acasă</span>
      </button>
      <div className="rail-spacer" />
      <button className="rail-item active">
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#3d86f5,#1f6feb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="rail-item-label">Profil</span>
      </button>
      <button className="rail-item" onClick={() => { dispatch(logout()); navigate('/login') }} style={{ marginTop: 4 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span className="rail-item-label">Ieșire</span>
      </button>
    </nav>
  )
}

export default function Profile() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(s => s.auth.user)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [paymentLink, setPaymentLink] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')

  useEffect(() => {
    fetch(`${API_BASE}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setName(data.name || user?.name || '')
        setEmail(data.email || user?.email || '')
        setPaymentLink(data.paymentLink ?? '')
        setLoading(false)
      })
      .catch(() => {
        setName(user?.name || '')
        setEmail(user?.email || '')
        setLoading(false)
      })
  }, [token])

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await fetch(`${API_BASE}/api/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, paymentLink }),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch { setError(t('common.error')) }
    finally { setSaving(false) }
  }

  const handleLanguage = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const handleLogout = () => {
    if (window.confirm(t('profile.logoutConfirm'))) {
      dispatch(logout())
      navigate('/login')
    }
  }

  return (
    <>
      <AppRail user={user} />
      <div className="app-content">
        <div style={{ maxWidth: 760, padding: '32px 40px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingBottom: 22, borderBottom: '2px solid var(--border-strong)', marginBottom: 28 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#3d86f5,#1f6feb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ font: '800 24px/1 Archivo, sans-serif', letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 4 }}>{name || 'Profil'}</div>
              <div style={{ font: '400 13px/1 Archivo, sans-serif', color: 'var(--text-muted)' }}>{email}</div>
            </div>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Se încarcă…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

              {/* Limbă */}
              <div>
                <div className="kicker" style={{ marginBottom: 10 }}>Limba aplicației</div>
                <button
                  onClick={() => handleLanguage(i18n.language === 'ro' ? 'en' : 'ro')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--blue-500)', background: 'var(--blue-tint)', cursor: 'pointer', width: 200 }}
                >
                  <span style={{ font: '800 14px/1 Archivo, sans-serif', color: 'var(--blue-700)' }}>
                    {i18n.language === 'ro' ? '🇷🇴 Română' : '🇬🇧 English'}
                  </span>
                  <span style={{ color: 'var(--blue-500)', fontSize: 16 }}>⇄</span>
                </button>
                <div style={{ font: '400 12px/1.4 Archivo, sans-serif', color: 'var(--text-faint)', marginTop: 6 }}>
                  Se aplică imediat și se ține minte pe acest dispozitiv.
                </div>
              </div>

              <hr className="rule-2" />

              {/* Grid 2 col */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="input-label">Nume afișat</label>
                  <input className="input-field" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Email</label>
                  <input className="input-field" value={email} readOnly style={{ background: 'var(--bg)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
                </div>
              </div>

              {/* Link plată */}
              <div>
                <label className="input-label">Link de plată (Revolut / PayPal / IBAN)</label>
                <input
                  className="input-field"
                  value={paymentLink}
                  onChange={e => setPaymentLink(e.target.value)}
                  placeholder="https://revolut.me/..."
                />
                <div style={{ font: '400 12px/1.4 Archivo, sans-serif', color: 'var(--text-faint)', marginTop: 6 }}>
                  Ceilalți membri îl vor vedea când îți datorează bani.
                </div>
              </div>

              {error && <div className="auth-error"><span>⚠</span> {error}</div>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Se salvează…' : saved ? '✓ Salvat!' : 'Salvează'}
                </button>
              </div>

              <hr className="rule-2" />

              <div>
                <button className="btn-danger" onClick={handleLogout}>
                  Deconectare
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
