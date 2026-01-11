import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserDto, UpdateUserDto } from '../application/dto/user.dto';
import { CreateUserCommand } from '../application/commands/users/create-user.command';
import { UpdateUserCommand } from '../application/commands/users/update-user.command';
import { DeleteUserCommand } from '../application/commands/users/delete-user.command';
import { GetUserQuery } from '../application/queries/get-user.query';
import { GetUsersQuery } from '../application/queries/get-users.query';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermission } from './decorators/require-permission.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from '../infrastructure/services/jwt-token.service';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @RequirePermission('auth:users:read')
  async getUsers(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.queryBus.execute(
      new GetUsersQuery(user.organizationId, { page, limit, search }),
    );
  }

  @Get(':id')
  @RequirePermission('auth:users:read')
  async getUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.queryBus.execute(new GetUserQuery(id, user.organizationId));
  }

  @Post()
  @RequirePermission('auth:users:create')
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new CreateUserCommand(
        dto.email,
        dto.password,
        dto.firstName,
        dto.lastName,
        user.organizationId,
        dto.roleIds,
      ),
    );
  }

  @Patch(':id')
  @RequirePermission('auth:users:update')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new UpdateUserCommand(id, user.organizationId, dto),
    );
  }

  @Delete(':id')
  @RequirePermission('auth:users:delete')
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new DeleteUserCommand(id, user.organizationId, user.sub),
    );
  }
}
