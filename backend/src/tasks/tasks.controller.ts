import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, OrgId } from '../common/decorators/current-user.decorator';
import { TaskStatus, TaskPriority } from '@prisma/client';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  create(@Body() body: any, @CurrentUser() user: any, @OrgId() orgId: string) {
    return this.tasksService.create(body, user.id, orgId);
  }

  @Get('my')
  getMyTasks(
    @CurrentUser() user: any,
    @OrgId() orgId: string,
    @Query('status') status?: TaskStatus,
    @Query('overdue') overdue?: boolean,
  ) {
    return this.tasksService.findMyTasks(user.id, orgId, { status, overdue });
  }

  @Get('upcoming')
  getUpcoming(@OrgId() orgId: string, @Query('days') days?: number) {
    return this.tasksService.getUpcoming(orgId, days);
  }

  @Get('matter/:matterId')
  findByMatter(
    @Param('matterId') matterId: string,
    @OrgId() orgId: string,
    @Query('status') status?: TaskStatus,
    @Query('assigneeId') assigneeId?: string,
    @Query('priority') priority?: TaskPriority,
  ) {
    return this.tasksService.findByMatter(matterId, orgId, { status, assigneeId, priority });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
    @OrgId() orgId: string,
  ) {
    return this.tasksService.update(id, body, user.id, orgId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @OrgId() orgId: string) {
    return this.tasksService.delete(id, orgId);
  }
}
