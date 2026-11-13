#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/305bc4d637a7cd6b07c6c65157717ca2c01bd596e0d9c8b21cfc0f5a9a7fb78a/contract';
import endContract from '../../snapshots/305bc4d637a7cd6b07c6c65157717ca2c01bd596e0d9c8b21cfc0f5a9a7fb78a/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f29d57c5e3e126d959a9686a8dc090bec52996fa68df0c4cc9c646583a50bd32/contract';
import startContract from '../../snapshots/f29d57c5e3e126d959a9686a8dc090bec52996fa68df0c4cc9c646583a50bd32/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addCheckConstraint({
        schema: 'public',
        table: 'users',
        constraint: 'chk_users_email_lowercase_9b410a78',
        expression: sql`email = lower(email)`,
      }),
      this.createIndex({
        schema: 'public',
        table: 'refresh_tokens',
        index: 'refresh_tokens_replaced_by_id_idx_325c901b',
        columns: ['replaced_by_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'refresh_tokens',
        foreignKey: {
          name: 'refresh_tokens_replaced_by_id_fkey',
          columns: ['replaced_by_id'],
          references: { schema: 'public', table: 'refresh_tokens', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
