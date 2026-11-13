import { describe, expect, it } from 'vitest';
import { suggestEmployeeNo } from './suggest-employee-no';

const ids = (...employeeNos: string[]) =>
  employeeNos.map((employeeNo) => ({ employeeNo }));

describe('suggestEmployeeNo', () => {
  it('is the highest EMP-number plus one, padded to 3 digits', () => {
    expect(suggestEmployeeNo(ids('EMP-001', 'EMP-002', 'EMP-004'))).toBe(
      'EMP-005',
    );
    expect(suggestEmployeeNo(ids('EMP-009'))).toBe('EMP-010');
    expect(suggestEmployeeNo(ids('EMP-099'))).toBe('EMP-100');
  });

  it('goes past 3 digits instead of wrapping', () => {
    expect(suggestEmployeeNo(ids('EMP-999'))).toBe('EMP-1000');
    expect(suggestEmployeeNo(ids('EMP-1042'))).toBe('EMP-1043');
  });

  it('uses the highest, not the last or the count', () => {
    expect(suggestEmployeeNo(ids('EMP-040', 'EMP-002', 'EMP-007'))).toBe(
      'EMP-041',
    );
  });

  it('compares numbers, not text: EMP-10 is above EMP-9', () => {
    expect(suggestEmployeeNo(ids('EMP-9', 'EMP-10'))).toBe('EMP-011');
  });

  it('reads EMP in any letter case, and ignores spaces around it', () => {
    expect(suggestEmployeeNo(ids('emp-020', ' EMP-021 '))).toBe('EMP-022');
  });

  it('ignores IDs of another shape', () => {
    expect(
      suggestEmployeeNo(
        ids('EMP001', 'STAFF-77', 'EMP-A12', 'EMP-12x', 'EMP-003'),
      ),
    ).toBe('EMP-004');
  });

  it('is empty when no ID has the EMP-number shape', () => {
    expect(suggestEmployeeNo(ids('EMP001', 'STAFF-77'))).toBe('');
    expect(suggestEmployeeNo([])).toBe('');
  });

  it('handles very large numbers exactly', () => {
    expect(suggestEmployeeNo(ids('EMP-99999999999999999999'))).toBe(
      'EMP-100000000000000000000',
    );
  });
});
