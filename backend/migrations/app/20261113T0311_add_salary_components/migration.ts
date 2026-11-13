#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/1ee3c0ee44de0b35bc461f85bafd93377a836e90c1ee6fdac6172f8dc0fc271e/contract';
import startContract from '../../snapshots/1ee3c0ee44de0b35bc461f85bafd93377a836e90c1ee6fdac6172f8dc0fc271e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f29d57c5e3e126d959a9686a8dc090bec52996fa68df0c4cc9c646583a50bd32/contract';
import endContract from '../../snapshots/f29d57c5e3e126d959a9686a8dc090bec52996fa68df0c4cc9c646583a50bd32/contract.json' with { type: 'json' };
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
        table: 'employee_salary_components',
        columns: [
          col('amount', 'numeric(12,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 12, scale: 2 } },
          }),
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
          col('salary_component_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'chk_employee_salary_components_amount_nonneg_2ce36fec',
            sql`amount >= 0`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'salary_components',
        columns: [
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('deleted_at', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'employee_salary_components',
        index: 'employee_salary_components_employee_id_idx_a830a6c3',
        columns: ['employee_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'employee_salary_components',
        index: 'employee_salary_components_salary_component_id_idx_42287854',
        columns: ['salary_component_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'employee_salary_components',
        index: 'uq_active_component_per_employee_132328ab',
        columns: ['employee_id', 'salary_component_id'],
        extras: { where: sql`deleted_at IS NULL`, unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'salary_components',
        index: 'uq_active_component_name_4c40aa49',
        expression: sql`lower(trim(name))`,
        extras: { where: sql`deleted_at IS NULL`, unique: true },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'employee_salary_components',
        foreignKey: {
          name: 'employee_salary_components_employee_id_fkey',
          columns: ['employee_id'],
          references: { schema: 'public', table: 'employees', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'employee_salary_components',
        foreignKey: {
          name: 'employee_salary_components_salary_component_id_fkey',
          columns: ['salary_component_id'],
          references: { schema: 'public', table: 'salary_components', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
