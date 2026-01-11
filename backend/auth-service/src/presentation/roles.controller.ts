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
  BadRequestException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateRoleDto, UpdateRoleDto } from '../application/dto/role.dto';
import { GetRolesQuery } from '../application/queries/get-roles.query';
import { GetPermissionsQuery } from '../application/queries/get-permissions.query';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermission } from './decorators/require-permission.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from '../infrastructure/services/jwt-token.service';
import { RoleRepository } from '../infrastructure/repositories/role.repository';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly roleRepository: RoleRepository,
  ) {}

  @Get()
  @RequirePermission('auth:roles:read')
  async getRoles(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.queryBus.execute(
      new GetRolesQuery(user.organizationId, { page, limit, search }),
    );
  }

  @Get('permissions')
  @RequirePermission('auth:roles:read')
  async getPermissions(@Query('service') service?: string) {
    return this.queryBus.execute(new GetPermissionsQuery(service));
  }

  @Get(':id')
  @RequirePermission('auth:roles:read')
  async getRole(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const role = await this.roleRepository.findById(id);
    if (!role || role.organizationId !== user.organizationId) {
      throw new BadRequestException('Role not found');
    }
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        key: `${rp.permission.service}:${rp.permission.module}:${rp.permission.action}`,
        description: rp.permission.description,
      })),
      usersCount: role._count.userRoles,
    };
  }

  @Post()
  @RequirePermission('auth:roles:create')
  async createRole(
    @Body() dto: CreateRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.roleRepository.create({
      name: dto.name,
      description: dto.description,
      organizationId: user.organizationId,
      permissionIds: dto.permissionIds,
    });
  }

  @Patch(':id')
  @RequirePermission('auth:roles:update')
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const role = await this.roleRepository.findById(id);
    if (!role || role.organizationId !== user.organizationId) {
      throw new BadRequestException('Role not found');
    }
    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system role');
    }
    return this.roleRepository.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('auth:roles:delete')
  async deleteRole(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const role = await this.roleRepository.findById(id);
    if (!role || role.organizationId !== user.organizationId) {
      throw new BadRequestException('Role not found');
    }
    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system role');
    }
    if (role._count.userRoles > 0) {
      throw new BadRequestException('Cannot delete role with assigned users');
    }
    await this.roleRepository.delete(id);
    return { success: true };
  }
}
