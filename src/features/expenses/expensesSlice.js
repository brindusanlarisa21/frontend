import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiRequest } from '../../api/client'

export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async (tripId, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}/expenses`, { token: getState().auth.token })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const fetchBalances = createAsyncThunk(
  'expenses/fetchBalances',
  async (tripId, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}/expenses/balances`, { token: getState().auth.token })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const createExpense = createAsyncThunk(
  'expenses/createExpense',
  async ({ tripId, expense }, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/trips/${tripId}/expenses`, {
        method: 'POST',
        body: expense,
        token: getState().auth.token,
      })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const deleteExpense = createAsyncThunk(
  'expenses/deleteExpense',
  async ({ tripId, expenseId }, { getState, rejectWithValue }) => {
    try {
      await apiRequest(`/trips/${tripId}/expenses/${expenseId}`, {
        method: 'DELETE',
        token: getState().auth.token,
      })
      return expenseId
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const settleDebt = createAsyncThunk(
  'expenses/settleDebt',
  async ({ tripId, fromUserId, toUserId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token
      await apiRequest(`/trips/${tripId}/expenses/settle`, {
        method: 'POST',
        body: { fromUserId, toUserId },
        token,
      })
      const [expenses, balances] = await Promise.all([
        apiRequest(`/trips/${tripId}/expenses`, { token }),
        apiRequest(`/trips/${tripId}/expenses/balances`, { token }),
      ])
      return { expenses, balances }
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  balances: null,
  balancesStatus: 'idle',
  balancesError: null,
  actionStatus: 'idle',
  actionError: null,
}

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    clearExpenseActionError(state) {
      state.actionError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload ?? []
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      .addCase(fetchBalances.pending, (state) => {
        state.balancesStatus = 'loading'
        state.balancesError = null
      })
      .addCase(fetchBalances.fulfilled, (state, action) => {
        state.balancesStatus = 'succeeded'
        state.balances = action.payload
      })
      .addCase(fetchBalances.rejected, (state, action) => {
        state.balancesStatus = 'failed'
        state.balancesError = action.payload
      })

      .addCase(createExpense.pending, (state) => {
        state.actionStatus = 'loading'
        state.actionError = null
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded'
        state.items.push(action.payload)
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.actionStatus = 'failed'
        state.actionError = action.payload
      })

      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.items = state.items.filter((e) => e.id !== action.payload)
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.actionError = action.payload
      })

      .addCase(settleDebt.pending, (state) => {
        state.actionStatus = 'loading'
        state.actionError = null
      })
      .addCase(settleDebt.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded'
        state.items = action.payload.expenses ?? state.items
        state.balances = action.payload.balances
      })
      .addCase(settleDebt.rejected, (state, action) => {
        state.actionStatus = 'failed'
        state.actionError = action.payload
      })
  },
})

export const { clearExpenseActionError } = expensesSlice.actions
export default expensesSlice.reducer
