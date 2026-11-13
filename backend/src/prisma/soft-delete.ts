import { field, type } from '@prisma/orm-postgres/contract-builder';
import { db } from './db.js';

const deletedAt = {
  deletedAt: field.column(type.TimestamptzJsDate(3)).optional(),
};

/**
 * The one soft-delete filter. A row is active when `deleted_at IS NULL`.
 * Every read, list and computation on salary_assignments, salary_components and
 * employee_salary_components goes through `.with(active)`; services never write the filter by hand.
 */
export const active = db.orm.fragment(deletedAt, (rows) =>
  rows.where((row) => row.deletedAt.isNull()),
);

/** Rows that were soft deleted (superseded salaries, removed components). */
export const softDeleted = db.orm.fragment(deletedAt, (rows) =>
  rows.where((row) => row.deletedAt.isNotNull()),
);
