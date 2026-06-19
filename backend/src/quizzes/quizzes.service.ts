import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto, CreateQuestionDto, SubmitQuizDto, QuizAttemptResultDto, GetQuizDto } from './dto/quiz.dto';
import { Quiz, Question, QuizAttempt } from '@prisma/client';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  async createQuiz(createQuizDto: CreateQuizDto): Promise<GetQuizDto> {
    const course = await this.prisma.course.findUnique({
      where: { id: createQuizDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const quiz = await this.prisma.quiz.create({
      data: {
        courseId: createQuizDto.courseId,
        title: createQuizDto.title,
        description: createQuizDto.description,
        passingScore: createQuizDto.passingScore || 70,
        timeLimit: createQuizDto.timeLimit,
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return this.mapToDto(quiz);
  }

  async addQuestion(createQuestionDto: CreateQuestionDto): Promise<Question> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: createQuestionDto.quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const questionCount = await this.prisma.question.count({
      where: { quizId: createQuestionDto.quizId },
    });

    const question = await this.prisma.question.create({
      data: {
        quizId: createQuestionDto.quizId,
        type: createQuestionDto.type,
        question: createQuestionDto.question,
        options: createQuestionDto.options || [],
        correctAnswer: createQuestionDto.correctAnswer,
        order: questionCount + 1,
        points: createQuestionDto.points || 1,
        explanation: createQuestionDto.explanation,
      },
    });

    return question;
  }

  async getQuiz(id: string): Promise<GetQuizDto> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return this.mapToDto(quiz);
  }

  async getQuizzesByCourse(courseId: string): Promise<GetQuizDto[]> {
    const quizzes = await this.prisma.quiz.findMany({
      where: { courseId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return quizzes.map(quiz => this.mapToDto(quiz));
  }

  async submitQuiz(
    userId: string,
    quizId: string,
    submitQuizDto: SubmitQuizDto,
    timeSpent: number,
  ): Promise<QuizAttemptResultDto> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Calculate score
    let score = 0;
    let maxScore = 0;

    for (let i = 0; i < quiz.questions.length; i++) {
      const question = quiz.questions[i];
      maxScore += question.points;

      if (submitQuizDto.answers[i]) {
        // Normalize answers for comparison
        const userAnswer = String(submitQuizDto.answers[i]).trim().toLowerCase();
        const correctAnswer = String(question.correctAnswer).trim().toLowerCase();

        if (userAnswer === correctAnswer) {
          score += question.points;
        }
      }
    }

    const passed = score >= (quiz.passingScore / 100) * maxScore;

    // Get attempt number
    const attemptCount = await this.prisma.quizAttempt.count({
      where: {
        userId,
        quizId,
      },
    });

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        score,
        maxScore,
        passed,
        timeSpent,
        attemptNumber: attemptCount + 1,
        answers: JSON.stringify(submitQuizDto.answers),
      },
    });

    return this.mapAttemptToDto(attempt);
  }

  async getUserAttempts(userId: string, quizId: string): Promise<QuizAttemptResultDto[]> {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        userId,
        quizId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return attempts.map(attempt => this.mapAttemptToDto(attempt));
  }

  async getBestAttempt(userId: string, quizId: string): Promise<QuizAttemptResultDto | null> {
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: {
        userId,
        quizId,
        passed: true,
      },
      orderBy: { score: 'desc' },
    });

    return attempt ? this.mapAttemptToDto(attempt) : null;
  }

  private mapToDto(quiz: Quiz & { questions: Question[] }): GetQuizDto {
    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description || undefined,
      questions: quiz.questions,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit || undefined,
      createdAt: quiz.createdAt,
    };
  }

  private mapAttemptToDto(attempt: QuizAttempt): QuizAttemptResultDto {
    return {
      id: attempt.id,
      quizId: attempt.quizId,
      score: attempt.score,
      maxScore: attempt.maxScore,
      passed: attempt.passed,
      timeSpent: attempt.timeSpent || undefined,
      attemptNumber: attempt.attemptNumber,
      createdAt: attempt.createdAt,
    };
  }
}
