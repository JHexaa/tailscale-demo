import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { LoginCommand } from './login.command';
import { UserRepository } from '../../../infrastructure/repositories/user.repository';
import { OrganizationRepository } from '../../../infrastructure/repositories/organization.repository';
import { RefreshTokenRepository } from '../../../infrastructure/repositories/refresh-token.repository';
import { BcryptService } from '../../../infrastructure/services/bcrypt.service';
import { JwtTokenService } from '../../../infrastructure/services/jwt-token.service';
import { AuthResponseDto } from '../../dto/auth.dto';

@CommandHandler(LoginCommand)
export class LoginCommandHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly bcryptService: BcryptService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async execute(command: LoginCommand): Promise<AuthResponseDto> {
    const { email, password, organizationSlug } = command;

    // Find organization by slug
    const organization = await this.organizationRepository.findBySlug(organizationSlug);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Find user by email and organization
    const user = await this.userRepository.findByEmailAndOrganization(
      email,
      organization.id,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is disabled');
    }

    // Verify password
    const isPasswordValid = await this.bcryptService.compare(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Extract roles and permissions
    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = new Set<string>();
    for (const userRole of user.userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        const { service, module, action } = rolePermission.permission;
        permissions.add(`${service}:${module}:${action}`);
      }
    }

    // Generate tokens
    const tokenPair = await this.jwtTokenService.generateTokenPair({
      sub: user.id,
      email: user.email,
      organizationId: organization.id,
      organizationSlug: organization.slug,
      roles,
      permissions: Array.from(permissions),
    });

    // Store refresh token
    await this.refreshTokenRepository.create({
      token: tokenPair.refreshToken,
      userId: user.id,
      expiresAt: this.jwtTokenService.getRefreshTokenExpiryDate(),
    });

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
        roles,
        permissions: Array.from(permissions),
      },
    };
  }
}
