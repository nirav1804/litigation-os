import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HearingStatus, HearingOutcome } from '@prisma/client';

@Injectable()
export class HearingsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    matterId: string;
    scheduledAt: string;
    courtRoom?: string;
    purpose?: string;
  }, userId: string, orgId: string) {
    const matter = await this.prisma.matter.findFirst({
      where: { id: data.matterId, organizationId: orgId },
    });
    if (!matter) throw new NotFoundException('Matter not found');

    const hearing = await this.prisma.hearing.create({
      data: {
        matterId: data.matterId,
        scheduledAt: new Date(data.scheduledAt),
        courtRoom: data.courtRoom,
        purpose: data.purpose,
        status: HearingStatus.SCHEDULED,
      },
      include: this.defaultInclude(),
    });

    // Update matter's next hearing date
    await this.prisma.matter.update({
      where: { id: data.matterId },
      data: { nextHearingDate: new Date(data.scheduledAt) },
    });

    // Create timeline event
    await this.prisma.timelineEvent.create({
      data: {
        matterId: data.matterId,
        createdById: userId,
        eventDate: new Date(data.scheduledAt),
        title: 'Hearing Scheduled',
        description: `Hearing scheduled for ${new Date(data.scheduledAt).toDateString()}${data.purpose ? ` - ${data.purpose}` : ''}`,
        eventType: 'hearing',
      },
    });

    return hearing;
  }

  async findByMatter(matterId: string, orgId: string) {
    const matter = await this.prisma.matter.findFirst({
      where: { id: matterId, organizationId: orgId },
    });
    if (!matter) throw new NotFoundException('Matter not found');

    return this.prisma.hearing.findMany({
      where: { matterId },
      include: this.defaultInclude(),
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findOne(id: string, orgId: string) {
    const hearing = await this.prisma.hearing.findFirst({
      where: { id, matter: { organizationId: orgId } },
      include: {
        ...this.defaultInclude(),
        matter: { select: { id: true, title: true, caseNumber: true, judgeName: true } },
        tasks: {
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!hearing) throw new NotFoundException('Hearing not found');
    return hearing;
  }

  async update(id: string, data: {
    scheduledAt?: string;
    courtRoom?: string;
    purpose?: string;
    status?: HearingStatus;
    outcome?: HearingOutcome;
    adjournedTo?: string;
    adjournedReason?: string;
    orderPassed?: string;
    summary?: string;
  }, userId: string, orgId: string) {
    const hearing = await this.prisma.hearing.findFirst({
      where: { id, matter: { organizationId: orgId } },
    });
    if (!hearing) throw new NotFoundException('Hearing not found');

    const updated = await this.prisma.hearing.update({
      where: { id },
      data: {
        ...data,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        adjournedTo: data.adjournedTo ? new Date(data.adjournedTo) : undefined,
      },
      include: this.defaultInclude(),
    });

    // If adjourned, create next hearing automatically
    if (data.outcome === HearingOutcome.ADJOURNED && data.adjournedTo) {
      await this.create(
        {
          matterId: hearing.matterId,
          scheduledAt: data.adjournedTo,
          purpose: `Adjourned from ${hearing.scheduledAt.toDateString()}`,
        },
        userId,
        orgId,
      );
    }

    return updated;
  }

  async addNote(hearingId: string, content: string, isPrivate: boolean, userId: string, orgId: string) {
    const hearing = await this.prisma.hearing.findFirst({
      where: { id: hearingId, matter: { organizationId: orgId } },
    });
    if (!hearing) throw new NotFoundException('Hearing not found');

    return this.prisma.hearingNote.create({
      data: { hearingId, content, isPrivate, authorId: userId },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getUpcoming(orgId: string, days = 30) {
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.prisma.hearing.findMany({
      where: {
        matter: { organizationId: orgId },
        scheduledAt: { gte: new Date(), lte: until },
        status: HearingStatus.SCHEDULED,
      },
      include: {
        matter: { select: { id: true, title: true, caseNumber: true } },
        notes: false,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async delete(id: string, orgId: string) {
    const hearing = await this.prisma.hearing.findFirst({
      where: { id, matter: { organizationId: orgId } },
    });
    if (!hearing) throw new NotFoundException('Hearing not found');
    await this.prisma.hearing.delete({ where: { id } });
    return { message: 'Hearing deleted' };
  }

  private defaultInclude() {
    return {
      notes: {
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' as const },
      },
    };
  }
}
