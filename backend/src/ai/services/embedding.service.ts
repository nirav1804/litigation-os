import { Injectable } from '@nestjs/common';

/**
 * EmbeddingService - Stub for Groq setup
 * 
 * Groq does not provide an embeddings API.
 * We use TF-IDF in RAGService instead.
 * 
 * To add real embeddings in future:
 * - Use Cohere embed API (free tier available)
 * - Use sentence-transformers locally
 * - Use HuggingFace Inference API
 */
@Injectable()
export class EmbeddingService {
  /**
   * Returns a simple bag-of-words vector (normalized term frequencies).
   * Replace with real embeddings for production semantic search.
   */
  async getEmbedding(text: string): Promise<number[]> {
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    const freq: Record<string, number> = {};
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
    const total = words.length || 1;
    return Object.values(freq).map(v => v / total);
  }
}
