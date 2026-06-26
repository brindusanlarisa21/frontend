import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import tripsReducer from '../features/trips/tripsSlice'
import activitiesReducer from '../features/activities/activitiesSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    trips: tripsReducer,
    activities: activitiesReducer,
  },
})
