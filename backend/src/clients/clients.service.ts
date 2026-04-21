import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async getPortal(userId: string, orgId: string) {
    const clientProfile = await this.prisma.clientProfile.findFirst({
      where: { userId, organizationId: orgId },
      include: {
        matters: {
          include: {
            matter: {
              include: {
                court: { select: { name: true, city: true } },
                hearings: {
                  where: { scheduledAt: { gte: new Date() } },
                  orderBy: { scheduledAt: 'asc' },
                  take: 3,
                },
                documents: {
                  where: { status: 'PROCESSED' },
                  select: { id: true, name: true, documentType: true, createdAt: true },
                  orderBy: { createdAt: 'desc' },
                  take: 10,
                },
                tasks: {
                  where: { status: { not: 'DONE' } },
                  select: { id: true, title: true, dueDate: true, status: true },
                  orderBy: { dueDate: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!clientProfile) throw new NotFoundException('Client profile not found');
    return clientProfile;
  }

  async getMatterForClient(matterId: string, userId: string, orgId: string) {
    const clientProfile = await this.prisma.clientProfile.findFirst({
      where: { userId, organizationId: orgId },
    });
    if (!clientProfile) throw new NotFoundException('Client profile not found');

    const matterClient = await this.prisma.matterClient.findFirst({
      where: { matterId, clientProfileId: clientProfile.id },
    });
    if (!matterClient) throw new NotFoundException('Matter not found or access denied');

    return this.prisma.matter.findUnique({
      where: { id: matterId },
      include: {
        court: true,
        parties: true,
        hearings: {
          orderBy: { scheduledAt: 'desc' },
          include: {
            notes: {
              where: { isPrivate: false },
              include: { author: { select: { firstName: true, lastName: true } } },
            },
          },
        },
        documents: {
          where: { status: 'PROCESSED' },
          select: {
            id: true, name: true, documentType: true, createdAt: true,
            uploadedBy: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        notes: { where: { isPrivate: false }, orderBy: { createdAt: 'desc' } },
        assignments: {
          include: {
            user: { select: { firstName: true, lastName: true, role: true, phone: true, email: true } },
          },
        },
      },
    });
  }

  async getAllClients(orgId: string) {
    return this.prisma.clientProfile.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        matters: {
          include: {
            matter: { select: { id: true, title: true, status: true, caseNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
