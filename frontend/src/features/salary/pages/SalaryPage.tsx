import { useParams } from 'react-router';
import { parseApiError } from '../../../shared/api/errors';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { useCurrentSalary, useSalaryHistory } from '../api/queries';
import { CurrentSalaryCard } from '../components/CurrentSalaryCard';
import { SalaryForm } from '../components/SalaryForm';
import { SalaryHistoryCard } from '../components/SalaryHistoryCard';

/** The Salary tab of an employee workspace: the current salary, the form to assign or adjust it, and the history. */
export function SalaryPage() {
  const { id: employeeId = '' } = useParams();
  const current = useCurrentSalary(employeeId);
  const history = useSalaryHistory(employeeId);

  if (current.isError) {
    return (
      <div>
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
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
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
