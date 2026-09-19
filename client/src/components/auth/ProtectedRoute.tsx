import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { UserRole } from '@geomarket/shared';
import { useCurrentUser } from '../../hooks/useAuth';
import { LoadingState } from '../common/LoadingState';

const roleHome: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: '/dashboard',
  [UserRole.VENDOR]: '/vendor',
  [UserRole.ADMIN]: '/admin',
};

interface ProtectedRouteProps {
  /** Which roles may access this route. Empty array = any authenticated user. */
  roles?: UserRole[];
}

/**
 * ProtectedRoute — role-based access guard.
 *
 * Behaviour:
 * - Loading auth check → full-page spinner (never flash unauthenticated content)
 * - Not authenticated → redirect to /login (preserving intended destination)
 * - Wrong role → redirect to the user's own role home
 * - All good → render <Outlet />
 *
 * Authorization is derived exclusively from the verified backend JWT —
 * never from client-supplied data.
 */
export function ProtectedRoute({ roles = [] }: ProtectedRouteProps) {
  const { data: user, isLoading, isError } = useCurrentUser();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState fullPage label="Checking authentication…" />;
  }

  if (isError || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    // Redirect to the user's own dashboard, not a 403 page
    return <Navigate to={roleHome[user.role]} replace />;
  }

  return <Outlet />;
}
