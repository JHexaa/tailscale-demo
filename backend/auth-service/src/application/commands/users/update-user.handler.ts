import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateUserCommand } from './update-user.command';
import { UserRepository } from '../../../infrastructure/repositories/user.repository';
import { RedisService } from '../../../infrastructure/services/redis.service';
import { User } from '@prisma/client';

@CommandHandler(UpdateUserCommand)
export class UpdateUserCommandHandler
  implements ICommandHandler<UpdateUserCommand>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const { userId, organizationId, data } = command;

    // Find user
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify user belongs to the same organization
    if (user.organizationId !== organizationId) {
      throw new ForbiddenException('Cannot update user from another organization');
    }

    // Update user
    const updatedUser = await this.userRepository.update(userId, data);

    // Invalidate cached permissions if roles changed
    if (data.roleIds !== undefined) {
      await this.redisService.invalidateUserPermissions(userId);
    }

    return updatedUser;
  }
}
