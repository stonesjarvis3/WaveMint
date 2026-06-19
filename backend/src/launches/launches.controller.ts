import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LaunchesService } from './launches.service';
import { QueryLaunchesDto } from '../common/dto/query-launches.dto';

@ApiTags('launches')
@Controller('launches')
export class LaunchesController {
  constructor(private readonly service: LaunchesService) {}

  @Get()
  @ApiOperation({ summary: 'List launches with pagination and sorting' })
  findAll(@Query() query: QueryLaunchesDto) {
    return this.service.findAll(query);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Top 10 trending launches by 24h volume' })
  getTrending() {
    return this.service.getTrending();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search launches by name or symbol' })
  search(@Query('q') q: string) {
    return this.service.search(q ?? '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single launch by UUID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/trades')
  @ApiOperation({ summary: 'Get trades for a launch (placeholder)' })
  getTrades(@Param('id') _id: string) {
    return [];
  }
}
