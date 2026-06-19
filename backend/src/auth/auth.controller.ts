import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { IsString, IsNotEmpty } from 'class-validator';

class AuthenticateDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('authenticate')
  @ApiOperation({ summary: 'Authenticate with Stellar wallet' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async authenticate(@Body() dto: AuthenticateDto) {
    if (!dto.walletAddress.startsWith('G') || dto.walletAddress.length !== 56) {
      throw new BadRequestException('Invalid Stellar wallet address');
    }

    return this.authService.authenticateWithSignature(
      dto.walletAddress,
      dto.message,
      dto.signature,
      dto.username,
    );
  }

  @Post('verify-token')
  @ApiOperation({ summary: 'Verify JWT token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async verifyToken(@Body('token') token: string) {
    return this.authService.verifyToken(token);
  }
}
