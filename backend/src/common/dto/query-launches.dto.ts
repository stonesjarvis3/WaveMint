import { IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LaunchStatus } from '../../launches/launch.entity';

export class QueryLaunchesDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['trending', 'new', 'migrated'] })
  @IsOptional()
  @IsIn(['trending', 'new', 'migrated'])
  sort?: 'trending' | 'new' | 'migrated' = 'new';

  @ApiPropertyOptional({ enum: LaunchStatus })
  @IsOptional()
  @IsIn(Object.values(LaunchStatus))
  status?: LaunchStatus;
}
