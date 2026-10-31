/**
 * Hybrid Search Engine v1
 * Spec Section 9.1: BM25-style keyword search, semantic synonyms, typo tolerance, and metadata filtering.
 */

export interface SearchDocument {
  id: string;
  language: string;
  version: string;
  level: string;
  contentType: 'topic' | 'syntax' | 'mistake' | 'exercise' | 'quiz' | 'concept';
  title: string;
  content: string;
  keywords: string[];
}

export interface SearchFilter {
  language?: string;
  version?: string;
  level?: string;
  contentType?: string;
}

export interface SearchResult {
  doc: SearchDocument;
  score: number;
  matchType: 'exact' | 'synonym' | 'fuzzy';
}

export const STOP_WORDS = new Set([
  'how', 'do', 'i', 'the', 'a', 'an', 'to', 'in', 'of', 'and', 'or', 'is', 'it', 'what', 'why', 'can'
]);

// Spec 9.1 Synonyms list
export const SYNONYM_MAP: Record<string, string[]> = {
  pointer: ['reference', 'address', 'memory'],
  reference: ['pointer', 'variable', 'address'],
  address: ['pointer', 'reference'],
  loop: ['iteration', 'while', 'for', 'repeat'],
  iteration: ['loop', 'for', 'while'],
  branch: ['condition', 'if', 'else'],
  function: ['def', 'method', 'subroutine'],
};

export class SearchEngineV1 {
  private documents: SearchDocument[] = [];

  addDocument(doc: SearchDocument) {
    this.documents.push(doc);
  }

  addDocuments(docs: SearchDocument[]) {
    this.documents.push(...docs);
  }

  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  private expandSynonyms(tokens: string[]): string[] {
    const expanded = new Set<string>(tokens);
    for (const t of tokens) {
      if (SYNONYM_MAP[t]) {
        for (const s of SYNONYM_MAP[t]) expanded.add(s);
      }
    }
    return Array.from(expanded);
  }

  search(query: string, filter?: SearchFilter): SearchResult[] {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const rawTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (rawTokens.length === 0) return [];

    // Filter out common stop words to prevent meaningless hits
    const substantiveTokens = rawTokens.filter((t) => !STOP_WORDS.has(t) || t === 'if' || t === 'for' || t === 'while');
    const tokensToSearch = substantiveTokens.length > 0 ? substantiveTokens : rawTokens;

    const queryTokens = this.expandSynonyms(tokensToSearch);
    const results: SearchResult[] = [];

    for (const doc of this.documents) {
      // Apply filters
      if (filter) {
        if (filter.language && doc.language !== filter.language) continue;
        if (filter.level && doc.level !== filter.level) continue;
        if (filter.contentType && doc.contentType !== filter.contentType) continue;
      }

      let score = 0;
      let matchType: SearchResult['matchType'] = 'fuzzy';

      const docText = `${doc.title} ${doc.content} ${doc.keywords.join(' ')}`.toLowerCase();

      for (const token of queryTokens) {
        // Exact token match in title (high weight)
        if (doc.title.toLowerCase().includes(token)) {
          score += 15;
          matchType = 'exact';
        }
        // Exact token match in body
        if (docText.includes(token)) {
          score += 5;
          if (matchType !== 'exact') matchType = 'exact';
        }
        // Keyword tags
        if (doc.keywords.some((k) => k.toLowerCase() === token)) {
          score += 8;
          matchType = 'exact';
        }

        // Typo tolerance (Levenshtein distance <= 1 for words >= 5 chars)
        if (token.length >= 5) {
          for (const word of doc.title.toLowerCase().split(/\s+/)) {
            if (this.levenshtein(token, word) <= 1) {
              score += 4;
              if (matchType !== 'exact') matchType = 'fuzzy';
            }
          }
        }
      }

      if (score > 0) {
        results.push({ doc, score, matchType });
      }
    }

    // Sort by descending score
    return results.sort((a, b) => b.score - a.score);
  }
}
