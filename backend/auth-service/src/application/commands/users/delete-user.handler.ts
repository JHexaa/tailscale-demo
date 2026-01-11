import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DeleteUserCommand } from './delete-user.command';
import { UserRepository } from '../../../infrastructure/repositories/user.repository';
import { RedisService } from '../../../infrastructure/services/redis.service';

@CommandHandler(DeleteUserCommand)
export class DeleteUserCommandHandler
  implements ICommandHandler<DeleteUserCommand>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(command: DeleteUserCommand): Promise<{ success: boolean }> {
    const { userId, organizationId, requesterId } = command;

    // Prevent self-deletion
    if (userId === requesterId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    // Find user
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify user belongs to the same organization
    if (user.organizationId !== organizationId) {
      throw new ForbiddenException('Cannot delete user from another organization');
    }

    // Delete user
    await this.userRepository.delete(userId);

    // Invalidate cached permissions
    await this.redisService.invalidateUserPermissions(userId);

    return { success: true };
  }
}
