import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AIOutputType } from '@prisma/client';
import { createGroqClient, GROQ_MODELS, GroqClient } from '../groq.client';

// ─── RESEARCH SERVICE ────────────────────────────────────────────────────────

@Injectable()
export class ResearchService {
  private groq: GroqClient;

  constructor(private prisma: PrismaService, private config: ConfigService) {
    this.groq = createGroqClient(config.get('GROQ_API_KEY', ''));
  }

  async research(query: string, matterId: string, userId: string, orgId: string) {
    const matter = await this.prisma.matter.findFirst({
      where: { id: matterId, organizationId: orgId },
    });
    if (!matter) throw new NotFoundException('Matter not found');

    const prompt = `You are a legal research assistant specializing in Indian law.

Research Query: ${query}

Context: This is for a ${matter.type} matter titled "${matter.title}".

Provide comprehensive legal research including:

## 1. Applicable Laws & Provisions
List relevant Indian statutes, sections, rules, and regulations.

## 2. Key Precedents
Important Supreme Court and High Court judgments with proper citations (AIR/SCC/SCR format):
- Case name
- Citation
- Court & Year
- Key holding / ratio decidendi

## 3. Legal Principles
Established legal principles applicable to this query.

## 4. Analysis
How the law applies to the specific query.

## 5. Counter-arguments
Potential opposing arguments and how to address them.

## 6. Practical Tips
Procedural and practical considerations for Indian courts.

Focus exclusively on Indian jurisdictions. Be thorough. Cite real, well-known Indian judgments.`;

    const completion = await this.groq.chat.completions.create({
      model: GROQ_MODELS.main,
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content: 'You are a legal research AI with comprehensive knowledge of Indian case law, statutes, and legal principles. Always cite Indian courts and Indian law. Format your response clearly with markdown headers.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const output = completion.choices[0].message.content || '';

    return this.prisma.aIOutput.create({
      data: {
        matterId,
        generatedById: userId,
        type: AIOutputType.RESEARCH,
        prompt: query,
        output,
        model: GROQ_MODELS.main,
        tokens: completion.usage?.total_tokens || 0,
      },
    });
  }
}

// ─── HEARING PREP SERVICE ─────────────────────────────────────────────────────

@Injectable()
export class HearingPrepService {
  private groq: GroqClient;
  private readonly logger = new Logger(HearingPrepService.name);

  constructor(private prisma: PrismaService, private config: ConfigService) {
    this.groq = createGroqClient(config.get('GROQ_API_KEY', ''));
  }

  async prepare(hearingId: string, userId: string, orgId: string) {
    const hearing = await this.prisma.hearing.findFirst({
      where: { id: hearingId, matter: { organizationId: orgId } },
      include: {
        matter: {
          include: {
            parties: true,
            court: true,
            documents: {
              where: { status: 'PROCESSED', ocrText: { not: null } },
              select: { name: true, ocrText: true, documentType: true },
              take: 8,
              orderBy: { createdAt: 'desc' },
            },
            hearings: {
              where: { status: 'COMPLETED' },
              orderBy: { scheduledAt: 'desc' },
              take: 5,
              include: { notes: true },
            },
            tasks: {
              where: { status: { not: 'DONE' } },
              orderBy: { dueDate: 'asc' },
            },
          },
        },
        notes: true,
      },
    });

    if (!hearing) throw new NotFoundException('Hearing not found');

    const matter = hearing.matter;
    const parties = matter.parties.map((p: any) => `${p.type}: ${p.name}`).join(', ');
    const previousHearings = matter.hearings
      .map((h: any) => `${h.scheduledAt.toDateString()}: ${h.outcome || 'N/A'} — ${h.notes.map((n: any) => n.content).join('; ')}`)
      .join('\n');

    const docSummaries = matter.documents
      .map((d: any) => `[${d.documentType}] ${d.name}:\n${d.ocrText?.substring(0, 1000)}`)
      .join('\n\n');

    const pendingTasks = matter.tasks
      .map((t: any) => `- ${t.title} (Due: ${t.dueDate?.toDateString() || 'N/A'})`)
      .join('\n');

    const prompt = `Prepare a comprehensive hearing brief for the following upcoming court hearing.

HEARING DETAILS:
Date: ${hearing.scheduledAt.toDateString()}
Court: ${matter.court?.name || 'N/A'}, ${matter.court?.city || ''}
Judge: ${matter.judgeName || 'N/A'}
Purpose: ${hearing.purpose || 'General hearing'}

MATTER: ${matter.title} | Case No: ${matter.caseNumber || 'N/A'} | Type: ${matter.type}
Parties: ${parties}

PREVIOUS HEARINGS:
${previousHearings || 'First hearing'}

PENDING TASKS:
${pendingTasks || 'None'}

DOCUMENTS ON RECORD:
${docSummaries.substring(0, 6000)}

Generate a complete Hearing Preparation Brief:

## 1. HEARING SNAPSHOT
- Key facts at a glance
- Current stage of litigation
- What is expected at this hearing

## 2. ARGUMENTS TO MAKE
- Primary arguments with legal basis
- Secondary/supporting arguments
- Statutory provisions to rely upon
- Key judgments to cite (with citations)

## 3. ANTICIPATED OPPOSITION
- Likely arguments from opposing counsel
- Rebuttal points for each

## 4. KEY DOCUMENTS TO CARRY
- Most relevant documents for this hearing
- Specific pages/paragraphs to highlight

## 5. QUESTIONS JUDGE MAY ASK
- Likely judicial queries with suggested responses

## 6. PRE-HEARING CHECKLIST
- What to accomplish before this hearing
- What to achieve at the hearing`;

    const completion = await this.groq.chat.completions.create({
      model: GROQ_MODELS.main,
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content: 'You are a senior Indian litigation advocate helping prepare for a court hearing. Be specific, practical, and cite Indian law accurately.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const output = completion.choices[0].message.content || '';

    return this.prisma.aIOutput.create({
      data: {
        matterId: matter.id,
        generatedById: userId,
        type: AIOutputType.HEARING_PREP,
        prompt,
        output,
        model: GROQ_MODELS.main,
        tokens: completion.usage?.total_tokens || 0,
      },
    });
  }
}
