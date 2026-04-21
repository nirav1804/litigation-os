/**
 * Groq AI Client
 * Groq provides blazing-fast inference for open-source models.
 * Models used:
 *   - llama-3.3-70b-versatile  → main reasoning / drafting / research
 *   - llama-3.1-8b-instant     → fast tasks (classification, short extractions)
 *   - mixtral-8x7b-32768       → long context (large documents)
 *
 * Note: Groq does NOT support vision/image input or embeddings.
 * For OCR we use basic text extraction; for RAG we use simple TF-IDF similarity.
 */
import Groq from 'groq-sdk';

export const GROQ_MODELS = {
  /** Best reasoning + drafting — 128k context */
  main: 'llama-3.3-70b-versatile',
  /** Fast — 8k context, good for classification */
  fast: 'llama-3.1-8b-instant',
  /** Long context — 32k, good for large documents */
  longContext: 'mixtral-8x7b-32768',
} as const;

export function createGroqClient(apiKey: string): Groq {
  return new Groq({ apiKey });
}

export type GroqClient = Groq;
