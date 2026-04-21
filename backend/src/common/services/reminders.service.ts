import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from './mail.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // Run every day at 8 AM IST (2:30 AM UTC)
  @Cron('30 2 * * *', { timeZone: 'Asia/Kolkata' })
  async sendHearingReminders() {
    this.logger.log('Running hearing reminder job...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const hearings = await this.prisma.hearing.findMany({
      where: {
        scheduledAt: { gte: tomorrow, lt: dayAfter },
        status: 'SCHEDULED',
      },
      include: {
        matter: {
          include: {
            assignments: {
              include: {
                user: { select: { email: true, firstName: true } },
              },
            },
          },
        },
      },
    });

    for (const hearing of hearings) {
      for (const assignment of hearing.matter.assignments) {
        const { user } = assignment;
        try {
          await this.mailService.sendHearingReminder(
            user.email,
            user.firstName,
            hearing.matter.title,
            hearing.scheduledAt,
            hearing.matter.caseNumber || '',
          );
        } catch (err) {
          this.logger.error(`Failed to send hearing reminder: ${err.message}`);
        }
      }
    }

    this.logger.log(`Sent hearing reminders for ${hearings.length} hearings`);
  }

  // Run every day at 8 AM IST
  @Cron('30 2 * * *', { timeZone: 'Asia/Kolkata' })
  async sendTaskDeadlineReminders() {
    this.logger.log('Running task deadline reminder job...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const tasks = await this.prisma.task.findMany({
      where: {
        dueDate: { gte: tomorrow, lt: dayAfter },
        status: { notIn: ['DONE', 'CANCELLED'] },
        assigneeId: { not: null },
      },
      include: {
        matter: { select: { title: true } },
        assignee: { select: { email: true, firstName: true } },
      },
    });

    for (const task of tasks) {
      if (!task.assignee || !task.dueDate) continue;
      try {
        await this.mailService.sendTaskDeadlineAlert(
          task.assignee.email,
          task.assignee.firstName,
          task.title,
          task.matter.title,
          task.dueDate,
        );
      } catch (err) {
        this.logger.error(`Failed to send task reminder: ${err.message}`);
      }
    }

    this.logger.log(`Sent task reminders for ${tasks.length} tasks`);
  }

  // Clean up expired refresh tokens every night at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanExpiredTokens() {
    const deleted = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    this.logger.log(`Cleaned ${deleted.count} expired refresh tokens`);
  }
}
