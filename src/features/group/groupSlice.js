import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiRequest } from '../../api/client'

const withToken = (getState) => ({ token: getState().auth.token })

// ---------------- invite ----------------

export const fetchInvite = createAsyncThunk(
  'group/fetchInvite',
  async (tripId, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}/invite`, withToken(getState))
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const createInvite = createAsyncThunk(
  'group/createInvite',
  async (tripId, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}/invite`, { method: 'POST', ...withToken(getState) })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const previewInvite = createAsyncThunk(
  'group/previewInvite',
  async (token, { rejectWithValue }) => {
    try {
      return await apiRequest(`/invite/${token}`)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const joinByInvite = createAsyncThunk(
  'group/joinByInvite',
  async (token, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/invite/${token}/join`, { method: 'POST', ...withToken(getState) })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

// ---------------- checklist ----------------

export const fetchChecklist = createAsyncThunk(
  'group/fetchChecklist',
  async (tripId, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}/checklist`, withToken(getState))
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const addChecklistItem = createAsyncThunk(
  'group/addChecklistItem',
  async ({ tripId, text, assignedUserId = null }, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}/checklist`, {
        method: 'POST',
        body: { text, assignedUserId },
        ...withToken(getState),
      })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const updateChecklistItem = createAsyncThunk(
  'group/updateChecklistItem',
  async ({ tripId, itemId, changes }, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}/checklist/${itemId}`, {
        method: 'PUT',
        body: { text: null, done: null, assignedUserId: null, ...changes },
        ...withToken(getState),
      })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const deleteChecklistItem = createAsyncThunk(
  'group/deleteChecklistItem',
  async ({ tripId, itemId }, { getState, rejectWithValue }) => {
    try {
      await apiRequest(`/trips/${tripId}/checklist/${itemId}`, { method: 'DELETE', ...withToken(getState) })
      return itemId
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

// ---------------- documents ----------------

export const fetchDocuments = createAsyncThunk(
  'group/fetchDocuments',
  async (tripId, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}/documents`, withToken(getState))
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const addDocument = createAsyncThunk(
  'group/addDocument',
  async ({ tripId, document }, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}/documents`, {
        method: 'POST',
        body: document,
        ...withToken(getState),
      })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const deleteDocument = createAsyncThunk(
  'group/deleteDocument',
  async ({ tripId, documentId }, { getState, rejectWithValue }) => {
    try {
      await apiRequest(`/trips/${tripId}/documents/${documentId}`, { method: 'DELETE', ...withToken(getState) })
      return documentId
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

const initialState = {
  invite: null,
  inviteStatus: 'idle',
  checklist: [],
  checklistStatus: 'idle',
  documents: [],
  documentsStatus: 'idle',
  error: null,
}

const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    clearGroupError(state) {
      state.error = null
    },
    resetGroup() {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvite.pending, (state) => { state.inviteStatus = 'loading' })
      .addCase(fetchInvite.fulfilled, (state, action) => {
        state.inviteStatus = 'succeeded'
        state.invite = action.payload || null
      })
      .addCase(fetchInvite.rejected, (state, action) => {
        state.inviteStatus = 'failed'
        state.error = action.payload
      })
      .addCase(createInvite.fulfilled, (state, action) => {
        state.inviteStatus = 'succeeded'
        state.invite = action.payload
      })
      .addCase(createInvite.rejected, (state, action) => { state.error = action.payload })

      .addCase(fetchChecklist.pending, (state) => { state.checklistStatus = 'loading' })
      .addCase(fetchChecklist.fulfilled, (state, action) => {
        state.checklistStatus = 'succeeded'
        state.checklist = action.payload ?? []
      })
      .addCase(fetchChecklist.rejected, (state, action) => {
        state.checklistStatus = 'failed'
        state.error = action.payload
      })
      .addCase(addChecklistItem.fulfilled, (state, action) => { state.checklist.push(action.payload) })
      .addCase(updateChecklistItem.fulfilled, (state, action) => {
        const i = state.checklist.findIndex((c) => c.id === action.payload.id)
        if (i !== -1) state.checklist[i] = action.payload
      })
      .addCase(deleteChecklistItem.fulfilled, (state, action) => {
        state.checklist = state.checklist.filter((c) => c.id !== action.payload)
      })

      .addCase(fetchDocuments.pending, (state) => { state.documentsStatus = 'loading' })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.documentsStatus = 'succeeded'
        state.documents = action.payload ?? []
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.documentsStatus = 'failed'
        state.error = action.payload
      })
      .addCase(addDocument.fulfilled, (state, action) => { state.documents.push(action.payload) })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter((d) => d.id !== action.payload)
      })
  },
})

export const { clearGroupError, resetGroup } = groupSlice.actions
export default groupSlice.reducer
