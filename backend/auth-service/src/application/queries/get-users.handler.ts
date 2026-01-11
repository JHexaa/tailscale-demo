import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUsersQuery } from './get-users.query';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { UsersListResponseDto } from '../dto/user.dto';

@QueryHandler(GetUsersQuery)
export class GetUsersQueryHandler implements IQueryHandler<GetUsersQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUsersQuery): Promise<UsersListResponseDto> {
    const { organizationId, options } = query;
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const { users, total } = await this.userRepository.findByOrganization(
      organizationId,
      {
        skip,
        take: limit,
        search: options?.search,
      },
    );

    return {
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        organization: user.organization,
        roles: user.userRoles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
        })),
      })),
      total,
      page,
      limit,
    };
  }
}
