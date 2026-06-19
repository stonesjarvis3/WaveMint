import { IsString, IsArray, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class CreateQuizDto {
  @IsString()
  courseId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @IsNumber()
  @IsOptional()
  timeLimit?: number; // in minutes
}

export class CreateQuestionDto {
  @IsString()
  quizId: string;

  @IsString()
  type: string; // "multiple_choice", "true_false", "short_answer"

  @IsString()
  question: string;

  @IsArray()
  @IsOptional()
  options?: string[];

  @IsString()
  correctAnswer: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  points?: number;

  @IsString()
  @IsOptional()
  explanation?: string;
}

export class SubmitQuizDto {
  @IsArray()
  answers: string[]; // Array of user's answers
}

export class QuizAttemptResultDto {
  id: string;
  quizId: string;
  score: number;
  maxScore: number;
  passed: boolean;
  timeSpent?: number;
  attemptNumber: number;
  createdAt: Date;
}

export class GetQuizDto {
  id: string;
  title: string;
  description?: string;
  questions: any[];
  passingScore: number;
  timeLimit?: number;
  createdAt: Date;
}
