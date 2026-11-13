#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/212761d6b29a7f34da178bc71db421866857964529617a6db9f0ca14507f1bcd/contract';
import endContract from '../../snapshots/212761d6b29a7f34da178bc71db421866857964529617a6db9f0ca14507f1bcd/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f98b5f046a45face882d70601a7c14e0723f6e68be2313f178c3513f63f14ea4/contract';
import startContract from '../../snapshots/f98b5f046a45face882d70601a7c14e0723f6e68be2313f178c3513f63f14ea4/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'employees',
        columns: [
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('date_hired', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('employee_no', 'character varying(50)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 50 } },
          }),
          col('first_name', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('last_name', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
          col('middle_name', 'character varying(100)', {
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
        table: 'employees',
        index: 'uq_employees_employee_no_lower_af82291a',
        expression: sql`lower(employee_no)`,
        extras: { unique: true },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
