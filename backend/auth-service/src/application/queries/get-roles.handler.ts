import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetRolesQuery } from './get-roles.query';
import { RoleRepository } from '../../infrastructure/repositories/role.repository';
import { RolesListResponseDto } from '../dto/role.dto';

@QueryHandler(GetRolesQuery)
export class GetRolesQueryHandler implements IQueryHandler<GetRolesQuery> {
  constructor(private readonly roleRepository: RoleRepository) {}

  async execute(query: GetRolesQuery): Promise<RolesListResponseDto> {
    const { organizationId, options } = query;
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const { roles, total } = await this.roleRepository.findByOrganization(
      organizationId,
      {
        skip,
        take: limit,
        search: options?.search,
      },
    );

    return {
      roles: roles.map((role) => ({
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
      })),
      total,
      page,
      limit,
    };
  }
}
