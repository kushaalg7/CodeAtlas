# ADR 0002: Sandbox Architecture and Untrusted Code Execution

## Status
Accepted

## Context
Learner code submitted in the interactive playground is untrusted and hostile by default (AGENTS.md Rule 8). The execution environment must enforce:
1. Strict resource limits: hard CPU timeouts, memory caps, stdout/stderr size limits, process count limits.
2. Network and filesystem isolation: zero host filesystem access, zero network calls by default.
3. Rapid feedback for beginner learners with zero cold-start delay where feasible.
4. Language-specific execution requirements: interpreted dynamic languages (Python), relational query engines (SQL), and compiled native languages (C, C++, Rust, Go, Java, C#).

## Options Considered

### Option 1: Browser-Side WebAssembly (Pyodide for Python, SQLite-WASM for SQL) in Isolated Web Workers
- Python executes inside Pyodide (CPython compiled to WebAssembly) within a dedicated Web Worker.
- SQL executes inside an in-memory SQLite WebAssembly build in a Web Worker.
- Worker termination (`worker.terminate()`) guarantees killing runaway CPU loops or infinite allocations.
- Zero server hosting compute costs; instant startup once worker script is cached; complete client-side data isolation.
- Cannot compile or run native binaries (C, C++, Go, Rust) directly with full standard library / POSIX fidelity without heavy emscripten ports.

### Option 2: Server-Side MicroVMs (AWS Firecracker) or Container Sandboxes (Google gVisor / Docker)
- Each execution runs in an ephemeral microVM or container hardened with gVisor `runsc`, seccomp-bpf, cgroups v2, and no host volume mounts.
- Enforces strict process, memory, network, and disk quotas at the Linux kernel boundary.
- Works universally across all languages (C, C++, Rust, Go, Java, Python, C#).
- High infrastructure complexity, ongoing server costs, network latency, and queue cold starts.

### Option 3: Browser-Only `eval` / Host Server Execution
- Running learner code directly in the host server OS or browser main thread.
- Catastrophic security vulnerability (host takeover, data theft, frozen browser tabs).

## Decision
Adopt a **Tiered Hybrid Sandbox Strategy**:

1. **Phase 1 Vertical Slice (Python)**:
   - Run Python via **Pyodide in an isolated Web Worker**.
   - Enforce client-side protections:
     - Hard execution timeout via worker watchdog timer (`worker.terminate()` after 5000ms).
     - Standard output buffer cap (max 64 KB) to avoid browser lockup from infinite print loops.
     - Stdin emulation panel using synchronous worker message channels.
     - Web Worker environment has no DOM access, and `fetch`/`XMLHttpRequest`/`WebSocket` are disabled or stubbed.
2. **SQL (Phase 3)**:
   - Run via **official SQLite WebAssembly runtime** in a dedicated Web Worker with in-memory virtual databases.
3. **Compiled Languages (Phase 3 - C, C++, Rust, Go, Java, C#)**:
   - Launch initially as **Tier C (pre-recorded verified output)** or **Tier B**.
   - For runnable execution in Phase 3, require an isolated **server-side container sandbox running under gVisor (`runsc`)** with ephemeral lifecycles, memory limits (128 MB), CPU quota (1 core, 5s timeout), and network disabled (`--net=none`).

## Trade-offs
- **Pros**: Zero backend server cost and instant response for Python and SQL; robust fault isolation via Web Worker termination; high security for compiled languages via gVisor.
- **Cons**: Initial download size for Pyodide runtime (~10MB cached); browser-side sandbox cannot simulate low-level OS operations, threads, or raw sockets.

## Rejected Options & Reasons for Rejection
1. **Running all languages in the browser**: Rejected because compiling C, C++, Rust, and Go to WASM in-browser requires massive multi-megabyte toolchain bundles, lacks native libc semantics, and produces misleading execution fidelity.
2. **Server-side execution for beginner Python**: Rejected for Phase 1 because client-side Web Workers eliminate server operating costs, provide zero-queue instant execution, and allow offline interactive learning.
3. **Unsandboxed host execution or direct `eval()`**: Strongly rejected due to AGENTS.md Rule 8 (treat all learner code as hostile).
