import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatterStatus, TaskStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(orgId: string, userId: string, userRole: string) {
    const [
      matterStats,
      taskStats,
      hearingStats,
      recentMatters,
      upcomingHearings,
      overdueTasksCount,
      aiUsage,
    ] = await Promise.all([
      this.getMatterStats(orgId),
      this.getTaskStats(orgId, userId, userRole),
      this.getHearingStats(orgId),
      this.getRecentMatters(orgId, 5),
      this.getUpcomingHearings(orgId, 7),
      this.getOverdueTaskCount(orgId),
      this.getAIUsage(orgId),
    ]);

    return {
      matterStats,
      taskStats,
      hearingStats,
      recentMatters,
      upcomingHearings,
      overdueTasksCount,
      aiUsage,
    };
  }

  async getMatterStats(orgId: string) {
    const [total, byStatus, byType, createdThisMonth, closedThisMonth] = await Promise.all([
      this.prisma.matter.count({ where: { organizationId: orgId } }),
      this.prisma.matter.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { status: true },
      }),
      this.prisma.matter.groupBy({
        by: ['type'],
        where: { organizationId: orgId },
        _count: { type: true },
      }),
      this.prisma.matter.count({
        where: {
          organizationId: orgId,
          createdAt: { gte: this.startOfMonth() },
        },
      }),
      this.prisma.matter.count({
        where: {
          organizationId: orgId,
          status: MatterStatus.CLOSED,
          updatedAt: { gte: this.startOfMonth() },
        },
      }),
    ]);

    return {
      total,
      active: byStatus.find((s) => s.status === 'ACTIVE')?._count.status || 0,
      pending: byStatus.find((s) => s.status === 'PENDING')?._count.status || 0,
      closed: byStatus.find((s) => s.status === 'CLOSED')?._count.status || 0,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.status })),
      byType: byType.map((t) => ({ type: t.type, count: t._count.type })),
      createdThisMonth,
      closedThisMonth,
    };
  }

  async getTaskStats(orgId: string, userId: string, userRole: string) {
    const baseWhere = userRole === 'CLIENT'
      ? {}
      : { matter: { organizationId: orgId } };

    const userWhere = ['ADMIN', 'SENIOR_LAWYER'].includes(userRole)
      ? baseWhere
      : { ...baseWhere, assigneeId: userId };

    const [total, todo, inProgress, done, overdue] = await Promise.all([
      this.prisma.task.count({ where: userWhere }),
      this.prisma.task.count({ where: { ...userWhere, status: TaskStatus.TODO } }),
      this.prisma.task.count({ where: { ...userWhere, status: TaskStatus.IN_PROGRESS } }),
      this.prisma.task.count({ where: { ...userWhere, status: TaskStatus.DONE } }),
      this.prisma.task.count({
        where: {
          ...userWhere,
          dueDate: { lt: new Date() },
          status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
        },
      }),
    ]);

    return { total, todo, inProgress, done, overdue };
  }

  async getHearingStats(orgId: string) {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [thisWeek, thisMonth, completed, adjourned] = await Promise.all([
      this.prisma.hearing.count({
        where: {
          matter: { organizationId: orgId },
          scheduledAt: { gte: new Date(), lte: nextWeek },
          status: 'SCHEDULED',
        },
      }),
      this.prisma.hearing.count({
        where: {
          matter: { organizationId: orgId },
          scheduledAt: { gte: new Date(), lte: nextMonth },
          status: 'SCHEDULED',
        },
      }),
      this.prisma.hearing.count({
        where: { matter: { organizationId: orgId }, status: 'COMPLETED' },
      }),
      this.prisma.hearing.count({
        where: { matter: { organizationId: orgId }, status: 'ADJOURNED' },
      }),
    ]);

    return { thisWeek, thisMonth, completed, adjourned };
  }

  async getRecentMatters(orgId: string, limit = 10) {
    return this.prisma.matter.findMany({
      where: { organizationId: orgId },
      include: {
        court: { select: { name: true, city: true } },
        _count: { select: { tasks: true, documents: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async getUpcomingHearings(orgId: string, days = 30) {
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.prisma.hearing.findMany({
      where: {
        matter: { organizationId: orgId },
        scheduledAt: { gte: new Date(), lte: until },
        status: 'SCHEDULED',
      },
      include: {
        matter: { select: { id: true, title: true, caseNumber: true, judgeName: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 20,
    });
  }

  async getOverdueTaskCount(orgId: string) {
    return this.prisma.task.count({
      where: {
        matter: { organizationId: orgId },
        dueDate: { lt: new Date() },
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
      },
    });
  }

  async getAIUsage(orgId: string) {
    const thisMonth = this.startOfMonth();
    const [total, thisMonthCount, byType] = await Promise.all([
      this.prisma.aIOutput.count({ where: { matter: { organizationId: orgId } } }),
      this.prisma.aIOutput.count({
        where: { matter: { organizationId: orgId }, createdAt: { gte: thisMonth } },
      }),
      this.prisma.aIOutput.groupBy({
        by: ['type'],
        where: { matter: { organizationId: orgId } },
        _count: { type: true },
      }),
    ]);

    return {
      total,
      thisMonth: thisMonthCount,
      byType: byType.map((t) => ({ type: t.type, count: t._count.type })),
    };
  }

  async getCaseloadByUser(orgId: string) {
    return this.prisma.matterAssignment.groupBy({
      by: ['userId'],
      where: { matter: { organizationId: orgId, status: 'ACTIVE' } },
      _count: { matterId: true },
    });
  }

  async getMatterAging(orgId: string) {
    const matters = await this.prisma.matter.findMany({
      where: { organizationId: orgId, status: 'ACTIVE' },
      select: { id: true, title: true, createdAt: true, caseNumber: true, type: true },
    });

    return matters.map((m) => ({
      ...m,
      ageDays: Math.floor((Date.now() - m.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }

  async getProductivity(orgId: string, days = 30) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [tasksCompleted, documentsUploaded, hearingsCompleted, aiOutputs] = await Promise.all([
      this.prisma.task.count({
        where: {
          matter: { organizationId: orgId },
          status: TaskStatus.DONE,
          completedAt: { gte: from },
        },
      }),
      this.prisma.document.count({
        where: { matter: { organizationId: orgId }, createdAt: { gte: from } },
      }),
      this.prisma.hearing.count({
        where: { matter: { organizationId: orgId }, status: 'COMPLETED', scheduledAt: { gte: from } },
      }),
      this.prisma.aIOutput.count({
        where: { matter: { organizationId: orgId }, createdAt: { gte: from } },
      }),
    ]);

    return { tasksCompleted, documentsUploaded, hearingsCompleted, aiOutputs, period: `${days}d` };
  }

  private startOfMonth() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
}
