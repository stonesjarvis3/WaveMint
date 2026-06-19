import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';

// Modules
import { LaunchesModule } from './launches/launches.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { EventsModule } from './events/events.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { AuthModule } from './auth/auth.module';
import { RewardsModule } from './rewards/rewards.module';
import { AchievementsModule } from './achievements/achievements.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';

// Services
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '24h' },
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ScheduleModule.forRoot(),
    
    // Feature modules
    LaunchesModule,
    AnalyticsModule,
    EventsModule,
    UsersModule,
    CoursesModule,
    QuizzesModule,
    AuthModule,
    RewardsModule,
    AchievementsModule,
    LeaderboardModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
