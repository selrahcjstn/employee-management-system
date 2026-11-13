import { Navigate, Outlet, useLocation } from 'react-router';
import { PageLoader } from '../../../shared/ui/PageLoader';
import { useAuth } from '../context/useAuth';
import { LOGIN_PATH, type FromState } from './redirect';

/** Wraps every page that needs a signed-in user. Remembers the requested path for after login. */
export function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === 'restoring') return <PageLoader />;
  if (auth.status === 'unauthenticated') {
    const state: FromState = {
      from: location.pathname + location.search + location.hash,
    };
    return <Navigate to={LOGIN_PATH} replace state={state} />;
  }
  return <Outlet />;
}
