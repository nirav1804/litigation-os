import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { HearingsService } from './hearings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, OrgId } from '../common/decorators/current-user.decorator';
import { HearingStatus, HearingOutcome } from '@prisma/client';

@Controller('hearings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HearingsController {
  constructor(private hearingsService: HearingsService) {}

  @Post()
  create(@Body() body: any, @CurrentUser() user: any, @OrgId() orgId: string) {
    return this.hearingsService.create(body, user.id, orgId);
  }

  @Get('upcoming')
  getUpcoming(@OrgId() orgId: string, @Query('days') days?: number) {
    return this.hearingsService.getUpcoming(orgId, days);
  }

  @Get('matter/:matterId')
  findByMatter(@Param('matterId') matterId: string, @OrgId() orgId: string) {
    return this.hearingsService.findByMatter(matterId, orgId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @OrgId() orgId: string) {
    return this.hearingsService.findOne(id, orgId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
    @OrgId() orgId: string,
  ) {
    return this.hearingsService.update(id, body, user.id, orgId);
  }

  @Post(':id/notes')
  addNote(
    @Param('id') hearingId: string,
    @Body('content') content: string,
    @Body('isPrivate') isPrivate: boolean,
    @CurrentUser() user: any,
    @OrgId() orgId: string,
  ) {
    return this.hearingsService.addNote(hearingId, content, isPrivate, user.id, orgId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @OrgId() orgId: string) {
    return this.hearingsService.delete(id, orgId);
  }
}
