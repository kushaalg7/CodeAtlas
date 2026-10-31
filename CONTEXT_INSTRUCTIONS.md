# CODE ATLAS — Context & Instruction Set

This document defines the foundational architecture, behavioral invariants, operational workflows, and extension instructions for **CODE ATLAS** (CODEMIND Spec v2 Module).

---

## 1. Project Context & Purpose

CODE ATLAS is an educational programming intelligence platform designed to eliminate the beginner-to-competent programmer disconnect.

### Core Ideology & Architecture:
- **Language Neutrality**: Core runtime contracts (`packages/core/src`) contain **zero per-language logic**. Python or any other language plugs in strictly through content packages and adapters (`ExecutionAdapter`, `TraceAdapter`).
- **Strict Evidence Standards**: All code examples in curriculum lessons are executed and verified on a pinned toolchain. Stated output must exactly match verified output. Hand-typed coverage meters are forbidden.
- **Hostile Code Execution Isolation**: All learner-submitted code is treated as hostile. Execution occurs in an isolated process with:
  - 4000ms hard timeout watchdog.
  - 64 KB standard output buffer cap.
  - Network and socket communication disabled.
  - Host filesystem isolation.
- **Privacy First**: Learner progress and learning events are stored client-side in LocalStorage. No learner code is retained beyond the session.

---

## 2. Directory Structure & System Map

```
genaihackathon/
├── apps/
│   └── web/
│       ├── index.html           # Executive Dark Web UI (Lab + Curriculum Hub)
│       └── styles/tokens.css    # AAA-contrast executive dark design tokens
├── content/
│   ├── _shared/concepts/        # Cross-language prerequisite DAG nodes
│   └── python/
│       ├── manifest.json        # Python 3.12 course manifest
│       ├── topics/              # 8 standard lessons (Sections A–P)
│       ├── syntax/              # Syntax references
│       ├── mistakes/            # Common pitfalls & misconceptions
│       ├── exercises/           # Practice tasks
│       └── quizzes/             # Mastery assessments
├── coverage/
│   └── python.json              # CI-computed coverage metrics (100% verified)
├── docs/
│   ├── CODE_ATLAS_SPEC.md       # Master 33-page Spec v2 (Source of Truth)
│   ├── PHASE1_PLAN.md           # Scoped Phase 1 delivery plan
│   ├── PHASE1_REPORT.md         # Phase 1 Gate Report & benchmark latencies
│   └── adr/                     # Architectural Decision Records (0001–0005)
├── packages/
│   ├── core/                    # Language-neutral interfaces & contracts
│   ├── schemas/                 # Zero-dependency Zod-compatible schema validators
│   ├── sandbox/                 # Sandboxed runner, error decoder, AI tutor bridge
│   ├── search/                  # BM25 search engine + Golden Questions RAG
│   ├── events/                  # SM-2 spaced repetition + Bayesian mastery rule
│   └── graph/                   # DAG prerequisite roadmap generator
├── tools/
│   ├── ci/                      # 5-part verification pipeline & accessibility audit
│   ├── serve.ts                 # Full-stack HTTP server & code analysis API
│   └── run_complete_suite.ts    # Master 10-suite runner
├── start_server.cmd             # One-click server launcher (auto Node detection)
├── run_all.cmd                  # One-click test suite runner
└── QUICKSTART_HOME.md           # Home laptop setup instructions
```

---

## 3. Web Platform Capabilities (`http://localhost:3000`)

### Mode 1: Code Intelligence & Architecture Lab
- **Code Input**: Dynamic auto-fitting code editor (up to 10 lines max without empty trailing space).
- **Toolchain Sandbox Execution**: Runs learner code safely with output duration, return codes, and output buffers.
- **Architectural Flowchart**: Generates interactive Mermaid execution flowcharts showing decision branching, function routines, and stdout nodes (with collapse/expand controls).
- **Construct Extraction**: Automatically extracts actual lines of code from user input as concrete examples for detected constructs (*Functions, Loops, Conditions, Variables, I/O*).
- **For Deeper Studies**: Attaches curated authoritative learning links (Official Python Tutorial, Real Python, GeeksforGeeks) for each construct.
- **Line-by-Line Execution Walkthrough**: Step-by-step trace with individual line filter pills and line range selectors.
- **Intelligent Error Diagnostics & Auto-Fixing**: Pinpoints exact error lines, provides plain-English root causes, and generates verified auto-fixes with an "Apply Auto-Fix & Re-run" button.

### Mode 2: Curriculum & Lessons Hub
- 8 beginner lessons strictly formatted with 13 standard sections (Simple Explanation, Technical Nuance, Mental Model, Verified Example, Common Pitfall, Spaced Repetition Card).
- Live CI Quality Coverage Meter computed from actual toolchain execution.

---

## 4. Instructions for Continuing Development / AI Agents

When working on this codebase, adhere strictly to the following 14 standing rules (`AGENTS.md`):

1. **Source of Truth**: Read `docs/CODE_ATLAS_SPEC.md` before coding.
2. **Plan Rule**: Always print a plan in 5 lines or fewer before writing code: what you will build, what you will stub, what is not feasible yet.
3. **No Per-Language Logic in Core**: `packages/core/src` must remain abstract. Specific language logic belongs in `packages/sandbox` or content packages.
4. **No Hand-Typed Coverage**: Coverage must always be generated from test runners into `coverage/python.json`.
5. **Zero External Unverified Dependencies**: Keep dependencies minimal and record ADRs in `docs/adr/`.
6. **Pass All Tests**: After any code modification, run `tools/run_complete_suite.ts`. All 10 verification suites must pass.
7. **Gate Report**: Conclude every task with a gate report: `WORKS / STUBBED / NOT FEASIBLE / RISKS / NEXT STEP PLAN`.
