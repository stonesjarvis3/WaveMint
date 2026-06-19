import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min, Max, Length } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @Length(3, 200)
  title: string;

  @IsString()
  @Length(10, 2000)
  description: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  category: string;

  @IsString()
  difficulty: string; // "beginner", "intermediate", "advanced", "expert"

  @IsNumber()
  @Min(10)
  xpReward: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsNumber()
  @IsOptional()
  @Min(5)
  duration?: number;

  @IsArray()
  @IsOptional()
  skillsTaught?: string[];

  @IsBoolean()
  @IsOptional()
  published?: boolean;
}

export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  @Length(3, 200)
  title?: string;

  @IsString()
  @IsOptional()
  @Length(10, 2000)
  description?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsNumber()
  @IsOptional()
  @Min(10)
  xpReward?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsArray()
  @IsOptional()
  skillsTaught?: string[];
}

export class EnrollCourseDto {
  @IsString()
  courseId: string;
}

export class UpdateProgressDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage: number;

  @IsNumber()
  @Min(0)
  lessonsCompleted: number;
}

export class GetCourseDto {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  xpReward: bigint;
  imageUrl?: string;
  duration?: number;
  skillsTaught: string[];
  published: boolean;
  createdAt: Date;
}
