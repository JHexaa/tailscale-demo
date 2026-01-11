import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { Permission } from '@prisma/client';

@Injectable()
export class PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      orderBy: [{ service: 'asc' }, { module: 'asc' }, { action: 'asc' }],
    });
  }

  async findById(id: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({ where: { id } });
  }

  async findByKey(
    service: string,
    module: string,
    action: string,
  ): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: {
        service_module_action: { service, module, action },
      },
    });
  }

  async findByService(service: string): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { service },
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  async findByIds(ids: string[]): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { id: { in: ids } },
    });
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        const { service, module, action } = rolePermission.permission;
        permissions.add(`${service}:${module}:${action}`);
      }
    }

    return Array.from(permissions);
  }

  async create(data: {
    service: string;
    module: string;
    action: string;
    description?: string;
  }): Promise<Permission> {
    return this.prisma.permission.create({ data });
  }

  async createMany(
    permissions: Array<{
      service: string;
      module: string;
      action: string;
      description?: string;
    }>,
  ): Promise<number> {
    const result = await this.prisma.permission.createMany({
      data: permissions,
      skipDuplicates: true,
    });
    return result.count;
  }
}
