import { Navigate } from 'react-router';
import { useAuth } from '../features/auth/context/useAuth';
import { HOME_PATH, LOGIN_PATH } from '../features/auth/routes/redirect';
import { PageLoader } from '../shared/ui/PageLoader';

/** "/" goes to the home page when signed in, otherwise to the login page. */
export function RootRedirect() {
  const auth = useAuth();
  if (auth.status === 'restoring') return <PageLoader />;
  return (
    <Navigate
      to={auth.status === 'authenticated' ? HOME_PATH : LOGIN_PATH}
      replace
    />
  );
}
