import { formatDate, formatPeso } from '../../../shared/lib/format';
import { Badge } from '../../../shared/ui/Badge';
import { Table, TableSkeleton, Td, Th } from '../../../shared/ui/Table';
import { fullName, type Employee } from '../types';
import {
  EmployeeNameLink,
  EmployeeRow,
  EmployeeRowMenu,
  EmployeeStatusBadge,
} from './employee-row';

const HEADERS = [
  { text: 'Employee ID' },
  { text: 'Full name' },
  { text: 'Date hired' },
  { text: 'Basic salary', align: 'right' },
  { text: 'Components', align: 'right' },
  { text: 'Monthly total', align: 'right' },
  { text: 'Status' },
  { text: 'Actions', align: 'right' },
] as const;

interface EmployeesTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
}

export function EmployeesTable({ employees, onEdit }: EmployeesTableProps) {
  return (
    <Table label="Employees">
      <thead>
        <tr>
          {HEADERS.map((header) => (
            <Th
              key={header.text}
              align={'align' in header ? header.align : undefined}
            >
              {header.text === 'Actions' ? (
                <span className="sr-only">Actions</span>
              ) : (
                header.text
              )}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {employees.map((employee) => {
          const name = fullName(employee);
          return (
            <EmployeeRow
              key={employee.id}
              to={`/employees/${employee.id}/salary`}
            >
              <Td>
                <span className="font-mono text-sm font-medium whitespace-nowrap">
                  {employee.employeeNo}
                </span>
              </Td>
              <Td>
                <EmployeeNameLink
                  to={`/employees/${employee.id}/salary`}
                  name={name}
                />
              </Td>
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
                <span className="num">{employee.componentsCount}</span>
              </Td>
              <Td align="right">
                {employee.monthlyTotal ? (
                  <span className="num font-medium whitespace-nowrap">
                    {formatPeso(employee.monthlyTotal)}
                  </span>
                ) : (
                  <span
                    aria-label="No monthly total"
                    className="text-neutral-500"
                  >
                    —
                  </span>
                )}
              </Td>
              <Td>
                <EmployeeStatusBadge
                  hasSalary={employee.currentBasicSalary !== null}
                />
              </Td>
              <Td align="right">
                <div className="flex justify-end">
                  <EmployeeRowMenu
                    employeeId={employee.id}
                    name={name}
                    onEdit={() => onEdit(employee)}
                  />
                </div>
              </Td>
            </EmployeeRow>
          );
        })}
      </tbody>
    </Table>
  );
}

/** Rows the same height as the real ones, shown while the first load is under way. */
export function EmployeesTableSkeleton() {
  return (
    <TableSkeleton
      label="Loading employees"
      headers={HEADERS.map((header) => ({
        text: header.text,
        align: 'align' in header ? header.align : undefined,
      }))}
    />
  );
}
