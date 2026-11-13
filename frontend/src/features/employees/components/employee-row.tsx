import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { ActionsMenu } from '../../../shared/ui/ActionsMenu';
import { Avatar } from '../../../shared/ui/Avatar';
import { Badge } from '../../../shared/ui/Badge';
import { ChevronRightIcon } from '../../../shared/ui/icons';
import { Td, Tr } from '../../../shared/ui/Table';
import { WORKSPACE_TABS } from '../workspace-tabs';

/**
 * A table row that opens `to` when it is clicked anywhere, for mouse users. A click on a link, a
 * button or the menu inside the row does its own thing. Keyboard and screen reader users get the
 * same place through the name link (`EmployeeNameLink`).
 */
export function EmployeeRow({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <Tr
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('a, button, [role="menu"]'))
          return;
        void navigate(to);
      }}
    >
      {children}
    </Tr>
  );
}

/**
 * The employee's name as a real link: the keyboard way into the row. With `employeeNo` it is the
 * overview-table cell: an avatar, the name, and the Employee ID small under it.
 */
export function EmployeeNameLink({
  to,
  name,
  employeeNo,
}: {
  to: string;
  name: string;
  /** Shown small under the name, for tables with no Employee ID column. */
  employeeNo?: string;
}) {
  const link = (
    <Link
      to={to}
      className="font-medium text-neutral-900 hover:text-primary-700 hover:underline"
    >
      {name}
    </Link>
  );
  if (!employeeNo) return link;
  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} />
      <div className="min-w-0">
        {link}
        <span className="block font-mono text-xs text-neutral-600">
          {employeeNo}
        </span>
      </div>
    </div>
  );
}

/** The last cell of a clickable overview row: an arrow that says the row opens something. */
export function RowChevron() {
  return (
    <Td align="right" className="w-12">
      <ChevronRightIcon size={16} className="ml-auto text-neutral-400" />
    </Td>
  );
}

/** Ready once there is a basic salary; until then the employee is left out of the payroll. */
export function EmployeeStatusBadge({ hasSalary }: { hasSalary: boolean }) {
  return hasSalary ? (
    <Badge variant="success">Ready</Badge>
  ) : (
    <Badge variant="warning">Needs salary</Badge>
  );
}

/**
 * The one "⋯" menu on a row of the Employees table: Edit employee, then the three workspace tabs.
 * The pay overview pages have no menu: their rows already open the workspace.
 */
export function EmployeeRowMenu({
  employeeId,
  name,
  onEdit,
}: {
  employeeId: string;
  name: string;
  onEdit: () => void;
}) {
  return (
    <ActionsMenu
      label={`Actions for ${name}`}
      items={[
        { label: 'Edit employee', onSelect: onEdit },
        ...WORKSPACE_TABS.map((tab) => ({
          label: tab.label,
          to: `/employees/${employeeId}/${tab.path}`,
        })),
      ]}
    />
  );
}
