import type { TraceEvent } from '../../schemas/src/trace.ts';

/**
 * Execution limits enforced on untrusted code execution.
 */
export interface ExecutionLimits {
  /** Hard timeout in milliseconds before forcibly terminating execution. */
  timeoutMs: number;
  /** Maximum stdout + stderr bytes allowed before stream is capped. */
  maxOutputBytes: number;
  /** Maximum memory allocation in bytes (if supported by environment). */
  memoryLimitBytes?: number;
  /** Flag determining whether network access is enabled (default false). */
  allowNetwork?: boolean;
}

/**
 * Result returned by an ExecutionAdapter run.
 */
export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  timedOut: boolean;
  outputCapped: boolean;
  errorType?: 'syntax' | 'runtime' | 'timeout' | 'oom' | 'security' | 'internal';
}

/**
 * ExecutionAdapter interface for running learner-submitted code in an isolated sandbox.
 * Implemented per language/runtime (e.g., browser WebAssembly worker, server microVM).
 * Must contain zero language-specific logic.
 */
export interface ExecutionAdapter {
  /** Initialize the execution runtime (e.g. download or warm up workers). */
  init(): Promise<void>;

  /** Check whether runtime is initialized and ready for execution. */
  isReady(): boolean;

  /** Run arbitrary code with optional stdin and resource bounds. */
  execute(code: string, stdin?: string, limits?: ExecutionLimits): Promise<ExecutionResult>;

  /** Forcibly terminate active run or reset worker state. */
  terminate(): void;

  /** Release resources and clean up. */
  dispose(): Promise<void>;
}

/**
 * TraceAdapter interface for generating language-neutral execution traces.
 * Emits ordered TraceEvents for Trace Studio visualization.
 * Must contain zero language-specific logic.
 */
export interface TraceAdapter {
  /** Initialize trace engine. */
  init(): Promise<void>;

  /** Execute code with step-by-step trace event collection. */
  trace(code: string, stdin?: string, limits?: ExecutionLimits): Promise<TraceEvent[]>;

  /** Release resources. */
  dispose(): Promise<void>;
}
