import { formatDate, formatPeso } from '../../../shared/lib/format';
import { Badge } from '../../../shared/ui/Badge';
import { PencilIcon } from '../../../shared/ui/icons';
import { IconButton } from '../../../shared/ui/IconButton';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { Table, Td, Th, Tr } from '../../../shared/ui/Table';
import { fullName, type Employee } from '../types';

function Head() {
  return (
    <thead>
      <tr>
        <Th>Employee ID</Th>
        <Th>Full name</Th>
        <Th>Date hired</Th>
        <Th align="right">Monthly basic salary</Th>
        <Th align="right">
          <span className="sr-only">Actions</span>
        </Th>
      </tr>
    </thead>
  );
}

interface EmployeesTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
}

export function EmployeesTable({ employees, onEdit }: EmployeesTableProps) {
  return (
    <Table label="Employees">
      <Head />
      <tbody>
        {employees.map((employee) => (
          <Tr key={employee.id}>
            <Td>
              <span className="font-mono text-sm font-medium whitespace-nowrap">
                {employee.employeeNo}
              </span>
            </Td>
            <Td>{fullName(employee)}</Td>
            <Td className="whitespace-nowrap">
              {formatDate(employee.dateHired)}
            </Td>
            <Td align="right">
              {employee.currentBasicSalary ? (
                <span className="num font-medium whitespace-nowrap">
                  {formatPeso(employee.currentBasicSalary)}
                </span>
              ) : (
                <Badge>Not assigned</Badge>
              )}
            </Td>
            <Td align="right">
              <IconButton
                label={`Edit ${fullName(employee)}`}
                title="Edit"
                onClick={() => onEdit(employee)}
              >
                <PencilIcon />
              </IconButton>
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

/** Rows the same height as the real ones, shown while the first load is under way. */
export function EmployeesTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true">
      <Table label="Loading employees">
        <Head />
        <tbody>
          {Array.from({ length: rows }, (_, index) => (
            <Tr key={index}>
              <Td>
                <Skeleton className="h-4 w-20" />
              </Td>
              <Td>
                <Skeleton className="h-4 w-40" />
              </Td>
              <Td>
                <Skeleton className="h-4 w-24" />
              </Td>
              <Td align="right">
                <Skeleton className="ml-auto h-4 w-24" />
              </Td>
              <Td align="right">
                <Skeleton className="ml-auto size-8" />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <span role="status" className="sr-only">
        Loading employees
      </span>
    </div>
  );
}
