import type { Manifest, Topic, SyntaxConstruct, Mistake, Pattern, Exercise, Quiz } from '../../schemas/src/content.ts';
import type { ExecutionAdapter, TraceAdapter } from './adapters.ts';

/**
 * Standard content collection container for a language package.
 */
export interface LanguageContentStore {
  manifest: Manifest;
  topics: Topic[];
  syntaxConstructs: SyntaxConstruct[];
  mistakes: Mistake[];
  patterns: Pattern[];
  exercises: Exercise[];
  quizzes: Quiz[];
}

/**
 * LanguagePackage pluggable interface.
 * Adding a language requires implementing this package contract with zero changes to core application code.
 * (Spec Section 2 & AGENTS.md Rule 9)
 */
export interface LanguagePackage {
  /** Language manifest describing tier, versions, doc URLs, and maintainers. */
  readonly manifest: Manifest;

  /** Untrusted code execution adapter. */
  readonly executionAdapter: ExecutionAdapter;

  /** Optional step trace adapter for Tier A execution. */
  readonly traceAdapter?: TraceAdapter;

  /** Retrieve all static content associated with this language. */
  loadContent(): Promise<LanguageContentStore>;
}
