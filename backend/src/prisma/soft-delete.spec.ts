import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const modulesDir = join(import.meta.dirname, '..', 'modules');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')
      ? [path]
      : [];
  });

describe('soft delete filter', () => {
  it('is never written by hand in a module: reads go through the shared `active` / `softDeleted` scopes', () => {
    const handWritten =
      /deletedAt\s*:\s*null|deletedAt\.isNull|deletedAt\.isNotNull|deleted_at\s+IS\s+(NOT\s+)?NULL/i;
    const offenders = sourceFiles(modulesDir).filter((file) =>
      handWritten.test(readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  it('is applied wherever a service reads a soft-deletable table', () => {
    const tables =
      /orm\.public\.(SalaryAssignment|SalaryComponent|EmployeeSalaryComponent)/;
    const unfiltered = sourceFiles(modulesDir).filter((file) => {
      const text = readFileSync(file, 'utf8');
      return tables.test(text) && !/\.with\((active|softDeleted)\)/.test(text);
    });
    expect(unfiltered).toEqual([]);
  });
});
