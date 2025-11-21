export interface TextChunk {
  content: string;
  tokens: number;
  metadata?: Record<string, any>;
}

export interface ChunkingOptions {
  chunkSize?: number; // Target size in tokens
  chunkOverlap?: number; // Overlap in tokens
  preserveSentences?: boolean; // Try not to split mid-sentence
}

const DEFAULT_CHUNK_SIZE = 512;
const DEFAULT_CHUNK_OVERLAP = 50;

class ChunkingService {
  /**
   * Split text into chunks with overlap
   */
  chunkText(
    text: string,
    options: ChunkingOptions = {}
  ): TextChunk[] {
    const {
      chunkSize = DEFAULT_CHUNK_SIZE,
      chunkOverlap = DEFAULT_CHUNK_OVERLAP,
      preserveSentences = true
    } = options;

    if (!text || text.trim().length === 0) {
      return [];
    }

    // Split into sentences first if preserving sentence boundaries
    if (preserveSentences) {
      return this.chunkBySentences(text, chunkSize, chunkOverlap);
    }

    // Otherwise, chunk by character count with token estimation
    return this.chunkByCharacters(text, chunkSize, chunkOverlap);
  }

  /**
   * Chunk text while preserving sentence boundaries
   */
  private chunkBySentences(
    text: string,
    chunkSize: number,
    chunkOverlap: number
  ): TextChunk[] {
    const sentences = this.splitIntoSentences(text);
    const chunks: TextChunk[] = [];
    let currentChunk: string[] = [];
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence);

      // If adding this sentence exceeds chunk size and we have content
      if (currentTokens + sentenceTokens > chunkSize && currentChunk.length > 0) {
        // Save current chunk
        const chunkText = currentChunk.join(' ');
        chunks.push({
          content: chunkText,
          tokens: this.estimateTokens(chunkText)
        });

        // Start new chunk with overlap
        const overlapSentences = this.getOverlapSentences(
          currentChunk,
          chunkOverlap
        );
        currentChunk = overlapSentences;
        currentTokens = this.estimateTokens(currentChunk.join(' '));
      }

      // Add sentence to current chunk
      currentChunk.push(sentence);
      currentTokens += sentenceTokens;
    }

    // Add final chunk if it has content
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join(' ');
      chunks.push({
        content: chunkText,
        tokens: this.estimateTokens(chunkText)
      });
    }

    return chunks;
  }

  /**
   * Chunk text by character count (fallback method)
   */
  private chunkByCharacters(
    text: string,
    chunkSize: number,
    chunkOverlap: number
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    // Approximate: 4 characters per token
    const chunkChars = chunkSize * 4;
    const overlapChars = chunkOverlap * 4;

    let start = 0;
    while (start < text.length) {
      const end = start + chunkChars;
      const chunkText = text.slice(start, end);

      chunks.push({
        content: chunkText,
        tokens: this.estimateTokens(chunkText)
      });

      // Move start forward with overlap
      start = end - overlapChars;
    }

    return chunks;
  }

  /**
   * Split text into sentences
   * Basic implementation - can be improved with NLP library
   */
  private splitIntoSentences(text: string): string[] {
    // Split on sentence-ending punctuation followed by space/newline
    const sentencePattern = /[.!?]+[\s\n]+/g;
    const sentences: string[] = [];
    let lastIndex = 0;
    let match;

    while ((match = sentencePattern.exec(text)) !== null) {
      const sentence = text.slice(lastIndex, match.index + match[0].length).trim();
      if (sentence.length > 0) {
        sentences.push(sentence);
      }
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text as final sentence
    if (lastIndex < text.length) {
      const finalSentence = text.slice(lastIndex).trim();
      if (finalSentence.length > 0) {
        sentences.push(finalSentence);
      }
    }

    return sentences;
  }

  /**
   * Get sentences from the end that fit within overlap token count
   */
  private getOverlapSentences(
    sentences: string[],
    overlapTokens: number
  ): string[] {
    const overlapSentences: string[] = [];
    let tokens = 0;

    // Add sentences from the end until we reach overlap size
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentenceTokens = this.estimateTokens(sentences[i]);
      if (tokens + sentenceTokens > overlapTokens) {
        break;
      }
      overlapSentences.unshift(sentences[i]);
      tokens += sentenceTokens;
    }

    return overlapSentences;
  }

  /**
   * Estimate token count (rough approximation)
   * ~4 characters per token on average for English text
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Chunk CSV/tabular data by rows
   */
  chunkCSVData(
    data: any[],
    options: ChunkingOptions = {}
  ): TextChunk[] {
    const {
      chunkSize = DEFAULT_CHUNK_SIZE
    } = options;

    if (!data || data.length === 0) {
      return [];
    }

    const chunks: TextChunk[] = [];
    let currentChunk: any[] = [];
    let currentText = '';

    for (const row of data) {
      // Convert row to text representation
      const rowText = JSON.stringify(row);
      const rowTokens = this.estimateTokens(rowText);

      // If adding this row exceeds chunk size and we have content
      if (this.estimateTokens(currentText + rowText) > chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          content: this.formatCSVChunk(currentChunk),
          tokens: this.estimateTokens(currentText),
          metadata: {
            rowCount: currentChunk.length,
            type: 'csv'
          }
        });

        currentChunk = [];
        currentText = '';
      }

      currentChunk.push(row);
      currentText += rowText;
    }

    // Add final chunk if it has content
    if (currentChunk.length > 0) {
      chunks.push({
        content: this.formatCSVChunk(currentChunk),
        tokens: this.estimateTokens(currentText),
        metadata: {
          rowCount: currentChunk.length,
          type: 'csv'
        }
      });
    }

    return chunks;
  }

  /**
   * Format CSV rows as readable text for embedding
   */
  private formatCSVChunk(rows: any[]): string {
    if (rows.length === 0) return '';

    // Get headers from first row
    const headers = Object.keys(rows[0]);

    // Format as readable text
    const lines = rows.map(row => {
      const fields = headers.map(h => `${h}: ${row[h]}`).join(', ');
      return fields;
    });

    return lines.join('\n');
  }

  /**
   * Extract metadata from PDF text
   * Looks for page numbers, headers, etc.
   */
  extractPDFMetadata(text: string, pageNumber?: number): Record<string, any> {
    const metadata: Record<string, any> = {
      type: 'pdf'
    };

    if (pageNumber !== undefined) {
      metadata.pageNumber = pageNumber;
    }

    // Try to extract title from first lines
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 0) {
      metadata.potentialTitle = lines[0].substring(0, 100);
    }

    return metadata;
  }
}

// Export singleton instance
export const chunkingService = new ChunkingService();
