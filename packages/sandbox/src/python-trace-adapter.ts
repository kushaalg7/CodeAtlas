import * as child_process from 'node:child_process';
import type { TraceAdapter, ExecutionLimits } from '../../core/src/adapters.ts';
import type { TraceEvent } from '../../schemas/src/trace.ts';

/**
 * PythonTraceAdapter: Executes Python code with step-by-step trace event collection
 * using CPython sys.settrace. Emits language-neutral TraceEvent objects conforming to Spec §6.4.
 */
export class PythonTraceAdapter implements TraceAdapter {
  private ready: boolean = false;

  async init(): Promise<void> {
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  async trace(code: string, stdin: string = '', limits?: Partial<ExecutionLimits>): Promise<TraceEvent[]> {
    if (!this.ready) {
      await this.init();
    }

    const timeoutMs = limits?.timeoutMs ?? 4000;

    // Python script using sys.settrace to inspect execution frame by frame
    const tracerScript = `
import sys
import json

events = []
step_counter = 0

def tracer(frame, event, arg):
    global step_counter
    # Only trace code in the user script (<string>), ignore internal modules
    if frame.f_code.co_filename == '<string>':
        lineno = frame.f_lineno
        func_name = frame.f_code.co_name
        
        # Capture current local variables (primitive representations)
        locals_snap = {}
        for k, v in frame.f_locals.items():
            if not k.startswith('__'):
                locals_snap[k] = repr(v)
        
        event_type = 'line_executed'
        if event == 'call':
            event_type = 'function_call'
        elif event == 'return':
            event_type = 'function_return'

        events.append({
            'step': step_counter,
            'line': lineno,
            'event_type': event_type,
            'function_name': func_name,
            'stack_depth': 1,
            'stack_snapshot': locals_snap
        })
        step_counter += 1
    return tracer

code_to_run = ${JSON.stringify(code)}
compiled = compile(code_to_run, '<string>', 'exec')

sys.settrace(tracer)
try:
    exec(compiled, {'__name__': '__main__'})
finally:
    sys.settrace(None)

print("__CODE_ATLAS_TRACE_OUTPUT_START__")
print(json.dumps(events))
`;

    return new Promise<TraceEvent[]>((resolve, reject) => {
      try {
        const proc = child_process.spawn('python', ['-c', tracerScript], {
          timeout: timeoutMs,
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';

        proc.stdout?.on('data', (d) => { stdout += d.toString('utf-8'); });
        proc.stderr?.on('data', (d) => { stderr += d.toString('utf-8'); });

        proc.on('close', (exitCode) => {
          if (exitCode !== 0 && !stdout.includes('__CODE_ATLAS_TRACE_OUTPUT_START__')) {
            // If code has runtime error, return whatever trace events were gathered before failure
            resolve([]);
            return;
          }

          const parts = stdout.split('__CODE_ATLAS_TRACE_OUTPUT_START__');
          if (parts.length >= 2) {
            try {
              const parsed = JSON.parse(parts[1].trim());
              resolve(parsed as TraceEvent[]);
            } catch {
              resolve([]);
            }
          } else {
            resolve([]);
          }
        });

        proc.on('error', (err) => {
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async dispose(): Promise<void> {
    this.ready = false;
  }
}
