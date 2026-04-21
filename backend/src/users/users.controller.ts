import {
  Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, OrgId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER)
  findAll(@OrgId() orgId: string) {
    return this.usersService.findAll(orgId);
  }

  @Post('invite')
  @Roles(UserRole.ADMIN)
  inviteUser(
    @Body('email') email: string,
    @Body('role') role: UserRole,
    @OrgId() orgId: string,
  ) {
    return this.usersService.inviteUser(email, role, orgId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @OrgId() orgId: string) {
    return this.usersService.findOne(id, orgId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
    @OrgId() orgId: string,
  ) {
    return this.usersService.update(id, body, user.id, user.role, orgId);
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  changeRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @OrgId() orgId: string,
  ) {
    return this.usersService.changeRole(id, role, orgId);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
    @CurrentUser() user: any,
  ) {
    return this.usersService.changePassword(user.id, currentPassword, newPassword);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  deactivate(@Param('id') id: string, @OrgId() orgId: string) {
    return this.usersService.deactivate(id, orgId);
  }
}
