import { useSearchParams } from 'react-router';
import { parseApiError } from '../../../shared/api/errors';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { WalletIcon } from '../../../shared/ui/icons';
import { EmployeePicker } from '../../employees/components/EmployeePicker';
import { useCurrentSalary, useSalaryHistory } from '../api/queries';
import { CurrentSalaryCard } from '../components/CurrentSalaryCard';
import { SalaryForm } from '../components/SalaryForm';
import { SalaryHistoryCard } from '../components/SalaryHistoryCard';

/** The chosen employee lives in the address (?employee=<id>), so a refresh or a shared link keeps it. */
export function SalaryPage() {
  const [params, setParams] = useSearchParams();
  const employeeId = params.get('employee');

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Salary</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Assign an employee's monthly basic salary, or adjust it. The previous
          amounts stay in the history.
        </p>
      </div>

      <EmployeePicker
        className="mt-6 max-w-sm"
        value={employeeId}
        onChange={(id) => setParams({ employee: id })}
      />

      {employeeId ? (
        <EmployeeSalary key={employeeId} employeeId={employeeId} />
      ) : (
        <section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-0 shadow-sm">
          <EmptyState
            icon={<WalletIcon size={48} />}
            title="Choose an employee"
            description="Pick someone above to see their salary, assign one, or adjust it."
          />
        </section>
      )}
    </>
  );
}

function EmployeeSalary({ employeeId }: { employeeId: string }) {
  const current = useCurrentSalary(employeeId);
  const history = useSalaryHistory(employeeId);

  if (current.isError) {
    return (
      <div className="mt-6">
        <Alert>
          <p>{parseApiError(current.error).message}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            loading={current.isFetching}
            onClick={() => current.refetch()}
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <CurrentSalaryCard salary={current.data} />
        {current.isSuccess && (
          <SalaryForm employeeId={employeeId} current={current.data} />
        )}
      </div>
      <SalaryHistoryCard
        history={history.data}
        isError={history.isError}
        onRetry={() => history.refetch()}
      />
    </div>
  );
}
