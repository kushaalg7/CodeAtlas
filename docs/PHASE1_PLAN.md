# Phase 1 Implementation Plan: Python Vertical Slice

## 1. Overview
The goal of Phase 1 is to establish the core architecture, quality verification pipeline, and one complete, high-quality, verified vertical slice for **Python**. Rather than attempting shallow coverage across multiple languages, Phase 1 delivers end-to-end functionality—from schemas and CI validation to in-browser execution and neon visualization—for a strictly scoped set of beginner Python topics.

---

## 2. Language Capability Tiers

As mandated by Spec Section 2 and AGENTS.md Rule 5, capability tiers reflect actual verified execution capabilities. We do not claim any tier that has not been tested and verified.

| Language | Phase 1 Tier | Verified Execution Runtime | Notes |
| :--- | :--- | :--- | :--- |
| **Python** | **Tier A** | Pyodide (WebAssembly) in Web Worker | Full interactive playground with stdin/stdout and trace-ready events. |
| **JavaScript** | **Tier B** | Web Worker JS evaluation (planned) | Runnable playground; trace adapter deferred to Phase 3. |
| **TypeScript** | **Tier B** | Browser-side transpile + Worker (planned) | Transpilation + execution; deferred to Phase 3. |
| **SQL** | **Tier B** | SQLite-WASM in Web Worker (planned) | In-memory relational queries; deferred to Phase 3. |
| **C** | **Tier C** | Pre-recorded verified output | Read-only verified examples; server microVM required in Phase 3. |
| **C++** | **Tier C** | Pre-recorded verified output | Read-only verified examples; server microVM required in Phase 3. |
| **Rust** | **Tier C** | Pre-recorded verified output | Read-only verified examples; server microVM required in Phase 3. |
| **Go** | **Tier C** | Pre-recorded verified output | Read-only verified examples; server microVM required in Phase 3. |
| **Java** | **Tier C** | Pre-recorded verified output | Read-only verified examples; server microVM required in Phase 3. |
| **C#** | **Tier C** | Pre-recorded verified output | Read-only verified examples; server microVM required in Phase 3. |

> **Principle**: Only Python is built and tested in Phase 1. All other languages remain unbuilt until the Python vertical slice satisfies the Phase 1 Gate.

---

## 3. Scoped Python Content Targets (8 Lessons Only)

To prevent quality drift and avoid superficial explanations, the Python beginner track is intentionally bounded to **exactly 8 lessons**, rather than attempting the entire language.

### Beginner Lesson Scope:
1. `python-01-syntax-and-execution`: Python syntax fundamentals, indentation rules, comments, running scripts.
2. `python-02-variables-and-types`: Variable assignment, dynamic typing, primitive types (`int`, `float`, `bool`, `str`), `type()` inspection.
3. `python-03-operators`: Arithmetic, string concatenation, comparison operators (`==`, `!=`, `<`, `>`), logical operators (`and`, `or`, `not`).
4. `python-04-input-output`: `print()` formatting, f-strings, interactive console input via `input()` with the playground stdin panel.
5. `python-05-conditions`: Conditional branching with `if`, `elif`, `else`, truthiness, nested conditional structures.
6. `python-06-loops`: Counted iteration with `for` loops and `range()`, conditional iteration with `while` loops, `break` and `continue`.
7. `python-07-functions-basics`: Defining functions with `def`, positional parameters, return values, docstrings.
8. `python-08-functions-scope`: Default parameter values, keyword arguments, local vs global variable scope.

### Explicitly Excluded from Phase 1 (Deferred to Later Phases):
- **Intermediate Python** (Phase 2 / Phase 3): Lists, tuples, dicts, sets, file I/O, custom classes/OOP, exception handling (`try`/`except`), modules and packages.
- **Advanced Python** (Phase 4): Decorators, generators, context managers, async/await, metaprogramming.

---

## 4. Content Requirements per Lesson (Spec §5.1)

Every one of the 8 lessons must strictly implement the 13-part template:
1. **Learning Objectives**: Measurable statements ("You can write...", "You can predict the output of...").
2. **Prerequisites Check**: 3-question diagnostic with links to prior concepts.
3. **Simple Explanation**: Analogy-based, accessible prose.
4. **Technical Explanation**: Precise terminology, memory semantics, and CPython runtime behavior.
5. **Syntax Definition**: Grammar/syntax block with parameter breakdowns.
6. **Worked Examples**: Progression from simple illustrative snippets to realistic usage.
7. **Output & Line-by-Line Walkthrough**: Exact stdout matched against CI execution.
8. **Visual Demonstration**: Neon-themed Mermaid diagram (flowchart, call stack, or state transition).
9. **"Predict the Output" Challenges**: Interactive mini-puzzles before showing results.
10. **Common Mistakes**: Linked to mistake library items with error text from real toolchain runs.
11. **Practice Exercises**: Graded difficulty code challenges with test assertions.
12. **Knowledge Assessment**: Multiple-choice quizzes tagged with concepts and misconceptions.
13. **Summary & Next Steps**: Key takeaways and "Open in Trace Studio" bridge button.

---

## 5. Toolchain Pinning & Quality Automation

- **Target Toolchain**: Python `3.12.x` (CPython reference standard) and Pyodide `0.26.x`.
- **Automated Verification**:
  - `tools/ci/validate-schemas.ts`: Validates all JSON/Markdown frontmatter against Zod schemas.
  - `tools/ci/run-examples.ts`: Runs every code snippet in a pinned Docker container / sandbox and verifies stdout against `expected_output`.
  - `tools/ci/check-links.ts`: Verifies all documentation links (with offline mock support).
  - `tools/ci/check-graph.ts`: Detects broken prerequisites and orphan concept nodes.
  - `tools/ci/generate-coverage.ts`: Computes `coverage.json` machine-readably (no hand-typed coverage).
- **Review Status Gating**:
  - Newly authored content starts as `status: draft`.
  - Automated CI execution promotes content to `status: verified`.
  - Only human reviewers can promote to `status: reviewed` (AGENTS.md Rule 4 & Rule 6).

---

## 6. Phase 1 Step-by-Step Delivery Schedule

- **Step 0 (Current)**: Architectural Decision Records (`docs/adr/`) and Phase 1 Scope (`docs/PHASE1_PLAN.md`).
- **Step 1**: Zod schemas, TypeScript types, and core interfaces (`packages/schemas`, `packages/core`).
- **Step 2**: CI quality validation pipeline and example runner (`tools/ci`).
- **Step 3**: Web application shell, design system tokens, and neon Mermaid renderer (`apps/web`).
- **Step 4**: Python Web Worker Pyodide sandbox and abuse test suite (`packages/sandbox`).
- **Step 5**: The 8 Python beginner lessons and concept files (`content/python`, `content/_shared/concepts`).
- **Step 6**: In-memory hybrid search v1, quizzes, and Learning DNA events (`packages/search`, `packages/events`).
- **Step 7**: Phase 1 Gate verification, automated metric validation, and gate report (`docs/PHASE1_REPORT.md`).
