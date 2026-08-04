import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { House, Wallet, FileText, Sparkles } from 'lucide-react'
import { logout } from '../features/auth/authSlice'
import '../styles/ds/index.css'
import '../styles/trip-detail.css'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'https://localhost:7213'

function AppRail({ user }) {
  const navigate = useNavigate()
  return (
    <nav className="app-rail">
      <div className="rail-logo">
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 2C10.5 2 6 6.4 6 11.9 6 19.5 16 30 16 30V2Z" fill="#1f6feb" />
            <path d="M16 2c5.5 0 10 4.4 10 9.9C26 19.5 16 30 16 30V2Z" fill="#4f97ff" />
            <circle cx="16" cy="11.6" r="3.1" fill="#fff" />
          </svg>
          <span className="rail-wordmark">TripSplit</span>
        </button>
      </div>
      <button className="rail-item" onClick={() => navigate('/')}>
        <House size={21} strokeWidth={1.9} />
        <span className="rail-item-label">Acasă</span>
      </button>

      <button className="rail-item" onClick={() => navigate('/')}>
        <Wallet size={21} strokeWidth={1.9} />
        <span className="rail-item-label">Bani</span>
      </button>

      <button className="rail-item" onClick={() => navigate('/')}>
        <FileText size={21} strokeWidth={1.9} />
        <span className="rail-item-label">Acte</span>
      </button>

      <button className="rail-item" onClick={() => navigate('/')}>
        <Sparkles size={21} strokeWidth={1.9} />
        <span className="rail-item-label">Asistent</span>
      </button>

      <div className="rail-spacer" />
      <button className="rail-item active">
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#3d86f5,#1f6feb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="rail-item-label">Profil</span>
      </button>
    </nav>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 46, height: 27, borderRadius: 999, border: 'none', cursor: 'pointer',
        background: checked ? '#1f6feb' : 'rgba(18,41,74,.18)',
        position: 'relative', flexShrink: 0, transition: 'background 200ms',
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3, left: checked ? 22 : 3,
        width: 21, height: 21, borderRadius: '50%',
        background: '#fff',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,.15)',
        transition: 'left 200ms cubic-bezier(.2,.8,.2,1)',
      }} />
    </button>
  )
}

export default function Profile() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(s => s.auth.user)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [paymentLink, setPaymentLink] = useState('')
  const [currency, setCurrency] = useState('RON')
  const [notifProposals, setNotifProposals] = useState(true)
  const [notifBudget, setNotifBudget] = useState(true)
  const [notifOffline, setNotifOffline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')

  // "membră din" — calculat din token sau dată fixă
  const joinedLabel = (() => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const exp = payload.exp
      // Approximate: 7 zile înainte de expirare
      const issued = new Date((exp - 7 * 86400) * 1000)
      return issued.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
    } catch { return null }
  })()

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
    } catch { setError('A apărut o eroare. Încearcă din nou.') }
    finally { setSaving(false) }
  }

  const handleLanguage = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const handleLogout = () => {
    if (window.confirm('Ești sigur că vrei să te deconectezi?')) {
      dispatch(logout())
      navigate('/login')
    }
  }

  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (email?.[0] || '?').toUpperCase()

  return (
    <>
      <AppRail user={user} />
      <div className="app-content" style={{ display: 'flex', justifyContent: 'center', padding: '32px 24px 60px' }}>
        <div style={{ width: '100%', maxWidth: 760 }}>

          {/* ---- Header ---- */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg,#3d86f5,#1f6feb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '800 24px/1.1 Archivo, sans-serif', letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 5 }}>
                {name || 'Profil'}
              </div>
              <div style={{ font: '400 13px/1 Archivo, sans-serif', color: 'var(--text-muted)' }}>
                {email}{joinedLabel ? ` · membră din ${joinedLabel}` : ''}
              </div>
            </div>
          </div>

          <hr className="rule-1" style={{ marginBottom: 22 }} />

          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Se încarcă…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

              {/* ---- Limbă ---- */}
              <div>
                <div className="kicker" style={{ marginBottom: 10 }}>Limba aplicației</div>
                <div style={{ display: 'flex', background: 'rgba(18,41,74,.07)', borderRadius: 999, padding: 4, width: 'fit-content', gap: 2 }}>
                  {[{ code: 'ro', label: 'Română' }, { code: 'en', label: 'English' }].map(lng => (
                    <button
                      key={lng.code}
                      onClick={() => handleLanguage(lng.code)}
                      style={{
                        padding: '8px 20px',
                        borderRadius: 999,
                        border: 'none',
                        background: i18n.language === lng.code ? '#fff' : 'none',
                        color: i18n.language === lng.code ? 'var(--ink)' : 'var(--text-muted)',
                        font: `${i18n.language === lng.code ? 800 : 400} 14px/1 Archivo, sans-serif`,
                        cursor: 'pointer',
                        boxShadow: i18n.language === lng.code ? '0 1px 4px rgba(11,26,48,.12)' : 'none',
                        transition: 'all 140ms',
                      }}
                    >
                      {lng.label}
                    </button>
                  ))}
                </div>
                <div style={{ font: '400 12px/1.4 Archivo, sans-serif', color: 'var(--text-faint)', marginTop: 8 }}>
                  Se aplică imediat, în toată aplicația, și se ține minte pe acest dispozitiv.
                </div>
              </div>

              {/* ---- Grid: Nume + Valută ---- */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="input-label">Nume afișat</label>
                  <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Numele tău" />
                </div>
                <div>
                  <label className="input-label">Valuta preferată</label>
                  <select className="input-field" value={currency} onChange={e => setCurrency(e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="RON">RON — leu românesc</option>
                    <option value="EUR">EUR — euro</option>
                    <option value="USD">USD — dolar american</option>
                    <option value="GBP">GBP — liră sterlină</option>
                  </select>
                </div>
              </div>

              {/* ---- Link plată ---- */}
              <div>
                <label className="input-label">Link de plată</label>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--blue-500)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  <input
                    className="input-field"
                    style={{ paddingLeft: 36 }}
                    value={paymentLink}
                    onChange={e => setPaymentLink(e.target.value)}
                    placeholder="revolut.me/numeletau"
                  />
                </div>
                <div style={{ font: '400 12px/1.4 Archivo, sans-serif', color: 'var(--blue-700)', marginTop: 6 }}>
                  Îl văd doar prietenii din călătoriile tale, când îți datorează bani.
                </div>
              </div>

              {/* ---- Notificări ---- */}
              <div>
                <div className="kicker" style={{ marginBottom: 12 }}>Notificări</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { label: 'Propuneri și voturi', sub: 'Când cineva propune o activitate', checked: notifProposals, set: setNotifProposals },
                    { label: 'Alertă de buget', sub: 'Când grupul trece de 80% din buget', checked: notifBudget, set: setNotifBudget },
                    { label: 'Itinerar offline', sub: 'Ține ziua curentă pe telefon, fără net', checked: notifOffline, set: setNotifOffline },
                  ].map((item, i, arr) => (
                    <div key={item.label} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div>
                        <div style={{ font: '800 14px/1 Archivo, sans-serif', color: 'var(--ink)', marginBottom: 4 }}>{item.label}</div>
                        <div style={{ font: '400 12px/1 Archivo, sans-serif', color: 'var(--text-muted)' }}>{item.sub}</div>
                      </div>
                      <Toggle checked={item.checked} onChange={item.set} />
                    </div>
                  ))}
                </div>
              </div>

              {error && <div className="auth-error"><span>⚠</span> {error}</div>}

              {/* ---- Butoane ---- */}
              <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Se salvează…' : saved ? '✓ Salvat!' : 'Salvează'}
                </button>
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
