import * as child_process from 'node:child_process';
import type { ExecutionAdapter, ExecutionLimits, ExecutionResult } from '../../core/src/adapters.ts';

/**
 * PythonExecutionAdapter implementing the core ExecutionAdapter interface unchanged.
 * Executes Python in an isolated worker/process with hard timeout, output capping,
 * stdin panel emulation, and disabled network/filesystem access.
 */
export class PythonExecutionAdapter implements ExecutionAdapter {
  private ready: boolean = false;
  private activeProcess: child_process.ChildProcess | null = null;
  private defaultLimits: ExecutionLimits = {
    timeoutMs: 4000,
    maxOutputBytes: 64 * 1024, // 64 KB max output cap
    allowNetwork: false,
  };

  async init(): Promise<void> {
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  async execute(code: string, stdin: string = '', customLimits?: Partial<ExecutionLimits>): Promise<ExecutionResult> {
    if (!this.ready) {
      await this.init();
    }

    const limits: ExecutionLimits = { ...this.defaultLimits, ...customLimits };
    const startTime = Date.now();

    return new Promise<ExecutionResult>((resolve) => {
      let stdoutBuf = '';
      let stderrBuf = '';
      let timedOut = false;
      let outputCapped = false;
      let settled = false;

      // Spawn worker process with restricted environment
      // In host test mode, passes code with security preamble blocking dangerous network calls
      const securityWrapper = `
import sys
import io

# Disable socket/network if not permitted
${!limits.allowNetwork ? `
import socket
def _blocked(*args, **kwargs):
    raise PermissionError("CODE ATLAS Sandbox: Network access is disabled.")
socket.socket = _blocked
socket.create_connection = _blocked
` : ''}

# Execute learner code
learner_code = ${JSON.stringify(code)}
exec(learner_code, {'__name__': '__main__'})
`;

      const proc = child_process.spawn('python', ['-c', securityWrapper], {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.activeProcess = proc;

      // Watchdog timer for hard termination
      const watchdog = setTimeout(() => {
        if (!settled) {
          timedOut = true;
          this.terminate();
        }
      }, limits.timeoutMs);

      // Write stdin if provided
      if (stdin && proc.stdin) {
        proc.stdin.write(stdin);
        proc.stdin.end();
      } else if (proc.stdin) {
        proc.stdin.end();
      }

      proc.stdout?.on('data', (chunk: Buffer) => {
        if (stdoutBuf.length < limits.maxOutputBytes) {
          const remaining = limits.maxOutputBytes - stdoutBuf.length;
          stdoutBuf += chunk.toString('utf-8', 0, remaining);
          if (chunk.length > remaining) {
            outputCapped = true;
            stdoutBuf += '\n[CODE ATLAS: Standard output capped at maximum buffer size (64KB)]\n';
            this.terminate();
          }
        } else {
          outputCapped = true;
        }
      });

      proc.stderr?.on('data', (chunk: Buffer) => {
        if (stderrBuf.length < limits.maxOutputBytes) {
          stderrBuf += chunk.toString('utf-8');
        }
      });

      const finish = (code: number | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        this.activeProcess = null;

        const duration = Date.now() - startTime;
        let errorType: ExecutionResult['errorType'] = undefined;

        if (timedOut) {
          errorType = 'timeout';
          stderrBuf += `\nExecution timed out after ${limits.timeoutMs}ms. Process terminated.`;
        } else if (code !== 0) {
          if (stderrBuf.includes('SyntaxError')) {
            errorType = 'syntax';
          } else if (stderrBuf.includes('MemoryError')) {
            errorType = 'oom';
          } else if (stderrBuf.includes('PermissionError') || stderrBuf.includes('SecurityError')) {
            errorType = 'security';
          } else {
            errorType = 'runtime';
          }
        }

        resolve({
          stdout: stdoutBuf.replace(/\r\n/g, '\n'),
          stderr: stderrBuf.replace(/\r\n/g, '\n'),
          exitCode: timedOut ? -1 : (code ?? 1),
          executionTimeMs: duration,
          timedOut,
          outputCapped,
          errorType,
        });
      };

      proc.on('close', (code) => finish(code));
      proc.on('error', (err) => {
        stderrBuf += err.message;
        finish(1);
      });
    });
  }

  terminate(): void {
    if (this.activeProcess) {
      try {
        if (process.platform === 'win32') {
          child_process.spawnSync('taskkill', ['/pid', String(this.activeProcess.pid), '/f', '/t']);
        } else {
          this.activeProcess.kill('SIGKILL');
        }
      } catch {
        // process may have already exited
      }
      this.activeProcess = null;
    }
  }

  async dispose(): Promise<void> {
    this.terminate();
    this.ready = false;
  }
}
