import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { Role, Prisma } from '@prisma/client';

export interface RoleWithPermissions extends Role {
  rolePermissions: {
    permission: {
      id: string;
      service: string;
      module: string;
      action: string;
      description: string | null;
    };
  }[];
  _count: {
    userRoles: number;
  };
}

@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RoleWithPermissions | null> {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { userRoles: true },
        },
      },
    });
  }

  async findByOrganization(
    organizationId: string,
    options?: {
      skip?: number;
      take?: number;
      search?: string;
    },
  ): Promise<{ roles: RoleWithPermissions[]; total: number }> {
    const where: Prisma.RoleWhereInput = {
      organizationId,
      ...(options?.search && {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: { userRoles: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.role.count({ where }),
    ]);

    return { roles, total };
  }

  async findByNameAndOrganization(
    name: string,
    organizationId: string,
  ): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: {
        name_organizationId: { name, organizationId },
      },
    });
  }

  async create(data: {
    name: string;
    description?: string;
    organizationId: string;
    permissionIds?: string[];
    isSystem?: boolean;
  }): Promise<Role> {
    return this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        organizationId: data.organizationId,
        isSystem: data.isSystem ?? false,
        rolePermissions: data.permissionIds
          ? {
              create: data.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      permissionIds: string[];
    }>,
  ): Promise<Role> {
    const { permissionIds, ...roleData } = data;

    if (permissionIds !== undefined) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
      if (permissionIds.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: roleData,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({ where: { id } });
  }

  async isSystemRole(id: string): Promise<boolean> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: { isSystem: true },
    });
    return role?.isSystem ?? false;
  }
}
