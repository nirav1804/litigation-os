// organizations/organizations.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findOne(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: { select: { users: true, matters: true } },
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(orgId: string, data: Partial<{
    name: string;
    logoUrl: string;
    website: string;
    phone: string;
    address: string;
    barCouncil: string;
    gstin: string;
  }>) {
    return this.prisma.organization.update({ where: { id: orgId }, data });
  }

  async getCourts(orgId: string) {
    return this.prisma.court.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    });
  }

  async createCourt(orgId: string, data: {
    name: string;
    shortName?: string;
    city: string;
    state: string;
    courtType: string;
    benchType?: string;
  }) {
    return this.prisma.court.create({ data: { ...data, organizationId: orgId } });
  }

  async updateCourt(courtId: string, orgId: string, data: any) {
    const court = await this.prisma.court.findFirst({ where: { id: courtId, organizationId: orgId } });
    if (!court) throw new NotFoundException('Court not found');
    return this.prisma.court.update({ where: { id: courtId }, data });
  }

  async deleteCourt(courtId: string, orgId: string) {
    const court = await this.prisma.court.findFirst({ where: { id: courtId, organizationId: orgId } });
    if (!court) throw new NotFoundException('Court not found');
    await this.prisma.court.delete({ where: { id: courtId } });
    return { message: 'Court deleted' };
  }
}
