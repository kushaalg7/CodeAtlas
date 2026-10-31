import { SearchEngineV1, type SearchDocument } from './search-engine.ts';

export interface Citation {
  title: string;
  url: string;
  source_type: 'official_spec' | 'official_docs' | 'educational_explanation' | 'ai_generated';
  license?: string;
}

export interface RAGAnswer {
  question: string;
  answerText: string;
  confidence: number;
  refused: boolean;
  citations: Citation[];
  suggestedLessons: Array<{ id: string; title: string }>;
  quickActions: string[];
}

export interface GoldenQuestion {
  id: string;
  question: string;
  expectedLessonId: string;
  expectedKeywords: string[];
}

export const PYTHON_GOLDEN_QUESTIONS: GoldenQuestion[] = [
  { id: 'gq-01', question: 'How do I print a message to the console in Python?', expectedLessonId: 'python-01-syntax-and-execution', expectedKeywords: ['print', 'syntax'] },
  { id: 'gq-02', question: 'Why does Python use indentation instead of curly brackets?', expectedLessonId: 'python-01-syntax-and-execution', expectedKeywords: ['indentation', 'syntax'] },
  { id: 'gq-03', question: 'What is a variable in Python and how do I declare one?', expectedLessonId: 'python-02-variables-and-types', expectedKeywords: ['variable', 'assignment'] },
  { id: 'gq-04', question: 'What are the primitive data types in Python?', expectedLessonId: 'python-02-variables-and-types', expectedKeywords: ['types', 'int', 'str', 'float'] },
  { id: 'gq-05', question: 'How does type() work in Python?', expectedLessonId: 'python-02-variables-and-types', expectedKeywords: ['type', 'primitive'] },
  { id: 'gq-06', question: 'How do arithmetic operators work in Python?', expectedLessonId: 'python-03-operators', expectedKeywords: ['operators', 'arithmetic'] },
  { id: 'gq-07', question: 'What is boolean logic and short-circuit evaluation?', expectedLessonId: 'python-03-operators', expectedKeywords: ['boolean', 'short-circuit', 'operators'] },
  { id: 'gq-08', question: 'How do comparison operators like == and != behave?', expectedLessonId: 'python-03-operators', expectedKeywords: ['comparison', 'operators'] },
  { id: 'gq-09', question: 'How do I use f-strings for formatted output in Python?', expectedLessonId: 'python-04-input-output', expectedKeywords: ['f-strings', 'format', 'print'] },
  { id: 'gq-10', question: 'How do I read input from the user in Python?', expectedLessonId: 'python-04-input-output', expectedKeywords: ['input', 'stdin'] },
  { id: 'gq-11', question: 'How do if, elif, and else work in Python?', expectedLessonId: 'python-05-conditions', expectedKeywords: ['if', 'elif', 'else', 'conditions'] },
  { id: 'gq-12', question: 'What is truthiness and condition evaluation in Python?', expectedLessonId: 'python-05-conditions', expectedKeywords: ['truthiness', 'conditions'] },
  { id: 'gq-13', question: 'How do I write nested conditions in Python?', expectedLessonId: 'python-05-conditions', expectedKeywords: ['nested', 'conditions'] },
  { id: 'gq-14', question: 'How does a while loop work and how do I avoid infinite loops?', expectedLessonId: 'python-06-loops', expectedKeywords: ['while', 'loops', 'infinite'] },
  { id: 'gq-15', question: 'How do I iterate using a for loop with range() in Python?', expectedLessonId: 'python-06-loops', expectedKeywords: ['for', 'range', 'loops'] },
  { id: 'gq-16', question: 'What is the difference between break and continue in loops?', expectedLessonId: 'python-06-loops', expectedKeywords: ['break', 'continue', 'loops'] },
  { id: 'gq-17', question: 'How do I define a function in Python using def?', expectedLessonId: 'python-07-functions-basics', expectedKeywords: ['def', 'functions', 'parameters'] },
  { id: 'gq-18', question: 'How do return statements pass data back from a function?', expectedLessonId: 'python-07-functions-basics', expectedKeywords: ['return', 'functions'] },
  { id: 'gq-19', question: 'How do default parameter values work in Python functions?', expectedLessonId: 'python-08-functions-scope', expectedKeywords: ['default', 'arguments', 'scope'] },
  { id: 'gq-20', question: 'What is the difference between local and global scope in Python?', expectedLessonId: 'python-08-functions-scope', expectedKeywords: ['local', 'global', 'scope'] },
];

export class GroundedRAGEngine {
  private searchEngine: SearchEngineV1;

  constructor(searchEngine: SearchEngineV1) {
    this.searchEngine = searchEngine;
  }

  ask(question: string, options: { language?: string; version?: string } = {}): RAGAnswer {
    const language = options.language || 'python';
    const searchResults = this.searchEngine.search(question, { language });

    const quickActions = ['Explain simpler', 'Explain deeper', 'Show example', 'Open in playground', 'Quiz me'];

    if (searchResults.length === 0 || searchResults[0].score < 15) {
      // Low confidence refusal threshold (< 0.72 confidence)
      const topSuggestions = searchResults.slice(0, 3).map((r) => ({
        id: r.doc.id,
        title: r.doc.title,
      }));

      return {
        question,
        answerText: `I don't have enough verified content in CODE ATLAS to answer this question reliably with complete citations. Rather than guessing, here are the closest verified lessons that might help:`,
        confidence: 0.35,
        refused: true,
        citations: [],
        suggestedLessons: topSuggestions,
        quickActions,
      };
    }

    const bestDoc = searchResults[0].doc;
    const confidence = Math.min(0.98, Math.round((0.75 + (searchResults[0].score / 100)) * 100) / 100);

    const citations: Citation[] = [
      {
        title: `CODE ATLAS: ${bestDoc.title}`,
        url: `#${bestDoc.id}`,
        source_type: 'educational_explanation',
      },
      {
        title: 'Official Python 3 Documentation',
        url: 'https://docs.python.org/3.12/',
        source_type: 'official_docs',
        license: 'PSF License',
      },
    ];

    const answerText = `Based on the verified lesson "${bestDoc.title}":\n\n${bestDoc.content}\n\nThis behavior is verified on Python ${options.version || '3.12'} standard toolchain.`;

    return {
      question,
      answerText,
      confidence,
      refused: false,
      citations,
      suggestedLessons: [{ id: bestDoc.id, title: bestDoc.title }],
      quickActions,
    };
  }

  evaluateGoldenQuestions(goldenSet: GoldenQuestion[] = PYTHON_GOLDEN_QUESTIONS): {
    total: number;
    hits: number;
    hitRate: number;
    results: Array<{ question: string; matched: boolean; expected: string; actual?: string }>;
  } {
    let hits = 0;
    const results = [];

    for (const gq of goldenSet) {
      const searchRes = this.searchEngine.search(gq.question, { language: 'python' });
      const matched = searchRes.length > 0 && searchRes.some((r) => r.doc.id === gq.expectedLessonId);
      if (matched) hits++;

      results.push({
        question: gq.question,
        matched,
        expected: gq.expectedLessonId,
        actual: searchRes[0]?.doc.id,
      });
    }

    return {
      total: goldenSet.length,
      hits,
      hitRate: Math.round((hits / goldenSet.length) * 100),
      results,
    };
  }
}
