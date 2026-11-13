#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1ee3c0ee44de0b35bc461f85bafd93377a836e90c1ee6fdac6172f8dc0fc271e/contract';
import endContract from '../../snapshots/1ee3c0ee44de0b35bc461f85bafd93377a836e90c1ee6fdac6172f8dc0fc271e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/212761d6b29a7f34da178bc71db421866857964529617a6db9f0ca14507f1bcd/contract';
import startContract from '../../snapshots/212761d6b29a7f34da178bc71db421866857964529617a6db9f0ca14507f1bcd/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'salary_assignments',
        columns: [
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('deleted_at', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('employee_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('monthly_basic_salary', 'numeric(12,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 12, scale: 2 } },
          }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'chk_salary_assignments_basic_positive_7e2329d0',
            sql`monthly_basic_salary > 0`,
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'salary_assignments',
        index: 'salary_assignments_employee_id_idx_a830a6c3',
        columns: ['employee_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'salary_assignments',
        index: 'uq_active_salary_per_employee_554132d9',
        columns: ['employee_id'],
        extras: { where: sql`deleted_at IS NULL`, unique: true },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'salary_assignments',
        foreignKey: {
          name: 'salary_assignments_employee_id_fkey',
          columns: ['employee_id'],
          references: { schema: 'public', table: 'employees', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
