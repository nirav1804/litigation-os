// matters/matters.module.ts
import { Module } from '@nestjs/common';
import { MattersController } from './matters.controller';
import { MattersService } from './matters.service';
import { MattersResolver } from './matters.resolver';

@Module({
  controllers: [MattersController],
  providers: [MattersService, MattersResolver],
  exports: [MattersService],
})
export class MattersModule {}
