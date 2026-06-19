import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Global platform statistics' })
  getStats() {
    return this.service.getStats();
  }

  @Get('price-history/:launchId')
  @ApiOperation({ summary: 'Price history for a launch' })
  getPriceHistory(
    @Param('launchId') launchId: string,
    @Query('period') period: string = '1d',
  ) {
    return this.service.getPriceHistory(launchId, period);
  }
}
