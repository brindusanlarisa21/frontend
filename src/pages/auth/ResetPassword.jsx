import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword, clearAuthError, clearAuthMessage } from '../../features/auth/authSlice'

function ResetPassword() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { status, error, message } = useSelector((state) => state.auth)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(clearAuthError())
    dispatch(clearAuthMessage())
    setValidationError(null)

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.')
      return
    }

    const result = await dispatch(resetPassword({ token, password }))
    if (resetPassword.fulfilled.match(result)) {
      navigate('/login')
    }
  }

  return (
    <section className="auth-page">
      <h1>Reset password</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="password">New password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        <label htmlFor="confirmPassword">Confirm new password</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />

        {validationError && <p className="auth-error">{validationError}</p>}
        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}

        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Resetting...' : 'Reset password'}
        </button>
      </form>

      <p>
        <Link to="/login">Back to log in</Link>
      </p>
    </section>
  )
}

export default ResetPassword
