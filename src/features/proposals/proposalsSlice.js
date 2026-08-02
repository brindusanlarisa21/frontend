import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiRequest } from '../../api/client'

export const fetchProposals = createAsyncThunk(
  'proposals/fetchProposals',
  async (tripId, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}/proposals`, { token: getState().auth.token })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const createProposal = createAsyncThunk(
  'proposals/createProposal',
  async ({ tripId, proposal }, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}/proposals`, {
        method: 'POST',
        body: proposal,
        token: getState().auth.token,
      })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const voteProposal = createAsyncThunk(
  'proposals/voteProposal',
  async ({ tripId, proposalId, approved }, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}/proposals/${proposalId}/vote`, {
        method: 'POST',
        body: { approved },
        token: getState().auth.token,
      })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

const upsert = (state, proposal) => {
  const idx = state.items.findIndex((p) => p.id === proposal.id)
  if (idx !== -1) state.items[idx] = proposal
  else state.items.unshift(proposal)
}

const proposalsSlice = createSlice({
  name: 'proposals',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {
    proposalReceived(state, action) { upsert(state, action.payload) },
    proposalUpdated(state, action) { upsert(state, action.payload) },
    clearProposals(state) { state.items = []; state.status = 'idle' },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProposals.pending, (state) => { state.status = 'loading' })
      .addCase(fetchProposals.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload ?? []
      })
      .addCase(fetchProposals.rejected, (state, action) => {
        state.status = 'failed'; state.error = action.payload
      })
      .addCase(createProposal.fulfilled, (state, action) => { upsert(state, action.payload) })
      .addCase(voteProposal.fulfilled, (state, action) => { upsert(state, action.payload) })
  },
})

export const { proposalReceived, proposalUpdated, clearProposals } = proposalsSlice.actions
export default proposalsSlice.reducer
