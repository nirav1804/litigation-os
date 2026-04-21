import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { MattersService } from './matters.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// ─── GraphQL Types ────────────────────────────────────────────────────────────

@ObjectType()
export class MatterType {
  @Field(() => ID) id: string;
  @Field() title: string;
  @Field({ nullable: true }) caseNumber?: string;
  @Field({ nullable: true }) internalRef?: string;
  @Field() status: string;
  @Field() matterType: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) judgeName?: string;
  @Field() organizationId: string;
  @Field() createdAt: string;
  @Field() updatedAt: string;
}

@ObjectType()
export class PaginatedMattersType {
  @Field(() => [MatterType]) data: MatterType[];
  @Field(() => Int) total: number;
  @Field(() => Int) page: number;
  @Field(() => Int) totalPages: number;
}

@InputType()
export class CreateMatterInput {
  @Field() title: string;
  @Field({ nullable: true }) caseNumber?: string;
  @Field({ nullable: true }) internalRef?: string;
  @Field({ defaultValue: 'CIVIL' }) type: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) courtId?: string;
  @Field({ nullable: true }) judgeName?: string;
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

@Resolver(() => MatterType)
@UseGuards(JwtAuthGuard)
export class MattersResolver {
  constructor(private mattersService: MattersService) {}

  @Query(() => PaginatedMattersType, { name: 'matters' })
  async getMatters(
    @Context() ctx: any,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 20 }) pageSize: number,
    @Args('search', { nullable: true }) search?: string,
    @Args('status', { nullable: true }) status?: string,
  ) {
    const user = ctx.req.user;
    const result = await this.mattersService.findAll(
      user.organizationId, user.id, user.role,
      { page, pageSize, search, status: status as any },
    ) as any;
    return {
      data: result.data.map((m: any) => ({ ...m, matterType: m.type, createdAt: m.createdAt?.toISOString(), updatedAt: m.updatedAt?.toISOString() })),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @Query(() => MatterType, { name: 'matter', nullable: true })
  async getMatter(@Args('id') id: string, @Context() ctx: any) {
    const user = ctx.req.user;
    const m = await this.mattersService.findOne(id, user.organizationId, user.id, user.role) as any;
    return { ...m, matterType: m.type, createdAt: m.createdAt?.toISOString(), updatedAt: m.updatedAt?.toISOString() };
  }

  @Mutation(() => MatterType, { name: 'createMatter' })
  async createMatter(@Args('input') input: CreateMatterInput, @Context() ctx: any) {
    const user = ctx.req.user;
    const m = await this.mattersService.create(input as any, user.id, user.organizationId) as any;
    return { ...m, matterType: m.type, createdAt: m.createdAt?.toISOString(), updatedAt: m.updatedAt?.toISOString() };
  }
}
