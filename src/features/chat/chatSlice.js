import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiRequest } from '../../api/client'

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (tripId, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}/messages`, { token: getState().auth.token })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    messageReceived(state, action) {
      const exists = state.messages.some((m) => m.id === action.payload.id)
      if (!exists) state.messages.push(action.payload)
    },
    clearMessages(state) {
      state.messages = []
      state.status = 'idle'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.messages = action.payload ?? []
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { messageReceived, clearMessages } = chatSlice.actions
export default chatSlice.reducer
