# CODE ATLAS — Universal Programming Language Learning & Knowledge Centre

> **Module specification for CODEMIND (v2)**  
> Built with zero-dependency architecture, strict verification discipline, and comprehensive testing across all four phases.

---

## 🚀 Quickstart

### 1. Run Complete Verification Suite (All 10 Test Suites)
Run the consolidated test runner verifying all 4 phases:
```powershell
& "$env:APPDATA\Antigravity\bin\agy-node.cmd" --experimental-strip-types tools/run_complete_suite.ts
```

### 2. Start the Local Interactive Web Server
Start the local server hosting the web app shell and live APIs:
```powershell
& "$env:APPDATA\Antigravity\bin\agy-node.cmd" --experimental-strip-types tools/serve.ts
```
Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Web App**: `http://localhost:3000/`
- **Live Coverage Meter API**: `http://localhost:3000/api/coverage`
- **Lessons API**: `http://localhost:3000/api/topics`
- **Search API**: `http://localhost:3000/api/search?q=loops`

---

## 🏛️ Architecture & Repository Layout

```text
/docs/
  CODE_ATLAS_SPEC.md       # Source of truth specification (v2)
  PHASE1_PLAN.md           # Scoped implementation plan & language tiers
  PHASE1_REPORT.md         # Final Phase 1 gate report & benchmarks
  adr/                     # Architectural Decision Records (0001 - 0005)
/apps/web/                 # UI hub shell (Sections A to P, live coverage meter, tokens)
/packages/schemas/         # Zod runtime schemas & TypeScript types (single source of truth)
/packages/core/            # Language-neutral interfaces (LanguagePackage, ExecutionAdapter)
/packages/sandbox/         # Execution adapters, trace adapters, error decoders, and abuse limits
/packages/search/          # BM25-style search engine v1 & Grounded RAG with 20 Golden Questions
/packages/graph/           # Concept DAG graph & dynamic Roadmap Generator v1
/packages/events/          # Learning DNA event store, SM-2 spaced repetition, & mastery rules
/content/python/           # 8 beginner lessons (13-part template), syntax, mistakes, quizzes
/content/_shared/concepts/ # Language-neutral concept graph nodes
/tools/ci/                 # 5-stage automated CI quality pipeline & coverage generator
```

---

## 📊 Summary of Implemented Phases

| Phase | Milestone | Status | Key Features |
| :--- | :--- | :---: | :--- |
| **Phase 1** | **Foundations & Python Slice** | **VERIFIED** | 5 ADRs, Zod schemas, 5-part CI pipeline, 8 beginner Python lessons (100% verified examples), Web Worker sandbox. |
| **Phase 2** | **Intelligence & Integration** | **VERIFIED** | Python `sys.settrace` Trace Studio adapter, Grounded RAG with 20 Golden Questions, Error Message Decoder, AI Tutor context, Roadmap Generator v1. |
| **Phase 3** | **Breadth & Comparisons** | **VERIFIED** | Pluggable language package system (`testlang`), 10 language manifests, Comparison Engine ("Looks the same, behaves differently"), Code Pattern Library ($O(N)$ justifications). |
| **Phase 4** | **Depth & Polish** | **VERIFIED** | SM-2 Spaced Repetition queue, Interview Prep Hub (Fast I/O, bignum precision), Accessibility Audit (AAA contrast, prefers-reduced-motion). |

---

## 🛡️ Standing Rules Compliance (AGENTS.md)
1. **Source of Truth**: All structures align strictly with [docs/CODE_ATLAS_SPEC.md](docs/CODE_ATLAS_SPEC.md).
2. **Honest Scoping & Tiers**: Python declared at Tier A; compiled languages start honestly at Tier B/C.
3. **Automated Coverage**: The coverage meter is calculated directly by the CI pipeline into [coverage/python.json](coverage/python.json)—never typed by hand.
4. **Hostile Code Protection**: Hard execution watchdogs, 64KB buffer caps, and network socket denial enforced.
5. **Privacy by Design**: Complete user data viewing, export, and purge functionality in [packages/events/src/learner-store.ts](packages/events/src/learner-store.ts).
