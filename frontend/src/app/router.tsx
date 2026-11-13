import type { RouteObject } from 'react-router';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProtectedRoute } from '../features/auth/routes/ProtectedRoute';
import { PublicOnlyRoute } from '../features/auth/routes/PublicOnlyRoute';
import { EmployeesPage } from '../features/employees/pages/EmployeesPage';
import { SalaryPage } from '../features/salary/pages/SalaryPage';
import { NotFoundPage } from '../shared/pages/NotFoundPage';
import { AppLayout } from './layout/AppLayout';
import { RootRedirect } from './RootRedirect';

/** Kept as plain route objects so tests can mount them in a memory router. */
export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <PublicOnlyRoute />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/employees', element: <EmployeesPage /> },
          { path: '/salary', element: <SalaryPage /> },
        ],
      },
    ],
  },
  { path: '/', element: <RootRedirect /> },
  { path: '*', element: <NotFoundPage /> },
];
