import { Combobox } from '../../../shared/ui/Combobox';
import { useEmployees } from '../api/queries';
import { fullName } from '../types';

interface EmployeePickerProps {
  /** The chosen employee's database id, or null for none. */
  value: string | null;
  onChange: (employeeId: string) => void;
  className?: string;
}

/** Pick an employee by name or Employee ID. Shared by the Salary, Components and Computation pages. */
export function EmployeePicker({
  value,
  onChange,
  className,
}: EmployeePickerProps) {
  const employees = useEmployees('');
  const options = (employees.data ?? []).map((employee) => ({
    value: employee.id,
    label: fullName(employee),
    description: employee.employeeNo,
  }));

  return (
    <Combobox
      label="Employee"
      placeholder="Search by name or Employee ID"
      options={options}
      value={value}
      onChange={onChange}
      loading={employees.isPending}
      className={className}
    />
  );
}
