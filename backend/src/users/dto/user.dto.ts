import { IsString, IsEmail, IsOptional, Length, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(3, 42)
  username: string;

  @IsString()
  walletAddress: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Length(1, 100)
  displayName?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  displayName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class GetUserDto {
  id: string;
  walletAddress: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  totalXP: bigint;
  currentStreak: number;
  longestStreak: number;
  coursesCompleted: number;
  createdAt: Date;
}
