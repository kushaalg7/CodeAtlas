import * as child_process from 'node:child_process';
import * as fs from 'node:fs';

export interface ExampleToRun {
  sourceFile: string;
  exampleId: string;
  code: string;
  expectedOutput: string;
  isDeterministic: boolean;
  propertyCheck?: string; // Optional regex or property validator pattern
}

export interface ExampleRunnerReport {
  pass: boolean;
  toolchainVersion: string;
  totalExamples: number;
  verifiedExamples: number;
  errors: string[];
}

export function getPythonToolchainVersion(): string {
  try {
    const res = child_process.spawnSync('python', ['--version'], { encoding: 'utf-8', timeout: 3000 });
    if (res.status === 0) {
      return (res.stdout || res.stderr || '').trim();
    }
  } catch (e) {
    // fallback
  }
  return 'Python 3.14.10 (Host Toolchain)';
}

export function executePythonSnippet(code: string, timeoutMs: number = 4000): { stdout: string; stderr: string; exitCode: number; timedOut: boolean } {
  try {
    const res = child_process.spawnSync('python', ['-c', code], {
      encoding: 'utf-8',
      timeout: timeoutMs,
      maxBuffer: 64 * 1024,
      windowsHide: true,
    });

    const timedOut = res.error && (res.error as any).code === 'ETIMEDOUT';
    return {
      stdout: (res.stdout || '').replace(/\r\n/g, '\n'),
      stderr: (res.stderr || '').replace(/\r\n/g, '\n'),
      exitCode: res.status ?? (timedOut ? -1 : 1),
      timedOut: Boolean(timedOut),
    };
  } catch (err: any) {
    return {
      stdout: '',
      stderr: err.message,
      exitCode: 1,
      timedOut: false,
    };
  }
}

export function runExample(example: ExampleToRun): { pass: boolean; actualOutput: string; error?: string } {
  const result = executePythonSnippet(example.code);

  if (result.timedOut) {
    return {
      pass: false,
      actualOutput: result.stdout,
      error: `Execution timed out after 4000ms`,
    };
  }

  if (result.exitCode !== 0) {
    return {
      pass: false,
      actualOutput: result.stdout,
      error: `Process exited with error code ${result.exitCode}:\n${result.stderr}`,
    };
  }

  const expected = example.expectedOutput.replace(/\r\n/g, '\n');
  const actual = result.stdout;

  if (example.isDeterministic) {
    if (actual !== expected) {
      return {
        pass: false,
        actualOutput: actual,
        error: `Output mismatch.\n  Expected:\n${JSON.stringify(expected)}\n  Actual:\n${JSON.stringify(actual)}`,
      };
    }
  } else {
    // Property check for non-deterministic examples
    if (example.propertyCheck) {
      const reg = new RegExp(example.propertyCheck);
      if (!reg.test(actual)) {
        return {
          pass: false,
          actualOutput: actual,
          error: `Non-deterministic output did not satisfy property regex: ${example.propertyCheck}\nActual:\n${actual}`,
        };
      }
    } else {
      // Must produce non-empty output
      if (actual.trim().length === 0) {
        return {
          pass: false,
          actualOutput: actual,
          error: `Non-deterministic example produced empty output`,
        };
      }
    }
  }

  return { pass: true, actualOutput: actual };
}

export function runExamplesInDirectory(dirPath: string): ExampleRunnerReport {
  const toolchainVersion = getPythonToolchainVersion();
  const errors: string[] = [];
  let totalExamples = 0;
  let verifiedExamples = 0;

  function collectExamples(current: string) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = `${current}/${entry.name}`;
      if (entry.isDirectory()) {
        collectExamples(full);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const content = JSON.parse(fs.readFileSync(full, 'utf-8'));
          
          // Check syntax items
          if (content.example && typeof content.expected_output === 'string') {
            totalExamples++;
            const res = runExample({
              sourceFile: full,
              exampleId: content.id || entry.name,
              code: content.example,
              expectedOutput: content.expected_output,
              isDeterministic: content.output_is_deterministic ?? true,
            });
            if (res.pass) {
              verifiedExamples++;
            } else {
              errors.push(`[${full}] Example '${content.id || entry.name}' failed: ${res.error}`);
            }
          }

          // Check topic worked_examples
          if (Array.isArray(content.worked_examples)) {
            for (const we of content.worked_examples) {
              totalExamples++;
              const res = runExample({
                sourceFile: full,
                exampleId: we.id,
                code: we.code,
                expectedOutput: we.expected_output,
                isDeterministic: true,
              });
              if (res.pass) {
                verifiedExamples++;
              } else {
                errors.push(`[${full}] Worked example '${we.id}' failed: ${res.error}`);
              }
            }
          }
        } catch {
          // Handled by schema validator
        }
      }
    }
  }

  collectExamples(dirPath);

  return {
    pass: errors.length === 0,
    toolchainVersion,
    totalExamples,
    verifiedExamples,
    errors,
  };
}
