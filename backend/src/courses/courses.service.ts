import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto, EnrollCourseDto, UpdateProgressDto, GetCourseDto } from './dto/course.dto';
import { Course, CourseEnrollment } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async createCourse(userId: string, createCourseDto: CreateCourseDto): Promise<GetCourseDto> {
    const course = await this.prisma.course.create({
      data: {
        title: createCourseDto.title,
        description: createCourseDto.description,
        content: createCourseDto.content,
        category: createCourseDto.category,
        difficulty: createCourseDto.difficulty,
        xpReward: BigInt(createCourseDto.xpReward),
        createdBy: userId,
        imageUrl: createCourseDto.imageUrl,
        duration: createCourseDto.duration,
        skillsTaught: createCourseDto.skillsTaught || [],
        published: createCourseDto.published || false,
      },
    });

    return this.mapToDto(course);
  }

  async getCourseById(id: string): Promise<GetCourseDto> {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.mapToDto(course);
  }

  async getAllCourses(
    limit: number = 50,
    offset: number = 0,
    category?: string,
    difficulty?: string,
  ): Promise<GetCourseDto[]> {
    const where: any = { published: true };

    if (category) {
      where.category = category;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    const courses = await this.prisma.course.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return courses.map(course => this.mapToDto(course));
  }

  async getCoursesByCreator(creatorId: string): Promise<GetCourseDto[]> {
    const courses = await this.prisma.course.findMany({
      where: { createdBy: creatorId },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map(course => this.mapToDto(course));
  }

  async updateCourse(id: string, updateCourseDto: UpdateCourseDto): Promise<GetCourseDto> {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const data: any = { ...updateCourseDto };
    if (updateCourseDto.xpReward !== undefined) {
      data.xpReward = BigInt(updateCourseDto.xpReward);
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id },
      data,
    });

    return this.mapToDto(updatedCourse);
  }

  async enrollCourse(userId: string, courseId: string): Promise<CourseEnrollment> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (!course.published) {
      throw new BadRequestException('This course is not published yet');
    }

    const existingEnrollment = await this.prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('Already enrolled in this course');
    }

    const enrollment = await this.prisma.courseEnrollment.create({
      data: {
        userId,
        courseId,
      },
    });

    return enrollment;
  }

  async updateProgress(
    userId: string,
    courseId: string,
    updateProgressDto: UpdateProgressDto,
  ): Promise<CourseEnrollment> {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const updatedEnrollment = await this.prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        completionPercentage: updateProgressDto.completionPercentage,
        lessonsCompleted: updateProgressDto.lessonsCompleted,
        completed: updateProgressDto.completionPercentage >= 100,
        completedAt: updateProgressDto.completionPercentage >= 100 ? new Date() : null,
      },
    });

    return updatedEnrollment;
  }

  async completeLesson(userId: string, courseId: string, lessonId: string): Promise<void> {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson || lesson.courseId !== courseId) {
      throw new NotFoundException('Lesson not found');
    }

    await this.prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        lessonsCompleted: {
          increment: 1,
        },
      },
    });
  }

  async getUserEnrollments(userId: string): Promise<CourseEnrollment[]> {
    return this.prisma.courseEnrollment.findMany({
      where: { userId },
      include: { course: true },
    });
  }

  async getEnrollmentStats(userId: string): Promise<any> {
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { userId },
    });

    return {
      totalEnrolled: enrollments.length,
      completed: enrollments.filter(e => e.completed).length,
      inProgress: enrollments.filter(e => !e.completed).length,
      totalXpEarned: enrollments.reduce((sum, e) => sum + Number(e.xpEarned), 0),
    };
  }

  private mapToDto(course: Course): GetCourseDto {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty,
      xpReward: course.xpReward,
      imageUrl: course.imageUrl,
      duration: course.duration,
      skillsTaught: course.skillsTaught,
      published: course.published,
      createdAt: course.createdAt,
    };
  }
}
