import { Module } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [RewardsController],
  providers: [RewardsService, PrismaService],
  exports: [RewardsService],
})
export class RewardsModule {}
