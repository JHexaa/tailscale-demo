import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { User, Prisma } from '@prisma/client';

export interface UserWithRelations extends User {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  userRoles: {
    role: {
      id: string;
      name: string;
      rolePermissions: {
        permission: {
          id: string;
          service: string;
          module: string;
          action: string;
        };
      }[];
    };
  }[];
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserWithRelations | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
        userRoles: {
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
        },
      },
    });
  }

  async findByEmailAndOrganization(
    email: string,
    organizationId: string,
  ): Promise<UserWithRelations | null> {
    return this.prisma.user.findUnique({
      where: {
        email_organizationId: { email, organizationId },
      },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
        userRoles: {
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
  ): Promise<{ users: UserWithRelations[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      organizationId,
      ...(options?.search && {
        OR: [
          { email: { contains: options.search, mode: 'insensitive' } },
          { firstName: { contains: options.search, mode: 'insensitive' } },
          { lastName: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
          userRoles: {
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
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    organizationId: string;
    roleIds?: string[];
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationId: data.organizationId,
        userRoles: data.roleIds
          ? {
              create: data.roleIds.map((roleId) => ({ roleId })),
            }
          : undefined,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      isActive: boolean;
      roleIds: string[];
    }>,
  ): Promise<User> {
    const { roleIds, ...userData } = data;

    if (roleIds !== undefined) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      if (roleIds.length > 0) {
        await this.prisma.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: userData,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
