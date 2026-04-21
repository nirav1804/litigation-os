import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatterDto } from './dto/create-matter.dto';
import { UpdateMatterDto } from './dto/update-matter.dto';
import { MatterStatus, UserRole } from '@prisma/client';

@Injectable()
export class MattersService {
  constructor(private prisma: PrismaService) {}

  // ─── CREATE ──────────────────────────────────────────────────────────────

  async create(dto: CreateMatterDto, userId: string, orgId: string) {
    const matter = await this.prisma.matter.create({
      data: {
        title: dto.title,
        caseNumber: dto.caseNumber,
        internalRef: dto.internalRef,
        status: dto.status || MatterStatus.ACTIVE,
        type: dto.type,
        description: dto.description,
        subject: dto.subject,
        reliefSought: dto.reliefSought,
        courtId: dto.courtId,
        judgeName: dto.judgeName,
        benchNumber: dto.benchNumber,
        filingDate: dto.filingDate ? new Date(dto.filingDate) : undefined,
        nextHearingDate: dto.nextHearingDate ? new Date(dto.nextHearingDate) : undefined,
        estimatedValue: dto.estimatedValue,
        fees: dto.fees,
        organizationId: orgId,
        createdById: userId,
        // Auto-assign creator as lead
        assignments: {
          create: { userId, role: 'lead' },
        },
      },
      include: this.defaultInclude(),
    });

    // Create timeline event
    await this.createTimelineEvent(matter.id, userId, {
      title: 'Matter Created',
      description: `Matter "${matter.title}" was created`,
      eventType: 'system',
      eventDate: new Date(),
    });

    return matter;
  }

  // ─── LIST ─────────────────────────────────────────────────────────────────

  async findAll(
    orgId: string,
    userId: string,
    userRole: UserRole,
    query: {
      page?: number;
      pageSize?: number;
      status?: MatterStatus;
      type?: string;
      search?: string;
      assignedToMe?: boolean;
    },
  ) {
    const { page = 1, pageSize = 20, status, type, search, assignedToMe } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { organizationId: orgId };

    // Clients can only see their matters
    if (userRole === UserRole.CLIENT) {
      where.clients = { some: { clientProfile: { userId } } };
    }

    // Filter by assignment
    if (assignedToMe && userRole !== UserRole.CLIENT) {
      where.assignments = { some: { userId } };
    }

    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { caseNumber: { contains: search, mode: 'insensitive' } },
        { internalRef: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.matter.findMany({
        where,
        include: {
          court: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          assignments: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, role: true } },
            },
          },
          parties: { take: 5 },
          _count: { select: { documents: true, tasks: true, hearings: true } },
        },
        orderBy: [{ nextHearingDate: 'asc' }, { updatedAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.matter.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // ─── GET ONE ──────────────────────────────────────────────────────────────

  async findOne(id: string, orgId: string, userId: string, userRole: UserRole) {
    const matter = await this.prisma.matter.findFirst({
      where: { id, organizationId: orgId },
      include: this.fullInclude(),
    });

    if (!matter) throw new NotFoundException('Matter not found');

    // Client access control
    if (userRole === UserRole.CLIENT) {
      const isClient = matter.clients.some(
        (c: any) => c.clientProfile?.userId === userId,
      );
      if (!isClient) throw new ForbiddenException('Access denied');
    }

    return matter;
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateMatterDto,
    orgId: string,
    userId: string,
  ) {
    await this.findOneOrThrow(id, orgId);

    const matter = await this.prisma.matter.update({
      where: { id },
      data: {
        ...dto,
        filingDate: dto.filingDate ? new Date(dto.filingDate) : undefined,
        nextHearingDate: dto.nextHearingDate
          ? new Date(dto.nextHearingDate)
          : undefined,
      },
      include: this.defaultInclude(),
    });

    await this.createTimelineEvent(id, userId, {
      title: 'Matter Updated',
      description: 'Matter details were updated',
      eventType: 'system',
      eventDate: new Date(),
    });

    return matter;
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────

  async remove(id: string, orgId: string) {
    await this.findOneOrThrow(id, orgId);
    await this.prisma.matter.delete({ where: { id } });
    return { message: 'Matter deleted successfully' };
  }

  // ─── ASSIGNMENTS ──────────────────────────────────────────────────────────

  async assignUser(matterId: string, userId: string, role: string, orgId: string) {
    await this.findOneOrThrow(matterId, orgId);

    // Verify user belongs to org
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId: orgId },
    });
    if (!user) throw new NotFoundException('User not found in organization');

    return this.prisma.matterAssignment.upsert({
      where: { matterId_userId: { matterId, userId } },
      create: { matterId, userId, role },
      update: { role },
    });
  }

  async removeAssignment(matterId: string, userId: string, orgId: string) {
    await this.findOneOrThrow(matterId, orgId);
    await this.prisma.matterAssignment.delete({
      where: { matterId_userId: { matterId, userId } },
    });
    return { message: 'Assignment removed' };
  }

  // ─── PARTIES ──────────────────────────────────────────────────────────────

  async addParty(matterId: string, partyData: any, orgId: string) {
    await this.findOneOrThrow(matterId, orgId);
    return this.prisma.party.create({
      data: { ...partyData, matterId },
    });
  }

  async updateParty(partyId: string, data: any, orgId: string) {
    const party = await this.prisma.party.findFirst({
      where: { id: partyId, matter: { organizationId: orgId } },
    });
    if (!party) throw new NotFoundException('Party not found');
    return this.prisma.party.update({ where: { id: partyId }, data });
  }

  async removeParty(partyId: string, orgId: string) {
    const party = await this.prisma.party.findFirst({
      where: { id: partyId, matter: { organizationId: orgId } },
    });
    if (!party) throw new NotFoundException('Party not found');
    await this.prisma.party.delete({ where: { id: partyId } });
    return { message: 'Party removed' };
  }

  // ─── TIMELINE ─────────────────────────────────────────────────────────────

  async getTimeline(matterId: string, orgId: string) {
    await this.findOneOrThrow(matterId, orgId);
    return this.prisma.timelineEvent.findMany({
      where: { matterId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { eventDate: 'desc' },
    });
  }

  async createTimelineEvent(
    matterId: string,
    userId: string,
    event: { title: string; description?: string; eventType: string; eventDate: Date; metadata?: any },
  ) {
    return this.prisma.timelineEvent.create({
      data: {
        matterId,
        createdById: userId,
        ...event,
      },
    });
  }

  // ─── NOTES ───────────────────────────────────────────────────────────────

  async getNotes(matterId: string, orgId: string, userId: string, userRole: UserRole) {
    await this.findOneOrThrow(matterId, orgId);
    const where: any = { matterId };
    if (userRole === UserRole.CLIENT) where.isPrivate = false;
    return this.prisma.note.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async addNote(matterId: string, content: string, isPrivate: boolean, userId: string, orgId: string) {
    await this.findOneOrThrow(matterId, orgId);
    return this.prisma.note.create({
      data: { matterId, content, isPrivate },
    });
  }

  // ─── STATS ────────────────────────────────────────────────────────────────

  async getStats(orgId: string) {
    const [total, byStatus, upcoming] = await Promise.all([
      this.prisma.matter.count({ where: { organizationId: orgId } }),
      this.prisma.matter.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { status: true },
      }),
      this.prisma.matter.count({
        where: {
          organizationId: orgId,
          nextHearingDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc: any, s) => {
        acc[s.status] = s._count.status;
        return acc;
      }, {}),
      upcomingHearingsThisWeek: upcoming,
    };
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private async findOneOrThrow(id: string, orgId: string) {
    const matter = await this.prisma.matter.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!matter) throw new NotFoundException('Matter not found');
    return matter;
  }

  private defaultInclude() {
    return {
      court: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      assignments: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } },
        },
      },
      parties: true,
      _count: { select: { documents: true, tasks: true, hearings: true } },
    };
  }

  private fullInclude() {
    return {
      court: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      assignments: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } },
        },
      },
      clients: {
        include: {
          clientProfile: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
      },
      parties: true,
      documents: {
        orderBy: { createdAt: 'desc' as const },
        take: 20,
        include: {
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      hearings: {
        orderBy: { scheduledAt: 'desc' as const },
        include: { notes: { include: { author: { select: { id: true, firstName: true, lastName: true } } } } },
      },
      tasks: {
        orderBy: { dueDate: 'asc' as const },
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      notes: { orderBy: { createdAt: 'desc' as const } },
      _count: { select: { documents: true, tasks: true, hearings: true, aiOutputs: true } },
    };
  }
}
