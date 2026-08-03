import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiRequest } from '../../api/client'

export const fetchTrips = createAsyncThunk(
  'trips/fetchTrips',
  async (_, { getState, rejectWithValue }) => {
    try {
      return await apiRequest('/trips', { token: getState().auth.token })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const createTrip = createAsyncThunk(
  'trips/createTrip',
  async (tripData, { getState, rejectWithValue }) => {
    try {
      return await apiRequest('/trips', {
        method: 'POST',
        body: tripData,
        token: getState().auth.token,
      })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const updateTrip = createAsyncThunk(
  'trips/updateTrip',
  async ({ tripId, changes }, { getState, rejectWithValue }) => {
    try {
      // The API replaces the whole trip, so merge changes onto what we already have.
      const current = getState().trips.current
      return await apiRequest(`/trips/${tripId}`, {
        method: 'PUT',
        body: {
          title: current?.title,
          description: current?.description ?? null,
          destination: current?.destination,
          startDate: current?.startDate,
          endDate: current?.endDate,
          coverImageUrl: current?.coverImageUrl ?? null,
          budget: current?.budget ?? null,
          currency: current?.currency ?? 'EUR',
          ...changes,
        },
        token: getState().auth.token,
      })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const fetchTripById = createAsyncThunk(
  'trips/fetchTripById',
  async (tripId, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}`, { token: getState().auth.token })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const addTripMember = createAsyncThunk(
  'trips/addTripMember',
  async ({ tripId, email }, { getState, rejectWithValue }) => {
    try {
      await apiRequest(`/trips/${tripId}/members`, {
        method: 'POST',
        body: email,
        token: getState().auth.token,
      })
      return await apiRequest(`/trips/${tripId}`, { token: getState().auth.token })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const removeTripMember = createAsyncThunk(
  'trips/removeTripMember',
  async ({ tripId, memberUserId }, { getState, rejectWithValue }) => {
    try {
      await apiRequest(`/trips/${tripId}/members/${memberUserId}`, {
        method: 'DELETE',
        token: getState().auth.token,
      })
      return await apiRequest(`/trips/${tripId}`, { token: getState().auth.token })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  current: null,
  currentStatus: 'idle',
  currentError: null,
  memberActionStatus: 'idle',
  memberActionError: null,
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload
  return payload?.trips ?? payload?.data ?? []
}

function extractTrip(payload) {
  return payload?.trip ?? payload
}

const tripsSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    clearTripsError(state) {
      state.error = null
    },
    clearMemberActionError(state) {
      state.memberActionError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = extractList(action.payload)
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      .addCase(createTrip.pending, (state) => {
        state.error = null
      })
      .addCase(createTrip.fulfilled, (state, action) => {
        state.items.push(extractTrip(action.payload))
      })
      .addCase(createTrip.rejected, (state, action) => {
        state.error = action.payload
      })

      .addCase(fetchTripById.pending, (state) => {
        state.currentStatus = 'loading'
        state.currentError = null
      })
      .addCase(fetchTripById.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded'
        state.current = extractTrip(action.payload)
      })
      .addCase(updateTrip.fulfilled, (state, action) => {
        const updated = extractTrip(action.payload)
        state.current = updated
        const i = state.items.findIndex((t) => t.id === updated.id)
        if (i !== -1) state.items[i] = updated
      })
      .addCase(fetchTripById.rejected, (state, action) => {
        state.currentStatus = 'failed'
        state.currentError = action.payload
      })

      .addCase(addTripMember.pending, (state) => {
        state.memberActionStatus = 'loading'
        state.memberActionError = null
      })
      .addCase(addTripMember.fulfilled, (state, action) => {
        state.memberActionStatus = 'succeeded'
        state.current = extractTrip(action.payload)
      })
      .addCase(addTripMember.rejected, (state, action) => {
        state.memberActionStatus = 'failed'
        state.memberActionError = action.payload
      })

      .addCase(removeTripMember.pending, (state) => {
        state.memberActionStatus = 'loading'
        state.memberActionError = null
      })
      .addCase(removeTripMember.fulfilled, (state, action) => {
        state.memberActionStatus = 'succeeded'
        state.current = extractTrip(action.payload)
      })
      .addCase(removeTripMember.rejected, (state, action) => {
        state.memberActionStatus = 'failed'
        state.memberActionError = action.payload
      })
  },
})

export const { clearTripsError, clearMemberActionError } = tripsSlice.actions
export default tripsSlice.reducer
