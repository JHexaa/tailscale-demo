import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenCommand } from './refresh-token.command';
import { UserRepository } from '../../../infrastructure/repositories/user.repository';
import { RefreshTokenRepository } from '../../../infrastructure/repositories/refresh-token.repository';
import { JwtTokenService } from '../../../infrastructure/services/jwt-token.service';

interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenCommandHandler
  implements ICommandHandler<RefreshTokenCommand>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    const { refreshToken } = command;

    // Find and validate refresh token
    const storedToken = await this.refreshTokenRepository.findActiveByToken(refreshToken);
    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Get user with relations
    const user = await this.userRepository.findById(storedToken.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Revoke old refresh token
    await this.refreshTokenRepository.revoke(refreshToken);

    // Extract roles and permissions
    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = new Set<string>();
    for (const userRole of user.userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        const { service, module, action } = rolePermission.permission;
        permissions.add(`${service}:${module}:${action}`);
      }
    }

    // Generate new token pair
    const tokenPair = await this.jwtTokenService.generateTokenPair({
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      organizationSlug: user.organization.slug,
      roles,
      permissions: Array.from(permissions),
    });

    // Store new refresh token
    await this.refreshTokenRepository.create({
      token: tokenPair.refreshToken,
      userId: user.id,
      expiresAt: this.jwtTokenService.getRefreshTokenExpiryDate(),
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
    };
  }
}
