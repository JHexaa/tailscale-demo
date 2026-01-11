import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';

interface AuthServiceClient {
  validateToken(data: { token: string }): Observable<ValidateTokenResponse>;
  checkPermission(data: {
    userId: string;
    permission: string;
  }): Observable<CheckPermissionResponse>;
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

interface CheckPermissionResponse {
  hasPermission: boolean;
}

export interface AuthUser {
  userId: string;
  email: string;
  organizationId: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class AuthService implements OnModuleInit {
  private authClient: AuthServiceClient;

  constructor(@Inject('AUTH_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.authClient = this.client.getService<AuthServiceClient>('AuthService');
  }

  async validateToken(token: string): Promise<AuthUser | null> {
    try {
      const response = await firstValueFrom(
        this.authClient.validateToken({ token }),
      );

      if (!response.valid) {
        return null;
      }

      return {
        userId: response.userId!,
        email: response.email!,
        organizationId: response.organizationId!,
        roles: response.roles || [],
        permissions: response.permissions || [],
      };
    } catch {
      return null;
    }
  }

  async checkPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.authClient.checkPermission({ userId, permission }),
      );
      return response.hasPermission;
    } catch {
      return false;
    }
  }
}
