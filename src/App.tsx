import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import CalendarPage from './pages/Calendar'
import './styles/globals.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0A0A0A',
        flexDirection: 'column',
        gap: 16
      }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p style={{ color: '#C9A84C', fontFamily: 'Rajdhani, sans-serif', letterSpacing: 2, fontSize: 12 }}>
          LOADING...
        </p>
      </div>
    )
  }

  return firebaseUser ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuth()

  if (loading) return null

  return !firebaseUser ? <>{children}</> : <Navigate to="/calendar" replace />
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
