import { Navigate, Outlet, useLocation } from 'react-router';
import { PageLoader } from '../../../shared/ui/PageLoader';
import { useAuth } from '../context/useAuth';
import { redirectTarget } from './redirect';

/**
 * For /login. A signed-in user is sent on to the page they originally asked for, or the home page.
 * This is the one place that redirects after login, so the form itself never navigates.
 */
export function PublicOnlyRoute() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === 'restoring') return <PageLoader />;
  if (auth.status === 'authenticated') {
    return <Navigate to={redirectTarget(location.state)} replace />;
  }
  return <Outlet />;
}
