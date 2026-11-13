import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { db } from './db.js';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  readonly db = db;

  async onModuleInit() {
    await this.ping();
    this.logger.log('Database connection OK');
  }

  async onModuleDestroy() {
    await db.close();
  }

  async ping() {
    await db.query(db.raw.sql`SELECT 1 AS ok`.returnsRow({ ok: 'pg/int4@1' }).build());
  }
}
