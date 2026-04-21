import {
  Controller, Get, Post, Delete, Param, Body, Query,
  UseGuards, UseInterceptors, UploadedFile, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, OrgId } from '../common/decorators/current-user.decorator';
import { UserRole, DocumentType } from '@prisma/client';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE, UserRole.CLERK)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('matterId') matterId: string,
    @Body('description') description: string,
    @Body('documentType') documentType: DocumentType,
    @Body('tags') tags: string,
    @CurrentUser() user: any,
    @OrgId() orgId: string,
  ) {
    return this.documentsService.uploadDocument(file, matterId, user.id, orgId, {
      description,
      documentType,
      tags: tags ? tags.split(',') : [],
    });
  }

  @Get('matter/:matterId')
  findByMatter(
    @Param('matterId') matterId: string,
    @OrgId() orgId: string,
  ) {
    return this.documentsService.findByMatter(matterId, orgId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @OrgId() orgId: string) {
    return this.documentsService.findOne(id, orgId);
  }

  @Get(':id/download')
  getDownloadUrl(@Param('id') id: string, @OrgId() orgId: string) {
    return this.documentsService.getDownloadUrl(id, orgId);
  }

  @Post('presigned-upload')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE, UserRole.CLERK)
  getPresignedUrl(
    @Body('matterId') matterId: string,
    @Body('fileName') fileName: string,
    @Body('mimeType') mimeType: string,
    @OrgId() orgId: string,
  ) {
    return this.documentsService.getPresignedUploadUrl(orgId, matterId, fileName, mimeType);
  }

  @Post(':id/version')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE)
  @UseInterceptors(FileInterceptor('file'))
  createVersion(
    @Param('id') parentId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @OrgId() orgId: string,
  ) {
    return this.documentsService.createVersion(parentId, file, user.id, orgId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_LAWYER)
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string, @OrgId() orgId: string) {
    return this.documentsService.deleteDocument(id, orgId);
  }
}
