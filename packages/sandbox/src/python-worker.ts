/**
 * Python Web Worker Sandbox Script for Browser Execution (Pyodide)
 * Spec Section 6.1 & 6.2
 */

export const PYTHON_WORKER_SCRIPT = `
let pyodideReady = false;
let pyodide = null;

self.onmessage = async (event) => {
  const { type, code, stdin, limits } = event.data;

  if (type === 'init') {
    try {
      importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js');
      pyodide = await loadPyodide({
        stdout: (text) => self.postMessage({ type: 'stdout', text: text + '\\n' }),
        stderr: (text) => self.postMessage({ type: 'stderr', text: text + '\\n' })
      });
      // Disable network sockets
      pyodide.runPython(\`
import sys
import socket
def _blocked(*args, **kwargs):
    raise PermissionError("Network access is disabled in the CODE ATLAS sandbox.")
socket.socket = _blocked
socket.create_connection = _blocked
\`);
      pyodideReady = true;
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'init_error', error: err.message });
    }
  } else if (type === 'run') {
    if (!pyodideReady) {
      self.postMessage({ type: 'error', error: 'Pyodide runtime not initialized.' });
      return;
    }
    try {
      if (stdin) {
        pyodide.runPython(\`
import sys, io
sys.stdin = io.StringIO(\${JSON.stringify(stdin)})
\`);
      }
      await pyodide.runPythonAsync(code);
      self.postMessage({ type: 'done', exitCode: 0 });
    } catch (err) {
      self.postMessage({ type: 'done', exitCode: 1, error: err.message });
    }
  }
};
`;
