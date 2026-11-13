import { Navigate, type RouteObject } from 'react-router';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProtectedRoute } from '../features/auth/routes/ProtectedRoute';
import { PublicOnlyRoute } from '../features/auth/routes/PublicOnlyRoute';
import { ComponentsPage } from '../features/components/pages/ComponentsPage';
import { EmployeeComponentsPage } from '../features/components/pages/EmployeeComponentsPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { ComputationPage } from '../features/computation/pages/ComputationPage';
import { ComputationsPage } from '../features/computation/pages/ComputationsPage';
import { EmployeeWorkspace } from '../features/employees/pages/EmployeeWorkspace';
import { EmployeesPage } from '../features/employees/pages/EmployeesPage';
import { ProfilePage } from '../features/profile/pages/ProfilePage';
import { SalariesPage } from '../features/salary/pages/SalariesPage';
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
              { path: 'components', element: <EmployeeComponentsPage /> },
              { path: 'computation', element: <ComputationPage /> },
            ],
          },
          { path: '/salaries', element: <SalariesPage /> },
          { path: '/components', element: <ComponentsPage /> },
          { path: '/computation', element: <ComputationsPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '/', element: <RootRedirect /> },
  { path: '*', element: <NotFoundPage /> },
];
