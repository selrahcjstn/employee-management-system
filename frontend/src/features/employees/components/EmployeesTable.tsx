import { Link, useNavigate } from 'react-router';
import { formatDate, formatPeso } from '../../../shared/lib/format';
import { ActionsMenu } from '../../../shared/ui/ActionsMenu';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { Badge } from '../../../shared/ui/Badge';
import { PencilIcon } from '../../../shared/ui/icons';
import { IconButton } from '../../../shared/ui/IconButton';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { Table, Td, Th, Tr } from '../../../shared/ui/Table';
import { fullName, type Employee } from '../types';
import { WORKSPACE_TABS } from '../workspace-tabs';

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
  const navigate = useNavigate();

  return (
    <Table label="Employees">
      <Head />
      <tbody>
        {employees.map((employee) => {
          const name = fullName(employee);
          const base = `/employees/${employee.id}`;
          return (
            <Tr
              key={employee.id}
              onClick={(event) => {
                // A click on a link, button or menu inside the row does its own thing.
                if (
                  (event.target as HTMLElement).closest(
                    'a, button, [role="menu"]',
                  )
                )
                  return;
                void navigate(`${base}/salary`);
              }}
            >
              <Td>
                <span className="font-mono text-sm font-medium whitespace-nowrap">
                  {employee.employeeNo}
                </span>
              </Td>
              <Td>
                <Link
                  to={`${base}/salary`}
                  className="font-medium text-neutral-900 hover:text-primary-700 hover:underline"
                >
                  {name}
                </Link>
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
                <div className="flex items-center justify-end gap-1">
                  <div className="hidden items-center gap-1 lg:flex">
                    {WORKSPACE_TABS.map((tab) => (
                      <LinkButton
                        key={tab.path}
                        to={`${base}/${tab.path}`}
                        aria-label={`${tab.label} for ${name}`}
                      >
                        {tab.label}
                      </LinkButton>
                    ))}
                  </div>
                  <div className="lg:hidden">
                    <ActionsMenu
                      label={`Actions for ${name}`}
                      items={[
                        ...WORKSPACE_TABS.map((tab) => ({
                          label: tab.label,
                          to: `${base}/${tab.path}`,
                        })),
                        {
                          label: 'Edit employee',
                          onSelect: () => onEdit(employee),
                        },
                      ]}
                    />
                  </div>
                  <IconButton
                    label={`Edit ${name}`}
                    title="Edit"
                    className="hidden lg:flex"
                    onClick={() => onEdit(employee)}
                  >
                    <PencilIcon />
                  </IconButton>
                </div>
              </Td>
            </Tr>
          );
        })}
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
