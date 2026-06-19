import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Launch } from './launch.entity';
import { LaunchesController } from './launches.controller';
import { LaunchesService } from './launches.service';

@Module({
  imports: [TypeOrmModule.forFeature([Launch])],
  controllers: [LaunchesController],
  providers: [LaunchesService],
  exports: [LaunchesService],
})
export class LaunchesModule {}
