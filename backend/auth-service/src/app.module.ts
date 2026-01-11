import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';

// Infrastructure
import { PrismaService } from './infrastructure/services/prisma.service';
import { BcryptService } from './infrastructure/services/bcrypt.service';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';
import { RedisService } from './infrastructure/services/redis.service';

// Repositories
import { UserRepository } from './infrastructure/repositories/user.repository';
import { RoleRepository } from './infrastructure/repositories/role.repository';
import { PermissionRepository } from './infrastructure/repositories/permission.repository';
import { RefreshTokenRepository } from './infrastructure/repositories/refresh-token.repository';
import { OrganizationRepository } from './infrastructure/repositories/organization.repository';

// Command Handlers
import { LoginCommandHandler } from './application/commands/login/login.handler';
import { LogoutCommandHandler } from './application/commands/logout/logout.handler';
import { RefreshTokenCommandHandler } from './application/commands/refresh-token/refresh-token.handler';
import { CreateUserCommandHandler } from './application/commands/users/create-user.handler';
import { UpdateUserCommandHandler } from './application/commands/users/update-user.handler';
import { DeleteUserCommandHandler } from './application/commands/users/delete-user.handler';

// Query Handlers
import { GetUserQueryHandler } from './application/queries/get-user.handler';
import { GetUsersQueryHandler } from './application/queries/get-users.handler';
import { GetRolesQueryHandler } from './application/queries/get-roles.handler';
import { GetPermissionsQueryHandler } from './application/queries/get-permissions.handler';
import { GetMeQueryHandler } from './application/queries/get-me.handler';

// Presentation
import { AuthController } from './presentation/auth.controller';
import { UsersController } from './presentation/users.controller';
import { RolesController } from './presentation/roles.controller';
import { AuthGrpcController } from './presentation/auth.grpc.controller';

const CommandHandlers = [
  LoginCommandHandler,
  LogoutCommandHandler,
  RefreshTokenCommandHandler,
  CreateUserCommandHandler,
  UpdateUserCommandHandler,
  DeleteUserCommandHandler,
];

const QueryHandlers = [
  GetUserQueryHandler,
  GetUsersQueryHandler,
  GetRolesQueryHandler,
  GetPermissionsQueryHandler,
  GetMeQueryHandler,
];

const Repositories = [
  UserRepository,
  RoleRepository,
  PermissionRepository,
  RefreshTokenRepository,
  OrganizationRepository,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    CqrsModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [
    AuthController,
    UsersController,
    RolesController,
    AuthGrpcController,
  ],
  providers: [
    // Infrastructure Services
    PrismaService,
    BcryptService,
    JwtTokenService,
    RedisService,
    // Repositories
    ...Repositories,
    // CQRS Handlers
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [PrismaService, JwtTokenService],
})
export class AppModule {}
