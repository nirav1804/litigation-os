import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AIOutputType } from '@prisma/client';
import { createGroqClient, GROQ_MODELS, GroqClient } from '../groq.client';

const DRAFTING_SYSTEM_PROMPT = `You are a senior Indian litigation advocate with 20+ years of experience drafting legal documents for the Supreme Court, High Courts, and District Courts of India.

You draft precise, legally sound documents that:
- Follow proper Indian court format and etiquette
- Use correct legal terminology per Indian law
- Cite relevant Indian statutes (IPC, CPC, CrPC, Constitution, etc.)
- Are structured according to Indian court rules
- Include all mandatory clauses and verifications
- Use formal English appropriate for Indian courts

Never include placeholder text. Use the actual information provided.`;

@Injectable()
export class DraftingService {
  private groq: GroqClient;
  private readonly logger = new Logger(DraftingService.name);

  constructor(private prisma: PrismaService, private config: ConfigService) {
    this.groq = createGroqClient(config.get('GROQ_API_KEY', ''));
  }

  async generateDraft(type: 'affidavit' | 'submission' | 'adjournment' | 'synopsis', matterId: string, instructions: string, userId: string, orgId: string) {
    const matter = await this.prisma.matter.findFirst({
      where: { id: matterId, organizationId: orgId },
      include: {
        parties: true,
        court: true,
        documents: {
          where: { status: 'PROCESSED', ocrText: { not: null } },
          select: { id: true, name: true, ocrText: true, documentType: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!matter) throw new NotFoundException('Matter not found');

    const prompt = this.buildDraftPrompt(type, matter, instructions);
    const outputType = this.getOutputType(type);

    const completion = await this.groq.chat.completions.create({
      model: GROQ_MODELS.main,
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        { role: 'system', content: DRAFTING_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    const output = completion.choices[0].message.content || '';

    return this.prisma.aIOutput.create({
      data: {
        matterId,
        generatedById: userId,
        type: outputType,
        prompt,
        output,
        model: GROQ_MODELS.main,
        tokens: completion.usage?.total_tokens || 0,
      },
    });
  }

  private buildDraftPrompt(type: string, matter: any, instructions: string): string {
    const parties = matter.parties.map((p: any) => `${p.type}: ${p.name}`).join('\n');
    const court = matter.court ? `${matter.court.name}, ${matter.court.city}` : 'Court not specified';
    const docContext = matter.documents
      .map((d: any) => `[${d.documentType}] ${d.name}:\n${d.ocrText?.substring(0, 1500)}`)
      .join('\n\n');

    const baseContext = `
MATTER DETAILS:
Title: ${matter.title}
Case Number: ${matter.caseNumber || 'N/A'}
Court: ${court}
Judge: ${matter.judgeName || 'N/A'}
Matter Type: ${matter.type}

PARTIES:
${parties}

${docContext ? `RELEVANT DOCUMENTS:\n${docContext}\n` : ''}
ADDITIONAL INSTRUCTIONS: ${instructions}
    `.trim();

    const prompts: Record<string, string> = {
      affidavit: `Draft a complete, formal Affidavit in Evidence for an Indian court based on the matter details below.
Include: proper heading with case title, deponent's full name/age/address/occupation, numbered paragraphs of facts, verification clause, place/date.
Use formal legal language appropriate for Indian courts.

${baseContext}`,

      submission: `Draft comprehensive Written Submissions for an Indian court based on the matter details below.
Structure:
1. Brief Facts
2. Issues for Consideration
3. Submissions on Law (with citations to Indian case law and statutes)
4. Submissions on Facts
5. Relief Prayed

Use formal legal language. Cite relevant Supreme Court and High Court judgments in proper format (AIR/SCC/SCR).

${baseContext}`,

      adjournment: `Draft a formal Application for Adjournment for an Indian court.
Include: proper cause title with case number, application number, grounds for adjournment (genuine reasons), prayer clause.
Keep it concise and professional. Address it to the presiding judge.

${baseContext}`,

      synopsis: `Draft a comprehensive Synopsis/Précis of the case for submission to an Indian court.
Include:
1. Case particulars (court, case number, parties, counsel)
2. Brief background/history
3. Question(s) of law / fact involved
4. Arguments on behalf of applicant/petitioner
5. Important judgments to be relied upon
6. Relief sought
Target length: 3-5 pages.

${baseContext}`,
    };

    return prompts[type] || prompts.submission;
  }

  private getOutputType(type: string): AIOutputType {
    const map: Record<string, AIOutputType> = {
      affidavit: AIOutputType.DRAFT_AFFIDAVIT,
      submission: AIOutputType.DRAFT_SUBMISSION,
      adjournment: AIOutputType.DRAFT_ADJOURNMENT,
      synopsis: AIOutputType.DRAFT_SYNOPSIS,
    };
    return map[type] || AIOutputType.DRAFT_SUBMISSION;
  }
}
