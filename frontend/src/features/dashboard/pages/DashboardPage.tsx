import { useAuth } from '../../auth/context/useAuth';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { parseApiError } from '../../../shared/api/errors';
import { useEmployees } from '../../employees/api/queries';
import { DashboardOverview } from '../components/DashboardOverview';

/** "Good morning" by the viewer's own clock. */
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  return hour < 18 ? 'Good afternoon' : 'Good evening';
}

export function DashboardPage() {
  const auth = useAuth();
  const firstName =
    auth.status === 'authenticated'
      ? auth.user.fullName.split(' ')[0]
      : undefined;
  const employees = useEmployees('');

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="mt-2 text-sm text-neutral-600">
          {greeting()}
          {firstName ? `, ${firstName}` : ''}. Here is your team today.
        </p>
      </div>
      <div className="mt-6">
        {employees.isError ? (
          <Alert>
            <p>{parseApiError(employees.error).message}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              loading={employees.isFetching}
              onClick={() => employees.refetch()}
            >
              Retry
            </Button>
          </Alert>
        ) : (
          <DashboardOverview employees={employees.data} />
        )}
      </div>
    </>
  );
}
