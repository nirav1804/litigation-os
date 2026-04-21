import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * RAG Service — In-Memory Vector Store with TF-IDF similarity
 *
 * Groq does NOT provide an embeddings API. We use a lightweight
 * TF-IDF based similarity search instead. For production, swap
 * this with a dedicated embedding model (e.g. sentence-transformers
 * running locally, or Cohere embeddings API).
 */

const CHUNK_SIZE = 800;   // words per chunk
const CHUNK_OVERLAP = 100; // word overlap between chunks

@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);

  // In-memory store: chunkId → { terms, text, documentId, matterId }
  private chunkStore: Map<string, {
    terms: Map<string, number>; // term → TF score
    text: string;
    documentId: string;
    matterId: string;
  }> = new Map();

  // IDF scores across all chunks
  private idf: Map<string, number> = new Map();

  constructor(private prisma: PrismaService) {}

  // ─── INGEST DOCUMENT ──────────────────────────────────────────────────────

  async ingestDocument(documentId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, ocrText: true, matterId: true, name: true },
    });

    if (!doc?.ocrText) {
      this.logger.warn(`Document ${documentId} has no text to ingest`);
      return;
    }

    const chunks = this.chunkText(doc.ocrText, doc.name);
    const embeddingIds: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `${documentId}_chunk_${i}`;
      const terms = this.computeTF(chunks[i]);

      this.chunkStore.set(chunkId, {
        terms,
        text: chunks[i],
        documentId,
        matterId: doc.matterId,
      });

      embeddingIds.push(chunkId);
    }

    // Recompute IDF after adding new chunks
    this.recomputeIDF();

    await this.prisma.document.update({
      where: { id: documentId },
      data: { isEmbedded: true, embeddingIds },
    });

    this.logger.log(`Ingested ${chunks.length} chunks for document ${documentId}`);
  }

  // ─── RETRIEVE CONTEXT ─────────────────────────────────────────────────────

  async getRelevantContext(query: string, matterId: string, topK = 5): Promise<string> {
    if (this.chunkStore.size === 0) return '';

    const queryTerms = this.computeTF(query);
    const results: Array<{ text: string; score: number }> = [];

    for (const [, chunk] of this.chunkStore) {
      if (chunk.matterId !== matterId) continue;
      const score = this.tfidfSimilarity(queryTerms, chunk.terms);
      if (score > 0) results.push({ text: chunk.text, score });
    }

    results.sort((a, b) => b.score - a.score);
    const top = results.slice(0, topK);

    if (!top.length) return '';

    return top
      .map((r, i) => `[Context ${i + 1}]:\n${r.text}`)
      .join('\n\n---\n\n');
  }

  // ─── TF-IDF HELPERS ───────────────────────────────────────────────────────

  private computeTF(text: string): Map<string, number> {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    const tf = new Map<string, number>();
    for (const word of words) {
      tf.set(word, (tf.get(word) || 0) + 1);
    }

    // Normalize
    const total = words.length || 1;
    for (const [word, count] of tf) {
      tf.set(word, count / total);
    }

    return tf;
  }

  private recomputeIDF() {
    const docFreq = new Map<string, number>();
    const totalDocs = this.chunkStore.size || 1;

    for (const chunk of this.chunkStore.values()) {
      for (const term of chunk.terms.keys()) {
        docFreq.set(term, (docFreq.get(term) || 0) + 1);
      }
    }

    this.idf.clear();
    for (const [term, df] of docFreq) {
      this.idf.set(term, Math.log(totalDocs / df));
    }
  }

  private tfidfSimilarity(
    queryTerms: Map<string, number>,
    docTerms: Map<string, number>,
  ): number {
    let score = 0;
    for (const [term, qtf] of queryTerms) {
      const dtf = docTerms.get(term) || 0;
      const idf = this.idf.get(term) || 1;
      score += qtf * dtf * idf * idf;
    }
    return score;
  }

  private chunkText(text: string, source: string): string[] {
    const chunks: string[] = [];
    const words = text.split(/\s+/);
    let i = 0;

    while (i < words.length) {
      const chunkWords = words.slice(i, i + CHUNK_SIZE);
      if (chunkWords.length > 20) {
        chunks.push(`[Source: ${source}]\n${chunkWords.join(' ')}`);
      }
      i += CHUNK_SIZE - CHUNK_OVERLAP;
    }

    return chunks;
  }
}

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'by','from','up','about','into','through','during','before','after',
  'above','below','between','each','few','more','most','other','some',
  'such','than','too','very','can','will','just','should','now','also',
  'this','that','these','those','which','who','whom','what','where',
  'when','why','how','all','both','either','neither','one','two','three',
  'not','no','nor','so','yet','both','while','although','because','since',
  'until','unless','whether','if','then','else','any','every','each',
  'said','has','have','had','was','were','is','are','been','being','be',
]);
