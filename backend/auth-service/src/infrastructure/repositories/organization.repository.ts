import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { Organization } from '@prisma/client';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { slug } });
  }

  async findAll(): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string; slug: string }): Promise<Organization> {
    return this.prisma.organization.create({ data });
  }

  async update(
    id: string,
    data: Partial<{ name: string; slug: string; isActive: boolean }>,
  ): Promise<Organization> {
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.organization.delete({ where: { id } });
  }
}
