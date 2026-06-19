import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, GetUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<GetUserDto> {
    return this.usersService.createUser(createUserDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string): Promise<GetUserDto> {
    return this.usersService.getUserById(id);
  }

  @Get('wallet/:address')
  @ApiOperation({ summary: 'Get user by wallet address' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByWallet(@Param('address') address: string): Promise<GetUserDto> {
    if (!address.startsWith('G')) {
      throw new BadRequestException('Invalid Stellar wallet address');
    }
    return this.usersService.getUserByWallet(address);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get user by username' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByUsername(@Param('username') username: string): Promise<GetUserDto> {
    return this.usersService.getUserByUsername(username);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ): Promise<GetUserDto> {
    // Verify user is updating their own profile
    if (req.user.userId !== id) {
      throw new BadRequestException('Cannot update another user\'s profile');
    }
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users (paginated)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(
    @Param('limit') limit: string = '50',
    @Param('offset') offset: string = '0',
  ): Promise<GetUserDto[]> {
    return this.usersService.getAllUsers(parseInt(limit), parseInt(offset));
  }
}
