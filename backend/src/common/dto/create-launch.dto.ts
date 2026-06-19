import { IsString, IsOptional, IsNumberString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLaunchDto {
  @ApiProperty()
  @IsString()
  creator: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  symbol: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  totalSupply?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  targetMarketCap?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  txHash?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  launchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tokenAddress?: string;
}
