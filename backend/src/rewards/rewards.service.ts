import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from '@stellar/stellar-sdk';

@Injectable()
export class RewardsService {
  private stellar: StellarSdk.Horizon.Server;
  private serverKeypair: StellarSdk.Keypair;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const horizonUrl = this.configService.get<string>('HORIZON_URL');
    this.stellar = new StellarSdk.Horizon.Server(horizonUrl);

    const serverSecret = this.configService.get<string>('SERVER_SECRET_KEY');
    if (serverSecret) {
      this.serverKeypair = StellarSdk.Keypair.fromSecret(serverSecret);
    }
  }

  /**
   * Calculate XLM reward from XP
   */
  calculateXlmFromXP(xpAmount: bigint): number {
    // 1 XP = 0.0000001 XLM (1 stroops)
    return Number(xpAmount) / 10_000_000;
  }

  /**
   * Apply streak bonus to reward
   */
  applyStreakBonus(baseAmount: number, streak: number): number {
    let bonusPercentage = 0;

    if (streak >= 100) bonusPercentage = 50;
    else if (streak >= 60) bonusPercentage = 35;
    else if (streak >= 30) bonusPercentage = 20;
    else if (streak >= 14) bonusPercentage = 10;
    else if (streak >= 7) bonusPercentage = 5;

    return baseAmount + baseAmount * (bonusPercentage / 100);
  }

  /**
   * Distribute course completion reward
   */
  async distributeCourseReward(userId: string, courseId: string, xpEarned: bigint): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const baseXlm = this.calculateXlmFromXP(xpEarned);
    const bonus = this.applyStreakBonus(baseXlm, user.currentStreak);
    const stroopAmount = Math.round(bonus * 10_000_000); // Convert to stroops

    // Record reward history
    const rewardHistory = await this.prisma.rewardHistory.create({
      data: {
        userId,
        amount: BigInt(stroopAmount),
        reason: 'course_completion',
      },
    });

    return {
      id: rewardHistory.id,
      amount: bonus,
      stroops: stroopAmount,
      reason: 'course_completion',
    };
  }

  /**
   * Distribute milestone reward
   */
  async distributeMilestoneReward(userId: string, xpTotal: bigint): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let milestoneReward = 0n;
    let milestoneName = '';

    if (xpTotal >= 5000n) {
      milestoneReward = 50_000_000n; // 5 XLM
      milestoneName = 'platinum';
    } else if (xpTotal >= 1000n) {
      milestoneReward = 10_000_000n; // 1 XLM
      milestoneName = 'gold';
    } else if (xpTotal >= 500n) {
      milestoneReward = 5_000_000n; // 0.5 XLM
      milestoneName = 'silver';
    } else if (xpTotal >= 100n) {
      milestoneReward = 1_000_000n; // 0.1 XLM
      milestoneName = 'bronze';
    }

    if (milestoneReward > 0n) {
      const rewardHistory = await this.prisma.rewardHistory.create({
        data: {
          userId,
          amount: milestoneReward,
          reason: 'milestone',
        },
      });

      return {
        id: rewardHistory.id,
        amount: Number(milestoneReward) / 10_000_000,
        stroops: milestoneReward,
        milestone: milestoneName,
        reason: 'milestone',
      };
    }

    return null;
  }

  /**
   * Distribute referral bonus
   */
  async distributeReferralBonus(userId: string, referrerAmount: bigint): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { referrer: true },
    });

    if (!user || !user.referrer) {
      return null;
    }

    const bonusAmount = (referrerAmount * 10n) / 100n; // 10% bonus

    const rewardHistory = await this.prisma.rewardHistory.create({
      data: {
        userId: user.referrer.id,
        amount: bonusAmount,
        reason: 'referral',
      },
    });

    return {
      id: rewardHistory.id,
      referredUser: userId,
      amount: Number(bonusAmount) / 10_000_000,
      stroops: bonusAmount,
      reason: 'referral',
    };
  }

  /**
   * Get user's reward history
   */
  async getUserRewardHistory(userId: string): Promise<any[]> {
    const rewards = await this.prisma.rewardHistory.findMany({
      where: { userId },
      orderBy: { distributedAt: 'desc' },
    });

    return rewards.map(reward => ({
      id: reward.id,
      amount: Number(reward.amount) / 10_000_000,
      stroops: reward.amount,
      reason: reward.reason,
      txHash: reward.contractTxHash,
      date: reward.distributedAt,
    }));
  }

  /**
   * Calculate total rewards for user
   */
  async getTotalRewards(userId: string): Promise<number> {
    const rewards = await this.prisma.rewardHistory.findMany({
      where: { userId },
    });

    const total = rewards.reduce((sum, r) => sum + r.amount, 0n);
    return Number(total) / 10_000_000;
  }

  /**
   * Distribute XLM to wallet (requires server secret key)
   */
  async sendXLMToWallet(destinationAddress: string, amountXlm: number): Promise<string> {
    if (!this.serverKeypair) {
      throw new BadRequestException('Server wallet not configured');
    }

    try {
      const account = await this.stellar.accounts().accountId(this.serverKeypair.publicKey()).call();

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.configService.get<string>('NETWORK_PASSPHRASE'),
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: destinationAddress,
            asset: StellarSdk.Asset.native(),
            amount: amountXlm.toString(),
          }),
        )
        .setTimeout(30)
        .build();

      transaction.sign(this.serverKeypair);
      const result = await this.stellar.submitTransaction(transaction);

      return result.hash;
    } catch (error) {
      throw new BadRequestException(`Failed to send XLM: ${error.message}`);
    }
  }

  /**
   * Record competition winners and distribute rewards
   */
  async distributeCompetitionRewards(
    period: 'weekly' | 'monthly',
    winners: Array<{ userId: string; position: number }>,
  ): Promise<any> {
    const rewards = [
      { position: 1, amount: 50_000_000n }, // 5 XLM
      { position: 2, amount: 30_000_000n }, // 3 XLM
      { position: 3, amount: 20_000_000n }, // 2 XLM
      { position: 4, amount: 10_000_000n }, // 1 XLM
      { position: 5, amount: 5_000_000n },  // 0.5 XLM
    ];

    const distributed = [];

    for (const winner of winners) {
      const rewardData = rewards.find(r => r.position === winner.position);

      if (rewardData) {
        const rewardHistory = await this.prisma.rewardHistory.create({
          data: {
            userId: winner.userId,
            amount: rewardData.amount,
            reason: `${period}_competition`,
          },
        });

        distributed.push({
          userId: winner.userId,
          position: winner.position,
          amount: Number(rewardData.amount) / 10_000_000,
          stroops: rewardData.amount,
        });
      }
    }

    return distributed;
  }
}
