// prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper for paginated queries
  async paginate<T>(
    model: any,
    options: {
      where?: any;
      include?: any;
      orderBy?: any;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ data: T[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const { where, include, orderBy, page = 1, pageSize = 20 } = options;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      model.findMany({ where, include, orderBy, skip, take: pageSize }),
      model.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
