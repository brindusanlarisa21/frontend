import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { logout } from '../features/auth/authSlice'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'https://localhost:7213'

export default function Profile() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [paymentLink, setPaymentLink] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')

  // Extract name from JWT as fallback
  const nameFromToken = (() => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
        || payload.name || payload.unique_name || ''
    } catch { return '' }
  })()

  useEffect(() => {
    fetch(`${API_BASE}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        setName(data.name || nameFromToken || '')
        setEmail(data.email ?? '')
        setPaymentLink(data.paymentLink ?? '')
        setLoading(false)
      })
      .catch(() => {
        setName(nameFromToken)
        setLoading(false)
      })
  }, [token])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`${API_BASE}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, paymentLink }),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError(t('common.error'))
    } finally {
      setSaving(false)
    }
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

  if (loading) return <div style={styles.center}>{t('common.loading')}</div>

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backBtn} title={t('common.back')}>←</button>
          <h1 style={styles.title}>{t('profile.title')}</h1>
        </div>

        <div style={styles.avatar}>
          {name?.[0]?.toUpperCase() ?? '?'}
        </div>

        <div style={styles.field}>
          <label style={styles.label}>{t('profile.name')}</label>
          <input
            style={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>{t('profile.email')}</label>
          <input style={{ ...styles.input, ...styles.readOnly }} value={email} readOnly />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>{t('profile.paymentLink')}</label>
          <input
            style={styles.input}
            value={paymentLink}
            onChange={e => setPaymentLink(e.target.value)}
            placeholder="https://revolut.me/..."
          />
          <span style={styles.hint}>{t('profile.paymentLinkHint')}</span>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>{t('profile.language')}</label>
          <button
            style={styles.langToggle}
            onClick={() => handleLanguage(i18n.language === 'ro' ? 'en' : 'ro')}
          >
            <span style={styles.langCurrent}>
              {i18n.language === 'ro' ? '🇷🇴 Română' : '🇬🇧 English'}
            </span>
            <span style={styles.langSwitch}>⇄</span>
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? t('common.loading') : saved ? t('profile.saved') : t('profile.save')}
        </button>

        <hr style={styles.divider} />

        <button style={styles.logoutBtn} onClick={handleLogout}>
          {t('profile.logout')}
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '32px 16px',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '32px 28px',
    width: '100%',
    maxWidth: 480,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 8,
    color: '#555',
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    fontSize: 28,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 28px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  input: {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1.5px solid #e0e0e0',
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.2s',
    background: '#fff',
  },
  readOnly: {
    background: '#f7f7f7',
    color: '#888',
    cursor: 'not-allowed',
  },
  hint: {
    fontSize: 12,
    color: '#999',
  },
  langToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1.5px solid #6366f1',
    background: '#ede9fe',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  langCurrent: {
    fontSize: 14,
    fontWeight: 700,
    color: '#6366f1',
  },
  langSwitch: {
    fontSize: 16,
    color: '#6366f1',
    opacity: 0.7,
  },
  saveBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #f0f0f0',
    margin: '28px 0 20px',
  },
  logoutBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: 10,
    border: '1.5px solid #ef4444',
    background: '#fff',
    color: '#ef4444',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontSize: 16,
    color: '#888',
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 8,
  },
}
