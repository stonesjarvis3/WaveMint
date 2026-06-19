import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { LaunchesModule } from '../launches/launches.module';

@Module({
  imports: [LaunchesModule],
  providers: [EventsService],
})
export class EventsModule {}
