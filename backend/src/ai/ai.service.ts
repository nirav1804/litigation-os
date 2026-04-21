import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RAGService } from './services/rag.service';
import { DraftingService } from './services/drafting.service';
import { ResearchService } from './services/research.service';
import { HearingPrepService } from './services/hearing-prep.service';
import { AIOutputType } from '@prisma/client';
import { createGroqClient, GROQ_MODELS, GroqClient } from './groq.client';

const LEGAL_SYSTEM_PROMPT = `You are an expert Indian litigation lawyer assistant with deep knowledge of:
- Indian Constitution and fundamental rights
- Code of Civil Procedure (CPC), 1908
- Code of Criminal Procedure (CrPC), 1973
- Indian Evidence Act, 1872
- Supreme Court and High Court procedures
- Indian Contract Act, Arbitration Act, Company Law, and other Indian statutes
- Case law from Indian courts (Supreme Court, High Courts, Tribunals)
Always provide responses in the context of Indian law and procedure. Be precise, use proper legal terminology, and cite relevant provisions when appropriate.`;

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private groq: GroqClient;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private ragService: RAGService,
    private draftingService: DraftingService,
    private researchService: ResearchService,
    private hearingPrepService: HearingPrepService,
  ) {
    this.groq = createGroqClient(config.get('GROQ_API_KEY', ''));
  }

  async summarizeDocument(documentId: string, userId: string, orgId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, matter: { organizationId: orgId } },
      include: { matter: true },
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (!doc.ocrText) throw new NotFoundException('Document text not available. Upload a text-based PDF.');

    const prompt = `Summarize this Indian legal document for a lawyer. Include:
1. Document type and parties
2. Key facts and background
3. Legal issues/grounds raised
4. Relief sought / Orders given
5. Important dates
6. Key legal provisions cited

Document:\n${doc.ocrText.substring(0, 12000)}`;

    const completion = await this.groq.chat.completions.create({
      model: GROQ_MODELS.main,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: LEGAL_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    const output = completion.choices[0].message.content || '';
    return this.saveOutput({
      matterId: doc.matterId, userId, type: AIOutputType.SUMMARY,
      prompt, output, model: GROQ_MODELS.main,
      tokens: completion.usage?.total_tokens || 0,
      sourceDocIds: [documentId],
    });
  }

  async extractChronology(matterId: string, userId: string, orgId: string) {
    const matter = await this.prisma.matter.findFirst({
      where: { id: matterId, organizationId: orgId },
      include: {
        documents: { select: { id: true, ocrText: true, name: true, documentType: true } },
        hearings: { select: { scheduledAt: true, status: true, outcome: true, summary: true } },
      },
    });
    if (!matter) throw new NotFoundException('Matter not found');

    const docTexts = matter.documents
      .filter((d) => d.ocrText)
      .map((d) => `[${d.documentType} - ${d.name}]:\n${d.ocrText?.substring(0, 2000)}`)
      .join('\n\n');

    const hearingTexts = matter.hearings
      .map((h) => `Hearing on ${h.scheduledAt.toDateString()}: ${h.outcome || 'Scheduled'} - ${h.summary || ''}`)
      .join('\n');

    const prompt = `Extract a complete chronological timeline of events for this Indian litigation matter.
For each event include: Date, Event Type, Description, Legal Significance.
Format as a numbered list sorted by date (oldest first).

Matter: ${matter.title} | Case: ${matter.caseNumber || 'N/A'}

DOCUMENTS:\n${docTexts.substring(0, 8000)}
HEARINGS:\n${hearingTexts}`;

    const completion = await this.groq.chat.completions.create({
      model: GROQ_MODELS.main,
      max_tokens: 3000,
      messages: [
        { role: 'system', content: LEGAL_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    const output = completion.choices[0].message.content || '';
    return this.saveOutput({
      matterId, userId, type: AIOutputType.CHRONOLOGY,
      prompt, output, model: GROQ_MODELS.main,
      tokens: completion.usage?.total_tokens || 0,
    });
  }

  async generateDraft(type: 'affidavit' | 'submission' | 'adjournment' | 'synopsis', matterId: string, instructions: string, userId: string, orgId: string) {
    return this.draftingService.generateDraft(type, matterId, instructions, userId, orgId);
  }

  async doResearch(query: string, matterId: string, userId: string, orgId: string) {
    return this.researchService.research(query, matterId, userId, orgId);
  }

  async prepareForHearing(hearingId: string, userId: string, orgId: string) {
    return this.hearingPrepService.prepare(hearingId, userId, orgId);
  }

  async askAboutMatter(question: string, matterId: string, userId: string, orgId: string, conversationHistory: Array<{ role: string; content: string }> = []) {
    const matter = await this.prisma.matter.findFirst({
      where: { id: matterId, organizationId: orgId },
      include: {
        parties: true,
        documents: { select: { id: true, name: true, ocrText: true, documentType: true }, where: { ocrText: { not: null } }, take: 8, orderBy: { createdAt: 'desc' } },
        hearings: { select: { scheduledAt: true, outcome: true, summary: true }, take: 5 },
      },
    });
    if (!matter) throw new NotFoundException('Matter not found');

    const ragContext = await this.ragService.getRelevantContext(question, matterId);
    const matterContext = `Title: ${matter.title}\nCase: ${matter.caseNumber || 'N/A'}\nType: ${matter.type}\nStatus: ${matter.status}\nParties: ${matter.parties.map((p: any) => `${p.type}: ${p.name}`).join(', ')}`;

    const systemPrompt = `${LEGAL_SYSTEM_PROMPT}\n\nMatter context:\n${matterContext}\n\n${ragContext ? `Relevant document excerpts:\n${ragContext}` : ''}`;

    const completion = await this.groq.chat.completions.create({
      model: GROQ_MODELS.main,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: question },
      ],
    });

    return { answer: completion.choices[0].message.content || '', tokens: completion.usage?.total_tokens || 0 };
  }

  async getOutputs(matterId: string, orgId: string, type?: AIOutputType) {
    const matter = await this.prisma.matter.findFirst({ where: { id: matterId, organizationId: orgId } });
    if (!matter) throw new NotFoundException('Matter not found');
    return this.prisma.aIOutput.findMany({
      where: { matterId, ...(type ? { type } : {}) },
      include: { generatedBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveOutputTitle(outputId: string, title: string, _orgId: string) {
    return this.prisma.aIOutput.update({ where: { id: outputId }, data: { isSaved: true, title } });
  }

  private async saveOutput(data: { matterId: string; userId: string; type: AIOutputType; prompt: string; output: string; model: string; tokens: number; sourceDocIds?: string[] }) {
    return this.prisma.aIOutput.create({
      data: {
        matterId: data.matterId, generatedById: data.userId, type: data.type,
        prompt: data.prompt, output: data.output, model: data.model, tokens: data.tokens,
        ...(data.sourceDocIds?.length ? { sourceDocuments: { connect: data.sourceDocIds.map((id) => ({ id })) } } : {}),
      },
      include: { generatedBy: { select: { id: true, firstName: true, lastName: true } } },
    });
  }
}
