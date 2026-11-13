import { Module } from '@nestjs/common';
import { PaySummaryService } from './pay-summary.service.js';

@Module({
  providers: [PaySummaryService],
  exports: [PaySummaryService],
})
export class PayModule {}
