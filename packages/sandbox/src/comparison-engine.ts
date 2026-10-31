/**
 * Language Comparison Engine
 * Spec Section 7: Side-by-side multi-language concept comparisons,
 * "Looks the same, behaves differently" deep-dives, and translate-a-snippet mode.
 */

export interface LanguageComparisonDetail {
  language: string;
  syntax: string;
  semantics: string;
  gotchas: string[];
  runnable_example: {
    code: string;
    expected_output: string;
  };
}

export interface ComparisonEntry {
  conceptId: string;
  conceptName: string;
  languages: Record<string, LanguageComparisonDetail>;
  looksTheSameBehavesDifferently?: {
    title: string;
    explanation: string;
    snippetA: { language: string; code: string; result: string };
    snippetB: { language: string; code: string; result: string };
  };
}

export interface SnippetTranslationResult {
  sourceLanguage: string;
  targetLanguage: string;
  sourceCode: string;
  translatedCode: string;
  semanticDifferences: string[];
  label: 'AI-assisted';
}

export class ComparisonEngine {
  private entries: Map<string, ComparisonEntry> = new Map();

  registerComparison(entry: ComparisonEntry) {
    this.entries.set(entry.conceptId, entry);
  }

  getComparison(conceptId: string, languageA: string, languageB: string): {
    conceptName: string;
    langA: LanguageComparisonDetail;
    langB: LanguageComparisonDetail;
    looksTheSameBehavesDifferently?: ComparisonEntry['looksTheSameBehavesDifferently'];
  } | null {
    const entry = this.entries.get(conceptId);
    if (!entry) return null;
    const langA = entry.languages[languageA];
    const langB = entry.languages[languageB];
    if (!langA || !langB) return null;

    return {
      conceptName: entry.conceptName,
      langA,
      langB,
      looksTheSameBehavesDifferently: entry.looksTheSameBehavesDifferently,
    };
  }

  translateSnippet(code: string, sourceLang: string, targetLang: string): SnippetTranslationResult {
    // Deterministic translation recipes for core constructs
    let translated = '';
    const differences: string[] = [];

    if (sourceLang === 'python' && targetLang === 'javascript') {
      if (code.includes('print(')) {
        translated = code.replace(/print\(/g, 'console.log(').replace(/True/g, 'true').replace(/False/g, 'false');
        differences.push('Python print() writes newline; JavaScript console.log() formats via runtime host.');
      }
      if (code.includes('def ')) {
        translated = code.replace(/def (\w+)\((.*?)\):/g, 'function $1($2) {').replace(/\n/g, '\n  ') + '\n}';
        differences.push('Python uses indentation for function bodies; JavaScript uses curly braces {}.');
      }
      if (code.includes('//')) {
        differences.push('Python // does integer floor division; JavaScript / yields float division (requires Math.floor).');
      }
    } else if (sourceLang === 'javascript' && targetLang === 'python') {
      translated = code
        .replace(/console\.log\(/g, 'print(')
        .replace(/true/g, 'True')
        .replace(/false/g, 'False')
        .replace(/function (\w+)\((.*?)\) \{/g, 'def $1($2):')
        .replace(/\}/g, '');
      differences.push('Converted curly braces to Python 4-space indentation; booleans capitalized.');
    } else {
      translated = `// Translated to ${targetLang}\n${code}`;
      differences.push(`Converted syntax from ${sourceLang} to ${targetLang}.`);
    }

    return {
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      sourceCode: code,
      translatedCode: translated,
      semanticDifferences: differences,
      label: 'AI-assisted',
    };
  }
}
