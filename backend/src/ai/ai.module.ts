// ai/ai.module.ts
import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { RAGService } from './services/rag.service';
import { EmbeddingService } from './services/embedding.service';
import { DraftingService } from './services/drafting.service';
import { ResearchService } from './services/research.service';
import { HearingPrepService } from './services/hearing-prep.service';

@Module({
  controllers: [AIController],
  providers: [
    AIService,
    RAGService,
    EmbeddingService,
    DraftingService,
    ResearchService,
    HearingPrepService,
  ],
  exports: [AIService, EmbeddingService],
})
export class AIModule {}
