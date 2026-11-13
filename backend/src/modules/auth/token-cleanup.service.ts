import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpired() {
    const deleted = await this.prisma.db.orm.public.RefreshToken
      .where((token) => token.expiresAt.lt(new Date()))
      .deleteAndCount();
    this.logger.log(`Purged ${deleted} expired refresh tokens`);
    return deleted;
  }
}
