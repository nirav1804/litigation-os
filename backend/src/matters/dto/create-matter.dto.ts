import {
  IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsArray,
} from 'class-validator';
import { MatterStatus, MatterType } from '@prisma/client';

export class CreateMatterDto {
  @IsString()
  title: string;

  @IsOptional() @IsString()
  caseNumber?: string;

  @IsOptional() @IsString()
  internalRef?: string;

  @IsOptional() @IsEnum(MatterStatus)
  status?: MatterStatus;

  @IsEnum(MatterType)
  type: MatterType;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  subject?: string;

  @IsOptional() @IsString()
  reliefSought?: string;

  @IsOptional() @IsString()
  courtId?: string;

  @IsOptional() @IsString()
  judgeName?: string;

  @IsOptional() @IsString()
  benchNumber?: string;

  @IsOptional() @IsDateString()
  filingDate?: string;

  @IsOptional() @IsDateString()
  nextHearingDate?: string;

  @IsOptional() @IsNumber()
  estimatedValue?: number;

  @IsOptional() @IsNumber()
  fees?: number;
}

export class UpdateMatterDto {
  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  caseNumber?: string;

  @IsOptional() @IsString()
  internalRef?: string;

  @IsOptional() @IsEnum(MatterStatus)
  status?: MatterStatus;

  @IsOptional() @IsEnum(MatterType)
  type?: MatterType;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  subject?: string;

  @IsOptional() @IsString()
  reliefSought?: string;

  @IsOptional() @IsString()
  courtId?: string;

  @IsOptional() @IsString()
  judgeName?: string;

  @IsOptional() @IsString()
  benchNumber?: string;

  @IsOptional() @IsDateString()
  filingDate?: string;

  @IsOptional() @IsDateString()
  nextHearingDate?: string;

  @IsOptional() @IsNumber()
  estimatedValue?: number;

  @IsOptional() @IsNumber()
  fees?: number;
}
