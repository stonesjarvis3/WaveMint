import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import * as StellarSdk from '@stellar/stellar-sdk';

export interface AuthPayload {
  userId: string;
  walletAddress: string;
  username: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  /**
   * Verify Stellar wallet signature for authentication
   */
  async verifySignature(
    walletAddress: string,
    message: string,
    signature: string,
  ): Promise<boolean> {
    try {
      const publicKey = walletAddress;
      const keypair = StellarSdk.Keypair.fromPublicKey(publicKey);

      return keypair.verify(Buffer.from(message, 'utf-8'), Buffer.from(signature, 'base64'));
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate JWT token for authenticated user
   */
  async generateToken(user: any): Promise<string> {
    const payload: AuthPayload = {
      userId: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '24h',
    });
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(user: any): Promise<string> {
    const payload: AuthPayload = {
      userId: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: 'refresh-token-secret',
    });
  }

  /**
   * Authenticate user with wallet signature
   */
  async authenticateWithSignature(
    walletAddress: string,
    message: string,
    signature: string,
    username: string,
  ): Promise<{ access_token: string; refresh_token: string; user: any }> {
    // Verify signature
    const isValid = await this.verifySignature(walletAddress, message, signature);

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Get or create user
    let user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          walletAddress,
          username: username || walletAddress.substring(0, 10),
          displayName: username || 'User',
        },
      });
    }

    // Generate tokens
    const access_token = await this.generateToken(user);
    const refresh_token = await this.generateRefreshToken(user);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        displayName: user.displayName,
      },
    };
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<AuthPayload> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
