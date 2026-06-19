import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, EnrollCourseDto, UpdateProgressDto, GetCourseDto } from './dto/course.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CourseEnrollment } from '@prisma/client';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
    @Request() req: any,
  ): Promise<GetCourseDto> {
    return this.coursesService.createCourse(req.user.userId, createCourseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all published courses' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  async getAllCourses(
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
  ): Promise<GetCourseDto[]> {
    return this.coursesService.getAllCourses(
      parseInt(limit),
      parseInt(offset),
      category,
      difficulty,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({ status: 200, description: 'Course found' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourse(@Param('id') id: string): Promise<GetCourseDto> {
    return this.coursesService.getCourseById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a course' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async updateCourse(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Request() req: any,
  ): Promise<GetCourseDto> {
    return this.coursesService.updateCourse(id, updateCourseDto);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enroll in a course' })
  @ApiResponse({ status: 201, description: 'Enrolled successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 409, description: 'Already enrolled' })
  async enrollCourse(
    @Param('id') courseId: string,
    @Request() req: any,
  ): Promise<CourseEnrollment> {
    return this.coursesService.enrollCourse(req.user.userId, courseId);
  }

  @Put(':id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course progress' })
  @ApiResponse({ status: 200, description: 'Progress updated successfully' })
  async updateProgress(
    @Param('id') courseId: string,
    @Body() updateProgressDto: UpdateProgressDto,
    @Request() req: any,
  ): Promise<CourseEnrollment> {
    return this.coursesService.updateProgress(req.user.userId, courseId, updateProgressDto);
  }

  @Get('my/enrollments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user enrollments' })
  @ApiResponse({ status: 200, description: 'Enrollments retrieved successfully' })
  async getUserEnrollments(@Request() req: any): Promise<CourseEnrollment[]> {
    return this.coursesService.getUserEnrollments(req.user.userId);
  }
}
