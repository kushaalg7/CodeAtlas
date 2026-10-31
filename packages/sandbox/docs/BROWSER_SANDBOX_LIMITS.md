# Browser Sandbox Limits and Server-Side Fallback Analysis

## Status
Verified Architecture Analysis (Step 4)

## 1. What Browser-Side Sandboxing (Pyodide in Web Worker) Enforces
1. **Process & CPU Isolation via Worker Termination**:
   - Because the Python interpreter runs in a dedicated background `Worker`, infinite loops (`while True: pass`) cannot freeze the browser UI or main event loop.
   - Watchdog timer calls `worker.terminate()`, instantly killing the WASM thread.
2. **Output Stream Capping**:
   - Standard output and error buffers are strictly capped (default 64 KB). Flood attacks (`while True: print(...)`) are truncated to prevent DOM out-of-memory crashes.
3. **Host Filesystem Isolation**:
   - Pyodide executes against an ephemeral in-memory Emscripten virtual filesystem (`MEMFS`). It has zero access to the user's host OS disk, operating system files, or device hardware.
4. **Network Restrictions**:
   - Web Workers cannot open raw TCP/UDP sockets (OS-level `socket` library is not supported by WebAssembly without Emscripten websocket bridges, which are stubbed/disabled).

---

## 2. What Browser-Side Sandboxing CANNOT Guarantee
1. **Low-Level POSIX System Calls**:
   - Processes, signals (`signal.SIGKILL`), fork bombs (`os.fork()`), and native Unix domain sockets do not exist in the browser WASM sandbox.
2. **Total Memory Eviction Without Worker Termination**:
   - WebAssembly memory allocations expand the linear memory buffer. Garbage collection cannot force the browser engine to shrink the WASM heap back; full memory recovery requires terminating and recreating the Worker.
3. **Cryptographic & Hardware Timing Isolation**:
   - Browser timers (`performance.now()`, `SharedArrayBuffer`) are subject to browser mitigations for Spectre/Meltdown; cycle-accurate profiling is impossible in-browser.
4. **Third-Party C-Extensions with Native Machine Code**:
   - Only Python wheels compiled specifically for WebAssembly (`wasm32-unknown-emscripten`) can run. Arbitrary binary extensions (.so/.dll) cannot load.

---

## 3. What a Server-Side Fallback (Phase 3 MicroVM / gVisor) Adds
1. **Complete Kernel Sandboxing**:
   - Linux kernel namespaces, cgroups v2 memory limits (e.g., hard 128MB cap), and gVisor `runsc` system call interception.
2. **True Native Multithreading & POSIX Compliance**:
   - Full support for native compilation (C, C++, Rust, Go, C#), threads, and OS signals.
3. **Guaranteed Network Air-Gapping**:
   - Network namespace configured with zero network interfaces (`--net=none`), preventing any external data egress.
4. **Ephemeral Disk Quotas**:
   - Read-only root filesystem with a temporary 10MB tmpfs scratch space deleted immediately upon process termination.
