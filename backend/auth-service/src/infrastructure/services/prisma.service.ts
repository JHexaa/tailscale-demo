import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase is not allowed in production');
    }

    await this.$transaction([
      this.refreshToken.deleteMany(),
      this.userRole.deleteMany(),
      this.rolePermission.deleteMany(),
      this.user.deleteMany(),
      this.role.deleteMany(),
      this.permission.deleteMany(),
      this.organization.deleteMany(),
    ]);
  }
}
