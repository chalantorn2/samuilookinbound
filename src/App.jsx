import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import './App.css'

import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import UnderDevelopment from './components/UnderDevelopment.jsx'

import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Booking from './pages/Booking.jsx'
import Information from './pages/Information.jsx'
import UsersManagement from './pages/UsersManagement.jsx'

function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton duration={4000} />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="booking"          element={<Booking />} />
          <Route path="booking-list"     element={<UnderDevelopment title="BOOKING LIST" />} />
          <Route path="information"      element={<Information />} />
          <Route path="voucher-list"     element={<UnderDevelopment title="VOUCHER LIST" />} />
          <Route path="invoice-list"     element={<UnderDevelopment title="INVOICE LIST" />} />
          <Route path="payment-list"     element={<UnderDevelopment title="PAYMENT LIST" />} />
          <Route path="report"           element={<UnderDevelopment title="REPORT" />} />
          <Route path="users-management" element={
            <ProtectedRoute requireRole="admin"><UsersManagement /></ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
