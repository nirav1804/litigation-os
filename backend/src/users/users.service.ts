import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.user.findMany({
      where: { organizationId: orgId, isActive: true },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, phone: true, avatarUrl: true, barNumber: true,
        lastLoginAt: true, createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    });
  }

  async findOne(id: string, orgId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId: orgId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, phone: true, avatarUrl: true, barNumber: true,
        lastLoginAt: true, createdAt: true, isActive: true,
        _count: { select: { assignedMatters: true, createdTasks: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    barNumber: string;
    avatarUrl: string;
  }>, requesterId: string, requesterRole: UserRole, orgId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, organizationId: orgId } });
    if (!user) throw new NotFoundException('User not found');

    // Only admin or self can update
    if (requesterId !== id && requesterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Cannot update another user');
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, phone: true, avatarUrl: true, barNumber: true,
      },
    });
  }

  async changeRole(id: string, role: UserRole, orgId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, organizationId: orgId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
  }

  async deactivate(id: string, orgId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, organizationId: orgId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new ForbiddenException('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { message: 'Password changed successfully' };
  }

  async inviteUser(email: string, role: UserRole, orgId: string) {
    // In production: send invite email with temp password
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    const hashed = await bcrypt.hash(tempPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashed,
        firstName: 'Invited',
        lastName: 'User',
        role,
        organizationId: orgId,
      },
      select: { id: true, email: true, role: true },
    });

    // TODO: send invite email with tempPassword
    return { user, tempPassword }; // Remove tempPassword from response in prod
  }
}
