import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { PageLoader } from './ui'

export function ProtectedRoute({ children, adminOnly = false, staffOnly = false }) {
  const { isLogged, isAdmin, isShelterStaff, loading } = useAuthContext()
  const location = useLocation()

  if (loading) return <PageLoader message="Verificando acceso..." />

  if (!isLogged) {
    return <Navigate to="/login" state={{ returnTo: location.pathname }} replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }

  if (staffOnly && !isShelterStaff && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}
