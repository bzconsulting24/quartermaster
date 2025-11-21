import OpenAI from 'openai';

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const MAX_BATCH_SIZE = 2048; // OpenAI allows up to 2048 inputs per batch
const MAX_TOKENS_PER_REQUEST = 8191; // Max tokens for embedding model

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

export interface BatchEmbeddingResult {
  embeddings: number[][];
  totalTokens: number;
  costs: number;
}

class EmbeddingService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: EMBEDDING_DIMENSIONS
      });

      return {
        embedding: response.data[0].embedding,
        tokens: response.usage?.total_tokens || 0
      };
    } catch (error: any) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batches
   * Automatically splits into batches to respect OpenAI limits
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    if (!texts || texts.length === 0) {
      throw new Error('Texts array cannot be empty');
    }

    // Filter out empty texts
    const validTexts = texts.filter(t => t && t.trim().length > 0);
    if (validTexts.length === 0) {
      throw new Error('All texts are empty');
    }

    // Split into batches to respect API limits
    const batches = this.splitIntoBatches(validTexts, MAX_BATCH_SIZE);
    const allEmbeddings: number[][] = [];
    let totalTokens = 0;

    for (const batch of batches) {
      try {
        const response = await this.openai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: batch,
          dimensions: EMBEDDING_DIMENSIONS
        });

        // Extract embeddings in the correct order
        const batchEmbeddings = response.data
          .sort((a, b) => a.index - b.index)
          .map(item => item.embedding);

        allEmbeddings.push(...batchEmbeddings);
        totalTokens += response.usage?.total_tokens || 0;

        // Rate limiting: small delay between batches
        if (batches.length > 1) {
          await this.delay(100); // 100ms delay between batches
        }
      } catch (error: any) {
        console.error('Error in batch embedding generation:', error);
        throw new Error(`Failed to generate batch embeddings: ${error.message}`);
      }
    }

    // Calculate approximate cost (text-embedding-3-small: $0.02 per 1M tokens)
    const costs = (totalTokens / 1_000_000) * 0.02;

    return {
      embeddings: allEmbeddings,
      totalTokens,
      costs
    };
  }

  /**
   * Estimate token count for text (rough estimate)
   * For more accurate counting, use tiktoken library
   */
  estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token on average
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if text is within token limits
   */
  isWithinTokenLimit(text: string): boolean {
    const estimatedTokens = this.estimateTokens(text);
    return estimatedTokens <= MAX_TOKENS_PER_REQUEST;
  }

  /**
   * Split array into batches of specified size
   */
  private splitIntoBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate embedding with retry logic
   */
  async generateEmbeddingWithRetry(
    text: string,
    maxRetries: number = 3
  ): Promise<EmbeddingResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.generateEmbedding(text);
      } catch (error: any) {
        lastError = error;
        console.warn(`Embedding attempt ${attempt + 1} failed:`, error.message);

        // Exponential backoff
        if (attempt < maxRetries - 1) {
          const delayMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`Retrying in ${delayMs}ms...`);
          await this.delay(delayMs);
        }
      }
    }

    throw new Error(
      `Failed to generate embedding after ${maxRetries} attempts: ${lastError?.message}`
    );
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
