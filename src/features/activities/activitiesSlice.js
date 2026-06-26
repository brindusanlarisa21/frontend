import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiRequest } from '../../api/client'

export const fetchActivities = createAsyncThunk(
  'activities/fetchActivities',
  async (tripId, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}/activities`, { token: getState().auth.token })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const createActivity = createAsyncThunk(
  'activities/createActivity',
  async ({ tripId, activity }, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}/activities`, {
        method: 'POST',
        body: activity,
        token: getState().auth.token,
      })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const deleteActivity = createAsyncThunk(
  'activities/deleteActivity',
  async ({ tripId, activityId }, { getState, rejectWithValue }) => {
    try {
      await apiRequest(`/trips/${tripId}/activities/${activityId}`, {
        method: 'DELETE',
        token: getState().auth.token,
      })
      return activityId
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  actionStatus: 'idle',
  actionError: null,
}

const activitiesSlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    clearActivityActionError(state) {
      state.actionError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload ?? []
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      .addCase(createActivity.pending, (state) => {
        state.actionStatus = 'loading'
        state.actionError = null
      })
      .addCase(createActivity.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded'
        state.items.push(action.payload)
      })
      .addCase(createActivity.rejected, (state, action) => {
        state.actionStatus = 'failed'
        state.actionError = action.payload
      })

      .addCase(deleteActivity.fulfilled, (state, action) => {
        state.items = state.items.filter((a) => a.id !== action.payload)
      })
      .addCase(deleteActivity.rejected, (state, action) => {
        state.actionError = action.payload
      })
  },
})

export const { clearActivityActionError } = activitiesSlice.actions
export default activitiesSlice.reducer
