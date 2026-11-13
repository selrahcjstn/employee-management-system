import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/public.decorator.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Check that the API can reach the database' })
  async check() {
    await this.prisma.ping();
    return { status: 'ok', database: 'up' };
  }
}
