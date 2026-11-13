import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/public.decorator.js';
import { PrismaService } from '../../prisma/prisma.service.js';

/** The route is public, so a successful check is reused for this long instead of querying the database every call. */
const CACHE_MS = 1000;

@ApiTags('health')
@Controller('health')
export class HealthController {
  private lastOkAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Check that the API can reach the database' })
  @ApiServiceUnavailableResponse({ description: 'The database is unreachable' })
  async check() {
    if (Date.now() - this.lastOkAt >= CACHE_MS) {
      try {
        await this.prisma.ping();
      } catch {
        throw new ServiceUnavailableException('Database unavailable');
      }
      this.lastOkAt = Date.now();
    }
    return { status: 'ok', database: 'up' };
  }
}
