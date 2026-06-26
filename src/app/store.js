import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import tripsReducer from '../features/trips/tripsSlice'
import activitiesReducer from '../features/activities/activitiesSlice'
import expensesReducer from '../features/expenses/expensesSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    trips: tripsReducer,
    activities: activitiesReducer,
    expenses: expensesReducer,
  },
})
