import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Launch, LaunchStatus } from '../launches/launch.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Launch)
    private readonly repo: Repository<Launch>,
  ) {}

  async getStats() {
    const [total, active, migrated] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { status: LaunchStatus.ACTIVE } }),
      this.repo.count({ where: { status: LaunchStatus.MIGRATED } }),
    ]);

    const { sum } = await this.repo
      .createQueryBuilder('l')
      .select('SUM(l.volume24h)', 'sum')
      .getRawOne();

    return {
      totalLaunches: total,
      activeLaunches: active,
      totalMigrated: migrated,
      totalVolume: sum ? BigInt(sum).toString() : '0',
    };
  }

  async getPriceHistory(launchId: string, period: string = '1d') {
    // Placeholder — return empty array until on-chain price history is indexed
    return [];
  }
}
