import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { BOOT_ROUTES } from '../../constants/bootFlow.js'
import { getRoleHomePath } from '../../lib/roleHomePath.js'
import { AppRouteLoader } from '../app/AppRouteLoader.jsx'
import { USER_ROLES } from '../../constants/userRoles.js'

export function ProtectedRoute({ children, roles, allowGuest }) {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()
  const role = user?.role

  if (loading) {
    return <AppRouteLoader />
  }

  const isAdminRoute = location.pathname.startsWith('/admin')

  if (!isAuthenticated && !allowGuest) {
    if (isAdminRoute) {
      return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />
    }
    return <Navigate to={BOOT_ROUTES.SPLASH} replace state={{ from: location.pathname + location.search }} />
  }

  if (isAuthenticated && roles?.length && role && !roles.includes(role)) {
    if (isAdminRoute) {
      return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />
    }
    return <Navigate to={getRoleHomePath(role)} replace />
  }

  return children
}
