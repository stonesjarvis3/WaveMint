import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SorobanRpc, xdr } from '@stellar/stellar-sdk';
import { LaunchesService } from '../launches/launches.service';
import { LaunchStatus } from '../launches/launch.entity';

@Injectable()
export class EventsService implements OnModuleInit {
  private readonly logger = new Logger(EventsService.name);
  private lastLedger = 0;
  private rpc: SorobanRpc.Server;
  private contractId: string;

  constructor(
    private readonly config: ConfigService,
    private readonly launches: LaunchesService,
  ) {}

  onModuleInit() {
    const url = this.config.get<string>('SOROBAN_RPC_URL');
    this.contractId = this.config.get<string>('LAUNCH_CONTRACT_ID') ?? '';
    if (url) {
      this.rpc = new SorobanRpc.Server(url, { allowHttp: true });
    }
  }

  @Cron('*/10 * * * * *')
  async pollEvents() {
    if (!this.rpc || !this.contractId) return;

    try {
      const response = await this.rpc.getEvents({
        startLedger: this.lastLedger || undefined,
        filters: [
          {
            type: 'contract',
            contractIds: [this.contractId],
            topics: [[]],
          },
        ],
        limit: 100,
      });

      for (const event of response.events) {
        await this.handleEvent(event);
      }

      if (response.latestLedger) {
        this.lastLedger = response.latestLedger + 1;
      }
    } catch (err) {
      this.logger.warn(`Event poll failed: ${err.message}`);
    }
  }

  private async handleEvent(event: SorobanRpc.Api.EventResponse) {
    const topics = event.topic.map((t) => {
      try { return xdr.ScVal.fromXDR(t, 'base64'); } catch { return null; }
    });

    const eventType = topics[0]?.sym()?.toString();
    if (!eventType) return;

    const rawVal = event.value
      ? (() => { try { return xdr.ScVal.fromXDR(event.value, 'base64'); } catch { return null; } })()
      : null;

    const launchId = topics[1]?.u64()?.toBigInt?.() ?? null;

    switch (eventType) {
      case 'launch_created':
        await this.launches.upsertFromEvent({
          launchId,
          status: LaunchStatus.ACTIVE,
          txHash: event.id,
        });
        break;

      case 'launch_updated':
        if (launchId != null) {
          const existing = await this.launches.findByLaunchId(launchId);
          if (existing) {
            await this.launches.upsertFromEvent({ ...existing, launchId });
          }
        }
        break;

      case 'launch_migrated':
        await this.launches.upsertFromEvent({
          launchId,
          status: LaunchStatus.MIGRATED,
          migratedAt: new Date(),
        });
        break;

      default:
        break;
    }
  }
}
