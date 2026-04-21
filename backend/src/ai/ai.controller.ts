import {
  Controller, Post, Get, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, OrgId } from '../common/decorators/current-user.decorator';
import { UserRole, AIOutputType } from '@prisma/client';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE)
export class AIController {
  constructor(private aiService: AIService) {}

  // Summarize a document
  @Post('summarize/:documentId')
  summarize(
    @Param('documentId') documentId: string,
    @CurrentUser() user: any,
    @OrgId() orgId: string,
  ) {
    return this.aiService.summarizeDocument(documentId, user.id, orgId);
  }

  // Extract chronology for a matter
  @Post('chronology/:matterId')
  extractChronology(
    @Param('matterId') matterId: string,
    @CurrentUser() user: any,
    @OrgId() orgId: string,
  ) {
    return this.aiService.extractChronology(matterId, user.id, orgId);
  }

  // Generate legal drafts
  @Post('draft/:matterId')
  generateDraft(
    @Param('matterId') matterId: string,
    @Body('type') type: 'affidavit' | 'submission' | 'adjournment' | 'synopsis',
    @Body('instructions') instructions: string,
    @CurrentUser() user: any,
    @OrgId() orgId: string,
  ) {
    return this.aiService.generateDraft(type, matterId, instructions, user.id, orgId);
  }

  // Legal research
  @Post('research/:matterId')
  research(
    @Param('matterId') matterId: string,
    @Body('query') query: string,
    @CurrentUser() user: any,
    @OrgId() orgId: string,
  ) {
    return this.aiService.doResearch(query, matterId, user.id, orgId);
  }

  // Hearing preparation
  @Post('hearing-prep/:hearingId')
  hearingPrep(
    @Param('hearingId') hearingId: string,
    @CurrentUser() user: any,
    @OrgId() orgId: string,
  ) {
    return this.aiService.prepareForHearing(hearingId, user.id, orgId);
  }

  // Chat / ask about matter
  @Post('chat/:matterId')
  chat(
    @Param('matterId') matterId: string,
    @Body('question') question: string,
    @Body('history') history: Array<{ role: string; content: string }>,
    @CurrentUser() user: any,
    @OrgId() orgId: string,
  ) {
    return this.aiService.askAboutMatter(question, matterId, user.id, orgId, history || []);
  }

  // Get all AI outputs for a matter
  @Get('outputs/:matterId')
  getOutputs(
    @Param('matterId') matterId: string,
    @OrgId() orgId: string,
    @Query('type') type?: AIOutputType,
  ) {
    return this.aiService.getOutputs(matterId, orgId, type);
  }

  // Save an output with a title
  @Patch('outputs/:outputId/save')
  saveOutput(
    @Param('outputId') outputId: string,
    @Body('title') title: string,
    @OrgId() orgId: string,
  ) {
    return this.aiService.saveOutputTitle(outputId, title, orgId);
  }
}
