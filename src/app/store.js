import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import tripsReducer from '../features/trips/tripsSlice'
import activitiesReducer from '../features/activities/activitiesSlice'
import expensesReducer from '../features/expenses/expensesSlice'
import chatReducer from '../features/chat/chatSlice'
import proposalsReducer from '../features/proposals/proposalsSlice'
import groupReducer from '../features/group/groupSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    trips: tripsReducer,
    activities: activitiesReducer,
    expenses: expensesReducer,
    chat: chatReducer,
    proposals: proposalsReducer,
    group: groupReducer,
  },
})
