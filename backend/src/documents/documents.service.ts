import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { DocumentStatus, DocumentType } from '@prisma/client';
import * as pdfParse from 'pdf-parse';
import { createGroqClient, GROQ_MODELS, GroqClient } from '../ai/groq.client';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private groq: GroqClient;

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private config: ConfigService,
  ) {
    this.groq = createGroqClient(config.get('GROQ_API_KEY', ''));
  }

  // ─── UPLOAD ───────────────────────────────────────────────────────────────

  async uploadDocument(
    file: Express.Multer.File,
    matterId: string,
    userId: string,
    orgId: string,
    meta: { description?: string; documentType?: DocumentType; tags?: string[] },
  ) {
    const matter = await this.prisma.matter.findFirst({
      where: { id: matterId, organizationId: orgId },
    });
    if (!matter) throw new NotFoundException('Matter not found');

    const allowedMimes = [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/tiff',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('File type not supported. Supported: PDF, Word, JPEG, PNG, TIFF, TXT');
    }

    const { key, bucket } = await this.storage.uploadFile(
      file.buffer, file.originalname, file.mimetype,
      `org/${orgId}/matters/${matterId}`,
    );

    const document = await this.prisma.document.create({
      data: {
        matterId,
        uploadedById: userId,
        name: meta.description || file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        s3Key: key,
        s3Bucket: bucket,
        status: DocumentStatus.PROCESSING,
        documentType: meta.documentType || DocumentType.OTHER,
        description: meta.description,
        tags: meta.tags || [],
      },
    });

    // Async processing — extract text from text-based files
    this.processDocument(document.id, file.buffer, file.mimetype).catch((err) =>
      this.logger.error(`Document processing failed: ${err.message}`, err.stack),
    );

    return document;
  }

  // ─── PROCESSING PIPELINE ──────────────────────────────────────────────────
  // Note: Groq does NOT support vision/image input.
  // OCR for images requires a separate OCR tool (Tesseract, AWS Textract).
  // For text-based PDFs and .txt files, we extract text directly from the buffer.

  async processDocument(documentId: string, buffer: Buffer, mimeType: string) {
    try {
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.PROCESSING },
      });

      let extractedText = '';

      if (mimeType === 'text/plain') {
        // Direct text extraction for .txt
        extractedText = buffer.toString('utf-8');
      } else if (mimeType === 'application/pdf') {
        // Use pdf-parse for proper text extraction from PDF
        try {
          const pdfData = await pdfParse(buffer);
          extractedText = pdfData.text || '';
        } catch (e) {
          this.logger.warn(`pdf-parse failed, falling back to basic extraction: ${e.message}`);
          extractedText = this.extractTextFromBuffer(buffer);
        }
      }
      // Images (JPEG/PNG/TIFF): Groq cannot process images.
      // To enable image OCR, integrate Tesseract.js or AWS Textract separately.

      let extractedData: any = {};
      let documentType: DocumentType | null = null;

      if (extractedText && extractedText.length > 50) {
        [extractedData, documentType] = await Promise.all([
          this.extractEntitiesWithGroq(extractedText),
          this.classifyDocumentWithGroq(extractedText),
        ]);
      }

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.PROCESSED,
          ocrText: extractedText || null,
          documentType: documentType || DocumentType.OTHER,
          extractedParties: extractedData.parties || [],
          extractedDates: extractedData.dates || [],
          extractedSections: extractedData.sections || [],
          extractedMetadata: extractedData.metadata || {},
        },
      });

      this.logger.log(`Document ${documentId} processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process document ${documentId}:`, error);
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.FAILED },
      });
    }
  }

  /**
   * Basic PDF text extraction from raw bytes.
   * Extracts ASCII text sequences from PDF binary.
   * For production quality, install: npm install pdf-parse
   * Then replace with: const data = await pdfParse(buffer); return data.text;
   */
  private extractTextFromBuffer(buffer: Buffer): string {
    const str = buffer.toString('latin1');
    const textMatches = str.match(/\(([^)]{3,})\)/g) || [];
    const extracted = textMatches
      .map(m => m.slice(1, -1))
      .filter(t => /[a-zA-Z]{2,}/.test(t))
      .join(' ')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .trim();
    return extracted.substring(0, 50000);
  }

  private async extractEntitiesWithGroq(text: string): Promise<any> {
    try {
      const response = await this.groq.chat.completions.create({
        model: GROQ_MODELS.fast,
        max_tokens: 1500,
        messages: [
          {
            role: 'system',
            content: `You are a legal document analysis AI for Indian courts. Extract structured data and return ONLY valid JSON with this structure:
{"parties":[{"name":"string","role":"petitioner|respondent|appellant|defendant|plaintiff|other","address":"string|null","counsel":"string|null"}],"dates":[{"date":"YYYY-MM-DD","context":"string","type":"filing|hearing|order|deadline|other"}],"sections":[{"section":"string","content":"string","type":"prayer|facts|grounds|arguments|order"}],"metadata":{"caseNumber":"string|null","court":"string|null","judge":"string|null","subject":"string|null"}}`,
          },
          {
            role: 'user',
            content: `Extract from this legal document:\n\n${text.substring(0, 6000)}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch {
      return {};
    }
  }

  private async classifyDocumentWithGroq(text: string): Promise<DocumentType | null> {
    // Fast keyword-based classification (no API call needed)
    const keywords: Record<string, DocumentType> = {
      'affidavit': DocumentType.AFFIDAVIT,
      'petition': DocumentType.PETITION,
      'written submission': DocumentType.WRITTEN_SUBMISSION,
      'written statement': DocumentType.WRITTEN_SUBMISSION,
      ' order ': DocumentType.ORDER,
      'judgment': DocumentType.JUDGMENT,
      'judgement': DocumentType.JUDGMENT,
      'notice': DocumentType.NOTICE,
      ' reply ': DocumentType.REPLY,
      'rejoinder': DocumentType.REJOINDER,
      'power of attorney': DocumentType.POWER_OF_ATTORNEY,
      'vakalatnama': DocumentType.VAKALATNAMA,
      'synopsis': DocumentType.WRITTEN_SUBMISSION,
      'plaint': DocumentType.PETITION,
    };

    const lowerText = text.substring(0, 1000).toLowerCase();
    for (const [keyword, type] of Object.entries(keywords)) {
      if (lowerText.includes(keyword)) return type;
    }
    return null;
  }

  // ─── GET DOCUMENTS ────────────────────────────────────────────────────────

  async findByMatter(matterId: string, orgId: string) {
    const matter = await this.prisma.matter.findFirst({ where: { id: matterId, organizationId: orgId } });
    if (!matter) throw new NotFoundException('Matter not found');

    return this.prisma.document.findMany({
      where: { matterId },
      include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, orgId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, matter: { organizationId: orgId } },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        matter: { select: { id: true, title: true } },
      },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async getDownloadUrl(id: string, orgId: string): Promise<{ url: string }> {
    const doc = await this.findOne(id, orgId);
    const url = await this.storage.getSignedDownloadUrl(doc.s3Key, 3600);
    return { url };
  }

  async getPresignedUploadUrl(orgId: string, matterId: string, fileName: string, mimeType: string) {
    const key = this.storage.generateKey(`org/${orgId}/matters/${matterId}`, fileName);
    const url = await this.storage.getSignedUploadUrl(key, mimeType);
    return { url, key };
  }

  async deleteDocument(id: string, orgId: string) {
    const doc = await this.findOne(id, orgId);
    await this.storage.deleteFile(doc.s3Key);
    await this.prisma.document.delete({ where: { id } });
    return { message: 'Document deleted' };
  }

  async createVersion(parentId: string, file: Express.Multer.File, userId: string, orgId: string) {
    const parent = await this.findOne(parentId, orgId);
    const latestVersion = await this.prisma.document.aggregate({
      where: { parentDocId: parentId },
      _max: { version: true },
    });
    const { key, bucket } = await this.storage.uploadFile(file.buffer, file.originalname, file.mimetype, `org/${orgId}/matters/${parent.matterId}`);
    return this.prisma.document.create({
      data: {
        matterId: parent.matterId, uploadedById: userId,
        name: parent.name, originalName: file.originalname,
        mimeType: file.mimetype, size: file.size,
        s3Key: key, s3Bucket: bucket,
        documentType: parent.documentType,
        parentDocId: parentId,
        version: (latestVersion._max.version || parent.version) + 1,
        status: DocumentStatus.PROCESSING,
      },
    });
  }
}
