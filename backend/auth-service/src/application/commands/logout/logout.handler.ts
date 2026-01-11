import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LogoutCommand } from './logout.command';
import { RefreshTokenRepository } from '../../../infrastructure/repositories/refresh-token.repository';
import { RedisService } from '../../../infrastructure/services/redis.service';

@CommandHandler(LogoutCommand)
export class LogoutCommandHandler implements ICommandHandler<LogoutCommand> {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(command: LogoutCommand): Promise<{ success: boolean }> {
    const { refreshToken, userId } = command;

    // Revoke the refresh token
    const token = await this.refreshTokenRepository.findByToken(refreshToken);
    if (token) {
      await this.refreshTokenRepository.revoke(refreshToken);
    }

    // Invalidate cached permissions
    await this.redisService.invalidateUserPermissions(userId);

    return { success: true };
  }
}
