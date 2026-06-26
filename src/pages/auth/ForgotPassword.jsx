import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { forgotPassword, clearAuthError, clearAuthMessage } from '../../features/auth/authSlice'

function ForgotPassword() {
  const dispatch = useDispatch()
  const { status, error, message } = useSelector((state) => state.auth)

  const [email, setEmail] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(clearAuthError())
    dispatch(clearAuthMessage())
    dispatch(forgotPassword({ email }))
  }

  return (
    <section className="auth-page">
      <h1>Forgot password</h1>
      <p>Enter your email and we'll send you instructions to reset your password.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}

        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p>
        <Link to="/login">Back to log in</Link>
      </p>
    </section>
  )
}

export default ForgotPassword
