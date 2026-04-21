import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { MattersService } from './matters.service';
import { CreateMatterDto } from './dto/create-matter.dto';
import { UpdateMatterDto } from './dto/update-matter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, OrgId } from '../common/decorators/current-user.decorator';
import { UserRole, MatterStatus } from '@prisma/client';

@Controller('matters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MattersController {
  constructor(private mattersService: MattersService) {}

  // ─── MATTERS CRUD ────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE)
  create(
    @Body() dto: CreateMatterDto,
    @CurrentUser() user: any,
    @OrgId() orgId: string,
  ) {
    return this.mattersService.create(dto, user.id, orgId);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @OrgId() orgId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: MatterStatus,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('assignedToMe') assignedToMe?: boolean,
  ) {
    return this.mattersService.findAll(orgId, user.id, user.role, {
      page, pageSize, status, type, search, assignedToMe,
    });
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE)
  getStats(@OrgId() orgId: string) {
    return this.mattersService.getStats(orgId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @OrgId() orgId: string,
  ) {
    return this.mattersService.findOne(id, orgId, user.id, user.role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMatterDto,
    @OrgId() orgId: string,
    @CurrentUser() user: any,
  ) {
    return this.mattersService.update(id, dto, orgId, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @OrgId() orgId: string) {
    return this.mattersService.remove(id, orgId);
  }

  // ─── ASSIGNMENTS ────────────────────────────────────────────────────────

  @Post(':id/assignments')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER)
  assignUser(
    @Param('id') matterId: string,
    @Body('userId') userId: string,
    @Body('role') role: string,
    @OrgId() orgId: string,
  ) {
    return this.mattersService.assignUser(matterId, userId, role, orgId);
  }

  @Delete(':id/assignments/:userId')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER)
  removeAssignment(
    @Param('id') matterId: string,
    @Param('userId') userId: string,
    @OrgId() orgId: string,
  ) {
    return this.mattersService.removeAssignment(matterId, userId, orgId);
  }

  // ─── PARTIES ────────────────────────────────────────────────────────────

  @Post(':id/parties')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE)
  addParty(
    @Param('id') matterId: string,
    @Body() partyData: any,
    @OrgId() orgId: string,
  ) {
    return this.mattersService.addParty(matterId, partyData, orgId);
  }

  @Patch(':id/parties/:partyId')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE)
  updateParty(
    @Param('partyId') partyId: string,
    @Body() data: any,
    @OrgId() orgId: string,
  ) {
    return this.mattersService.updateParty(partyId, data, orgId);
  }

  @Delete(':id/parties/:partyId')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER)
  removeParty(@Param('partyId') partyId: string, @OrgId() orgId: string) {
    return this.mattersService.removeParty(partyId, orgId);
  }

  // ─── TIMELINE ────────────────────────────────────────────────────────────

  @Get(':id/timeline')
  getTimeline(@Param('id') matterId: string, @OrgId() orgId: string) {
    return this.mattersService.getTimeline(matterId, orgId);
  }

  // ─── NOTES ───────────────────────────────────────────────────────────────

  @Get(':id/notes')
  getNotes(
    @Param('id') matterId: string,
    @OrgId() orgId: string,
    @CurrentUser() user: any,
  ) {
    return this.mattersService.getNotes(matterId, orgId, user.id, user.role);
  }

  @Post(':id/notes')
  addNote(
    @Param('id') matterId: string,
    @Body('content') content: string,
    @Body('isPrivate') isPrivate: boolean,
    @CurrentUser() user: any,
    @OrgId() orgId: string,
  ) {
    return this.mattersService.addNote(matterId, content, isPrivate, user.id, orgId);
  }
}
