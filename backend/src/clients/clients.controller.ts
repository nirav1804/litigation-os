import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, OrgId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  // Client portal - what the client sees
  @Get('portal')
  @Roles(UserRole.CLIENT)
  getPortal(@CurrentUser() user: any, @OrgId() orgId: string) {
    return this.clientsService.getPortal(user.id, orgId);
  }

  @Get('portal/matters/:matterId')
  @Roles(UserRole.CLIENT)
  getMatter(
    @Param('matterId') matterId: string,
    @CurrentUser() user: any,
    @OrgId() orgId: string,
  ) {
    return this.clientsService.getMatterForClient(matterId, user.id, orgId);
  }

  // Admin/lawyer - see all clients
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER)
  getAllClients(@OrgId() orgId: string) {
    return this.clientsService.getAllClients(orgId);
  }
}
