import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Launch, LaunchStatus } from './launch.entity';
import { QueryLaunchesDto } from '../common/dto/query-launches.dto';

@Injectable()
export class LaunchesService {
  constructor(
    @InjectRepository(Launch)
    private readonly repo: Repository<Launch>,
  ) {}

  async findAll(query: QueryLaunchesDto) {
    const { page = 1, limit = 20, sort = 'new', status } = query;
    const where = status ? { status } : {};

    const order =
      sort === 'trending' ? { volume24h: 'DESC' as const }
      : sort === 'migrated' ? { migratedAt: 'DESC' as const }
      : { createdAt: 'DESC' as const };

    const [items, total] = await this.repo.findAndCount({
      where,
      order,
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const launch = await this.repo.findOneBy({ id });
    if (!launch) throw new NotFoundException(`Launch ${id} not found`);
    return launch;
  }

  async findByLaunchId(launchId: bigint) {
    return this.repo.findOneBy({ launchId });
  }

  async upsertFromEvent(data: Partial<Launch>) {
    const existing = data.launchId
      ? await this.repo.findOneBy({ launchId: data.launchId })
      : null;

    if (existing) {
      Object.assign(existing, data);
      return this.repo.save(existing);
    }

    return this.repo.save(this.repo.create(data));
  }

  async getTrending() {
    return this.repo.find({
      where: { status: LaunchStatus.ACTIVE },
      order: { volume24h: 'DESC' },
      take: 10,
    });
  }

  async search(q: string) {
    return this.repo.find({
      where: [
        { name: ILike(`%${q}%`) },
        { symbol: ILike(`%${q}%`) },
      ],
      take: 20,
    });
  }
}
