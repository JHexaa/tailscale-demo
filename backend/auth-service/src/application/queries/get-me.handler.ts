import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetMeQuery } from './get-me.query';
import { UserRepository } from '../../infrastructure/repositories/user.repository';

interface MeResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  roles: string[];
  permissions: string[];
}

@QueryHandler(GetMeQuery)
export class GetMeQueryHandler implements IQueryHandler<GetMeQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetMeQuery): Promise<MeResponse> {
    const { userId } = query;

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = new Set<string>();
    for (const userRole of user.userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        const { service, module, action } = rolePermission.permission;
        permissions.add(`${service}:${module}:${action}`);
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      organization: user.organization,
      roles,
      permissions: Array.from(permissions),
    };
  }
}
