import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { OrgId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private orgsService: OrganizationsService) {}

  @Get('me')
  getOrg(@OrgId() orgId: string) {
    return this.orgsService.findOne(orgId);
  }

  @Patch('me')
  @Roles(UserRole.ADMIN)
  updateOrg(@OrgId() orgId: string, @Body() body: any) {
    return this.orgsService.update(orgId, body);
  }

  @Get('courts')
  getCourts(@OrgId() orgId: string) {
    return this.orgsService.getCourts(orgId);
  }

  @Post('courts')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER)
  createCourt(@OrgId() orgId: string, @Body() body: any) {
    return this.orgsService.createCourt(orgId, body);
  }

  @Patch('courts/:id')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER)
  updateCourt(@Param('id') id: string, @OrgId() orgId: string, @Body() body: any) {
    return this.orgsService.updateCourt(id, orgId, body);
  }

  @Delete('courts/:id')
  @Roles(UserRole.ADMIN)
  deleteCourt(@Param('id') id: string, @OrgId() orgId: string) {
    return this.orgsService.deleteCourt(id, orgId);
  }
}
