import { Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import TripDetail from './pages/trips/TripDetail'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import ProtectedRoute from './routes/ProtectedRoute'
import Profile from './pages/Profile'
import JoinTrip from './pages/JoinTrip'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invite/:token" element={<JoinTrip />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/trips/:tripId" element={<TripDetail />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default App
