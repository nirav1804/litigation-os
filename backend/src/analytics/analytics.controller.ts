import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, OrgId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: any, @OrgId() orgId: string) {
    return this.analyticsService.getDashboard(orgId, user.id, user.role);
  }

  @Get('matters')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER)
  getMatterStats(@OrgId() orgId: string) {
    return this.analyticsService.getMatterStats(orgId);
  }

  @Get('caseload')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER)
  getCaseload(@OrgId() orgId: string) {
    return this.analyticsService.getCaseloadByUser(orgId);
  }

  @Get('aging')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER)
  getAging(@OrgId() orgId: string) {
    return this.analyticsService.getMatterAging(orgId);
  }

  @Get('productivity')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER)
  getProductivity(@OrgId() orgId: string, @Query('days') days?: number) {
    return this.analyticsService.getProductivity(orgId, days);
  }
}
