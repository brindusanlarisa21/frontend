import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiRequest } from '../../api/client'

function getStoredUser() {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) return null
  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

const initialState = {
  user: getStoredUser(),
  token: localStorage.getItem('token'),
  status: 'idle',
  error: null,
  message: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
      })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const register = createAsyncThunk(
  'auth/register',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      return await apiRequest('/auth/register', {
        method: 'POST',
        body: { name, email, password },
      })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }, { rejectWithValue }) => {
    try {
      return await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: { email },
      })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      return await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: { token, password },
      })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      state.status = 'idle'
      state.error = null
      state.message = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    clearAuthError(state) {
      state.error = null
    },
    clearAuthMessage(state) {
      state.message = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const { name, email } = action.payload
        state.user = { name, email }
        state.token = action.payload.token
        if (action.payload.token) localStorage.setItem('token', action.payload.token)
        localStorage.setItem('user', JSON.stringify(state.user))
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      .addCase(register.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const { name, email } = action.payload
        state.user = { name, email }
        state.token = action.payload.token
        if (action.payload.token) localStorage.setItem('token', action.payload.token)
        localStorage.setItem('user', JSON.stringify(state.user))
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      .addCase(forgotPassword.pending, (state) => {
        state.status = 'loading'
        state.error = null
        state.message = null
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.message = action.payload?.message || 'Check your email for reset instructions.'
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      .addCase(resetPassword.pending, (state) => {
        state.status = 'loading'
        state.error = null
        state.message = null
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.message = action.payload?.message || 'Password reset successfully.'
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { logout, clearAuthError, clearAuthMessage } = authSlice.actions
export default authSlice.reducer
