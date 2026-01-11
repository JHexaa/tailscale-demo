import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { JwtTokenService } from '../infrastructure/services/jwt-token.service';
import { PermissionRepository } from '../infrastructure/repositories/permission.repository';
import { RedisService } from '../infrastructure/services/redis.service';

interface ValidateTokenRequest {
  token: string;
}

interface ValidateTokenResponse {
  valid: boolean;
  userId?: string;
  email?: string;
  organizationId?: string;
  roles?: string[];
  permissions?: string[];
  error?: string;
}

interface CheckPermissionRequest {
  userId: string;
  permission: string;
}

interface CheckPermissionResponse {
  hasPermission: boolean;
}

@Controller()
export class AuthGrpcController {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly permissionRepository: PermissionRepository,
    private readonly redisService: RedisService,
  ) {}

  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken(
    request: ValidateTokenRequest,
  ): Promise<ValidateTokenResponse> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.redisService.isBlacklisted(request.token);
      if (isBlacklisted) {
        return { valid: false, error: 'Token has been revoked' };
      }

      const payload = await this.jwtTokenService.verifyAccessToken(request.token);

      return {
        valid: true,
        userId: payload.sub,
        email: payload.email,
        organizationId: payload.organizationId,
        roles: payload.roles,
        permissions: payload.permissions,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid token',
      };
    }
  }

  @GrpcMethod('AuthService', 'CheckPermission')
  async checkPermission(
    request: CheckPermissionRequest,
  ): Promise<CheckPermissionResponse> {
    const { userId, permission } = request;

    // Try to get cached permissions
    let permissions = await this.redisService.getCachedUserPermissions(userId);

    if (!permissions) {
      // Fetch from database and cache
      permissions = await this.permissionRepository.getUserPermissions(userId);
      await this.redisService.cacheUserPermissions(userId, permissions);
    }

    return {
      hasPermission: permissions.includes(permission),
    };
  }
}
