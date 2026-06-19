import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto, CreateQuestionDto, SubmitQuizDto, QuizAttemptResultDto, GetQuizDto } from './dto/quiz.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Question } from '@prisma/client';

@ApiTags('Quizzes')
@Controller('quizzes')
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new quiz' })
  @ApiResponse({ status: 201, description: 'Quiz created successfully' })
  async createQuiz(@Body() createQuizDto: CreateQuizDto): Promise<GetQuizDto> {
    return this.quizzesService.createQuiz(createQuizDto);
  }

  @Post(':id/questions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a question to a quiz' })
  @ApiResponse({ status: 201, description: 'Question added successfully' })
  async addQuestion(@Param('id') quizId: string, @Body() createQuestionDto: CreateQuestionDto): Promise<Question> {
    createQuestionDto.quizId = quizId;
    return this.quizzesService.addQuestion(createQuestionDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by ID' })
  @ApiResponse({ status: 200, description: 'Quiz found' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async getQuiz(@Param('id') id: string): Promise<GetQuizDto> {
    return this.quizzesService.getQuiz(id);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all quizzes for a course' })
  @ApiResponse({ status: 200, description: 'Quizzes retrieved successfully' })
  async getQuizzesByCourse(@Param('courseId') courseId: string): Promise<GetQuizDto[]> {
    return this.quizzesService.getQuizzesByCourse(courseId);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit quiz answers' })
  @ApiResponse({ status: 200, description: 'Quiz submitted successfully' })
  async submitQuiz(
    @Param('id') quizId: string,
    @Body() submitQuizDto: SubmitQuizDto,
    @Query('timeSpent') timeSpent: string = '0',
    @Request() req: any,
  ): Promise<QuizAttemptResultDto> {
    return this.quizzesService.submitQuiz(req.user.userId, quizId, submitQuizDto, parseInt(timeSpent));
  }

  @Get('my/:quizId/attempts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user attempts for a quiz' })
  @ApiResponse({ status: 200, description: 'Attempts retrieved successfully' })
  async getUserAttempts(
    @Param('quizId') quizId: string,
    @Request() req: any,
  ): Promise<QuizAttemptResultDto[]> {
    return this.quizzesService.getUserAttempts(req.user.userId, quizId);
  }

  @Get('my/:quizId/best')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get best attempt for a quiz' })
  @ApiResponse({ status: 200, description: 'Best attempt retrieved' })
  async getBestAttempt(
    @Param('quizId') quizId: string,
    @Request() req: any,
  ): Promise<QuizAttemptResultDto | null> {
    return this.quizzesService.getBestAttempt(req.user.userId, quizId);
  }
}
