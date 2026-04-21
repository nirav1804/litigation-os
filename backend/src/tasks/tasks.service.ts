import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, TaskPriority, UserRole } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    matterId: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
    assigneeId?: string;
    hearingId?: string;
  }, userId: string, orgId: string) {
    const matter = await this.prisma.matter.findFirst({
      where: { id: data.matterId, organizationId: orgId },
    });
    if (!matter) throw new NotFoundException('Matter not found');

    return this.prisma.task.create({
      data: {
        matterId: data.matterId,
        title: data.title,
        description: data.description,
        priority: data.priority || TaskPriority.MEDIUM,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        assigneeId: data.assigneeId,
        hearingId: data.hearingId,
        createdById: userId,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findByMatter(matterId: string, orgId: string, filters?: {
    status?: TaskStatus;
    assigneeId?: string;
    priority?: TaskPriority;
  }) {
    const matter = await this.prisma.matter.findFirst({
      where: { id: matterId, organizationId: orgId },
    });
    if (!matter) throw new NotFoundException('Matter not found');

    return this.prisma.task.findMany({
      where: {
        matterId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.assigneeId && { assigneeId: filters.assigneeId }),
        ...(filters?.priority && { priority: filters.priority }),
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        hearing: { select: { id: true, scheduledAt: true } },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { priority: 'desc' }],
    });
  }

  async findMyTasks(userId: string, orgId: string, filters?: {
    status?: TaskStatus;
    overdue?: boolean;
  }) {
    const now = new Date();
    return this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        matter: { organizationId: orgId },
        ...(filters?.status && { status: filters.status }),
        ...(filters?.overdue && {
          dueDate: { lt: now },
          status: { not: TaskStatus.DONE },
        }),
      },
      include: {
        matter: { select: { id: true, title: true, caseNumber: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    });
  }

  async update(id: string, data: Partial<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    assigneeId: string;
  }>, userId: string, orgId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, matter: { organizationId: orgId } },
    });
    if (!task) throw new NotFoundException('Task not found');

    const completedAt = data.status === TaskStatus.DONE && task.status !== TaskStatus.DONE
      ? new Date()
      : undefined;

    return this.prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        completedAt,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(id: string, orgId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, matter: { organizationId: orgId } },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.prisma.task.delete({ where: { id } });
    return { message: 'Task deleted' };
  }

  async getUpcoming(orgId: string, days = 7) {
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.prisma.task.findMany({
      where: {
        matter: { organizationId: orgId },
        dueDate: { lte: until, gte: new Date() },
        status: { not: TaskStatus.DONE },
      },
      include: {
        matter: { select: { id: true, title: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 50,
    });
  }
}
