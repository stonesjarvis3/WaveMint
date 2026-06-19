import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, GetUserDto } from './dto/user.dto';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto): Promise<GetUserDto> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { walletAddress: createUserDto.walletAddress },
    });

    if (existingUser) {
      throw new ConflictException('User with this wallet address already exists');
    }

    const usernameExists = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    });

    if (usernameExists) {
      throw new ConflictException('Username already taken');
    }

    if (createUserDto.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (emailExists) {
        throw new ConflictException('Email already registered');
      }
    }

    const user = await this.prisma.user.create({
      data: {
        walletAddress: createUserDto.walletAddress,
        username: createUserDto.username,
        email: createUserDto.email,
        displayName: createUserDto.displayName || createUserDto.username,
        bio: createUserDto.bio,
        avatarUrl: createUserDto.avatarUrl,
      },
    });

    return this.mapToDto(user);
  }

  async getUserByWallet(walletAddress: string): Promise<GetUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToDto(user);
  }

  async getUserById(id: string): Promise<GetUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToDto(user);
  }

  async getUserByUsername(username: string): Promise<GetUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToDto(user);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<GetUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return this.mapToDto(updatedUser);
  }

  async addXP(userId: string, xpAmount: bigint): Promise<bigint> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalXP: {
          increment: xpAmount,
        },
      },
    });

    return user.totalXP;
  }

  async updateStreak(userId: string, currentStreak: number, longestStreak: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak,
        longestStreak: Math.max(currentStreak, longestStreak),
        lastActivityDate: new Date(),
      },
    });
  }

  async incrementCoursesCompleted(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        coursesCompleted: {
          increment: 1,
        },
      },
    });
  }

  async getAllUsers(limit: number = 50, offset: number = 0): Promise<GetUserDto[]> {
    const users = await this.prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return users.map(user => this.mapToDto(user));
  }

  async getUsersWithReferrals(): Promise<any[]> {
    const users = await this.prisma.user.findMany({
      where: {
        referrals: {
          some: {},
        },
      },
      include: {
        referrals: true,
      },
    });

    return users;
  }

  private mapToDto(user: User): GetUserDto {
    return {
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      displayName: user.displayName || user.username,
      avatarUrl: user.avatarUrl,
      totalXP: user.totalXP,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      coursesCompleted: user.coursesCompleted,
      createdAt: user.createdAt,
    };
  }
}
