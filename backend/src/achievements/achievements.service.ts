import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AchievementsService {
  constructor(private prisma: PrismaService) {}

  async awardBadge(userId: string, badgeId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    const achievement = await this.prisma.userAchievement.create({
      data: {
        userId,
        badgeId,
      },
    });

    return achievement;
  }

  async getUserAchievements(userId: string): Promise<any> {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
  }

  async getUserBadgeCount(userId: string): Promise<number> {
    return this.prisma.userAchievement.count({
      where: { userId },
    });
  }

  async issueCertificate(
    userId: string,
    courseId: string,
    courseName: string,
    metadataUri: string,
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const certificate = await this.prisma.certificate.create({
      data: {
        userId,
        certificateNumber: `WAVEMINT-${Date.now()}-${userId.substring(0, 8)}`,
        verificationCode: this.generateVerificationCode(),
        ipfsHash: metadataUri,
      },
    });

    return certificate;
  }

  async getCertificates(userId: string): Promise<any> {
    return this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async verifyCertificate(verificationCode: string): Promise<any> {
    const certificate = await this.prisma.certificate.findUnique({
      where: { verificationCode },
      include: { user: true },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    return certificate;
  }

  private generateVerificationCode(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`.toUpperCase();
  }
}
