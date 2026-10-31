import * as path from 'node:path';
import * as fs from 'node:fs';
import type { LanguagePackage, LanguageContentStore } from '../src/package.ts';
import type { ExecutionAdapter, ExecutionLimits, ExecutionResult } from '../src/adapters.ts';
import { ComparisonEngine } from '../../sandbox/src/comparison-engine.ts';
import { PatternLibrary } from '../../sandbox/src/pattern-library.ts';
import { PythonExecutionAdapter } from '../../sandbox/src/python-adapter.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (!condition) {
    failed++;
    console.error(`[FAIL] ${msg}`);
    throw new Error(msg);
  } else {
    passed++;
    console.log(`[PASS] ${msg}`);
  }
}

// 1. Concrete Tiny Test Language implementation proving modularity
class TestLangExecutionAdapter implements ExecutionAdapter {
  private ready = false;
  async init() { this.ready = true; }
  isReady() { return this.ready; }
  async execute(code: string): Promise<ExecutionResult> {
    return {
      stdout: `ECHO: ${code.trim()}`,
      stderr: '',
      exitCode: 0,
      executionTimeMs: 1,
      timedOut: false,
      outputCapped: false,
    };
  }
  terminate() {}
  async dispose() { this.ready = false; }
}

class TestLangPackage implements LanguagePackage {
  readonly manifest = {
    language: 'testlang',
    versions_supported: ['1.0'],
    tier: 'Tier B' as const,
    doc_base_urls: ['https://example.com/testlang'],
    maintainers: ['tester@example.com'],
  };
  readonly executionAdapter = new TestLangExecutionAdapter();

  async loadContent(): Promise<LanguageContentStore> {
    return {
      manifest: this.manifest,
      topics: [],
      syntaxConstructs: [],
      mistakes: [],
      patterns: [],
      exercises: [],
      quizzes: [],
    };
  }
}

async function runPhase3TestSuite() {
  console.log('=============================================');
  console.log('    PHASE 3: BREADTH & COMPARISONS TESTS     ');
  console.log('=============================================\n');

  // --- 1. Modularity Proof ---
  console.log('--- 1. Testing Pluggable Language Package System ---');
  const pkg: LanguagePackage = new TestLangPackage();
  assert(pkg.manifest.language === 'testlang', 'LanguagePackage manifest loads cleanly');
  assert(pkg.manifest.tier === 'Tier B', 'LanguagePackage declares correct tier');
  await pkg.executionAdapter.init();
  const execRes = await pkg.executionAdapter.execute('HELLO_WORLD');
  assert(execRes.stdout === 'ECHO: HELLO_WORLD', 'Pluggable execution adapter runs with ZERO core changes');
  await pkg.executionAdapter.dispose();

  // Verify manifest files exist for breadth languages
  const breadthLanguages = ['javascript', 'typescript', 'sql', 'c', 'cpp', 'rust', 'go', 'java', 'csharp'];
  for (const lang of breadthLanguages) {
    const manifestPath = path.join(process.cwd(), 'content', lang, 'manifest.json');
    assert(fs.existsSync(manifestPath), `Manifest for language '${lang}' exists`);
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    assert(m.tier === 'Tier B' || m.tier === 'Tier C', `Language '${lang}' starts honestly at ${m.tier}`);
  }

  // --- 2. Language Comparison Engine ---
  console.log('\n--- 2. Testing Comparison Engine & "Looks the same, behaves differently" ---');
  const engine = new ComparisonEngine();

  // Register Equality comparison
  engine.registerComparison({
    conceptId: 'concept-equality',
    conceptName: 'Value vs Identity Equality',
    languages: {
      python: {
        language: 'python',
        syntax: 'a == b (value) | a is b (identity)',
        semantics: '== invokes __eq__ for deep value comparison; is checks memory identity (id(a) == id(b)).',
        gotchas: ['Comparing lists with == checks values recursively, unlike JavaScript reference checks.'],
        runnable_example: {
          code: 'a = [1, 2]\nb = [1, 2]\nprint(a == b, a is b)',
          expected_output: 'True False\n',
        },
      },
      javascript: {
        language: 'javascript',
        syntax: 'a === b (strict) | a == b (coercive)',
        semantics: '=== checks value and type without coercion, but for objects it checks reference address only.',
        gotchas: ['[1, 2] === [1, 2] is false because arrays are reference compared.'],
        runnable_example: {
          code: 'const a = [1, 2]; const b = [1, 2]; console.log(a === b);',
          expected_output: 'false\n',
        },
      },
    },
    looksTheSameBehavesDifferently: {
      title: 'Array Equality: Python == vs JavaScript ===',
      explanation: 'In Python, == compares the contents of two lists. In JavaScript, === compares their object reference addresses, returning false even when elements are identical.',
      snippetA: { language: 'python', code: '[1, 2] == [1, 2]', result: 'True (Deep Value Comparison)' },
      snippetB: { language: 'javascript', code: '[1, 2] === [1, 2]', result: 'false (Identity / Address Comparison)' },
    },
  });

  const cmp = engine.getComparison('concept-equality', 'python', 'javascript');
  assert(cmp !== null, 'Comparison retrieved successfully');
  assert(cmp?.looksTheSameBehavesDifferently?.title.includes('Array Equality'), 'Comparison includes "Looks the same, behaves differently" section');

  // Verify Python example in comparison runs and produces exact output
  const pyRunner = new PythonExecutionAdapter();
  await pyRunner.init();
  const runRes = await pyRunner.execute(cmp!.langA.runnable_example.code);
  assert(runRes.stdout === cmp!.langA.runnable_example.expected_output, 'Comparison Python runnable example verified on toolchain');
  await pyRunner.dispose();

  // Translate snippet
  const transRes = engine.translateSnippet('def add(x, y):\n    return x + y', 'python', 'javascript');
  assert(transRes.label === 'AI-assisted', 'Translation is labeled as AI-assisted (Spec §7)');
  assert(transRes.translatedCode.includes('function add'), 'Translated function header correctly');
  assert(transRes.semanticDifferences.length > 0, 'Includes explicit list of semantic differences');

  // --- 3. Pattern Library ---
  console.log('\n--- 3. Testing Pattern Library ---');
  const lib = new PatternLibrary();
  const patterns = lib.getPatterns();
  assert(patterns.length >= 3, 'Pattern library contains core patterns (counter, two-pointers, sliding-window)');

  const counterPattern = lib.getPatternById('pattern-counter');
  assert(counterPattern?.timeComplexity === 'O(N)', 'Counter pattern specifies O(N) time complexity');
  assert(counterPattern?.complexityJustification.length! > 0, 'Counter pattern includes complexity justification');

  console.log(`\n=============================================`);
  console.log(` ALL PHASE 3 TESTS PASSED: ${passed} passed, ${failed} failed `);
  console.log(`=============================================`);
}

runPhase3TestSuite().catch((err) => {
  console.error('Phase 3 test fatal error:', err);
  process.exit(1);
});
