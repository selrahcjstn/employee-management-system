import { Navigate, type RouteObject } from 'react-router';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProtectedRoute } from '../features/auth/routes/ProtectedRoute';
import { PublicOnlyRoute } from '../features/auth/routes/PublicOnlyRoute';
import { ComponentsPage } from '../features/components/pages/ComponentsPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { ComputationPage } from '../features/computation/pages/ComputationPage';
import { EmployeeWorkspace } from '../features/employees/pages/EmployeeWorkspace';
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
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/employees', element: <EmployeesPage /> },
          {
            path: '/employees/:id',
            element: <EmployeeWorkspace />,
            children: [
              { index: true, element: <Navigate to="salary" replace /> },
              { path: 'salary', element: <SalaryPage /> },
              { path: 'components', element: <ComponentsPage /> },
              { path: 'computation', element: <ComputationPage /> },
            ],
          },
          // The pay pages now live inside an employee's workspace.
          { path: '/salary', element: <Navigate to="/employees" replace /> },
          {
            path: '/components',
            element: <Navigate to="/employees" replace />,
          },
          {
            path: '/computation',
            element: <Navigate to="/employees" replace />,
          },
        ],
      },
    ],
  },
  { path: '/', element: <RootRedirect /> },
  { path: '*', element: <NotFoundPage /> },
];
