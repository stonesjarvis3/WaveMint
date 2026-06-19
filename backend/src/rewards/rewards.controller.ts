import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Rewards')
@Controller('rewards')
export class RewardsController {
  constructor(private rewardsService: RewardsService) {}

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user reward history' })
  @ApiResponse({ status: 200, description: 'Reward history retrieved' })
  async getRewardHistory(@Request() req: any) {
    return this.rewardsService.getUserRewardHistory(req.user.userId);
  }

  @Get('total')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get total rewards for user' })
  @ApiResponse({ status: 200, description: 'Total rewards calculated' })
  async getTotalRewards(@Request() req: any) {
    const total = await this.rewardsService.getTotalRewards(req.user.userId);
    return { totalXlm: total };
  }

  @Post('calculate-xp')
  @ApiOperation({ summary: 'Calculate XLM from XP' })
  @ApiResponse({ status: 200, description: 'Calculation successful' })
  async calculateXlmFromXp(@Body('xpAmount') xpAmount: string) {
    const xlm = this.rewardsService.calculateXlmFromXP(BigInt(xpAmount));
    return { xpAmount: BigInt(xpAmount), xlmAmount: xlm };
  }

  @Post('apply-streak-bonus')
  @ApiOperation({ summary: 'Calculate streak bonus' })
  @ApiResponse({ status: 200, description: 'Calculation successful' })
  async applyStreakBonus(
    @Body('baseAmount') baseAmount: number,
    @Body('streak') streak: number,
  ) {
    const bonusAmount = this.rewardsService.applyStreakBonus(baseAmount, streak);
    return { baseAmount, streak, bonusAmount };
  }

  @Get(':userId/total')
  @ApiOperation({ summary: 'Get total rewards for a user' })
  @ApiResponse({ status: 200, description: 'Total rewards retrieved' })
  async getUserTotalRewards(@Param('userId') userId: string) {
    const total = await this.rewardsService.getTotalRewards(userId);
    return { userId, totalXlm: total };
  }
}
