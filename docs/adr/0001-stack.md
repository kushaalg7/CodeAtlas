# ADR 0001: Core Technology Stack & Monorepo Architecture

## Status
Accepted

## Context
CODE ATLAS is an integrated module of CODEMIND serving as a universal programming language learning and knowledge center. The system requires:
1. Strict separation between shared core contracts/schemas, sandbox execution runners, search engines, concept graph logic, and the web user interface.
2. Safe pluggability for new language packages without touching core code.
3. Fast, accessible, mobile-first web rendering with dark-theme neon design tokens ("ATLAS GLOW").
4. Unified type safety and schema validation across content authoring, CI runners, and browser components.

## Options Considered

### Option 1: TypeScript Monorepo with React and Next.js (App Router) & pnpm
- Unified language (TypeScript) across schemas, CI tools, client web application, and sandbox worker bridges.
- Monorepo package isolation (`apps/web`, `packages/schemas`, `packages/core`, `packages/sandbox`, `packages/search`, `packages/graph`, `packages/events`, `tools/ci`).
- Native static rendering (SSG) and server-side rendering (SSR) for fast lesson page loads and search engine indexing.
- Native CSS variable support for the neon design system.

### Option 2: Python Full-Stack (FastAPI / Django + Jinja2 / HTMX)
- Native Python environment for backend logic and Python code execution.
- Weaker client-side interactivity for browser WebAssembly sandboxes (Pyodide), interactive Cytoscape graphs, and live neon animations.
- Code sharing between browser workers and schemas requires duplicate type definitions (Pydantic vs TypeScript).

### Option 3: Vite SPA (Single Page Application) with React
- Fast local development and simple static hosting.
- Poor SEO, slow initial time-to-first-byte for large content trees, and lacks clean integrated API routes for server-side sandbox delegation and RAG proxying.

## Decision
Adopt **Option 1**: A **TypeScript Monorepo using pnpm workspaces**, **Next.js (App Router)** with **React**, and **Tailwind CSS / CSS Variables**.

Key package layout:
- `apps/web`: Next.js 15+ frontend application (hub shell, lesson viewer, playground UI).
- `packages/schemas`: Zod schemas and TypeScript types (single source of truth for content and events).
- `packages/core`: Abstract interfaces (`LanguagePackage`, `ExecutionAdapter`, `TraceAdapter`, `LearningContext`).
- `packages/sandbox`: Web Worker wrappers and execution limits.
- `packages/search`: BM25 and vector retrieval engines.
- `packages/graph`: Concept DAG storage, traversal, and Cytoscape/Mermaid data mappers.
- `packages/events`: Learning DNA event emitters and mastery evaluation rules.
- `tools/ci`: Content validators, example execution runner, link checkers, and coverage generator.

## Trade-offs
- **Pros**: Complete end-to-end type safety; schema sharing between CI tools and browser; fast hybrid rendering; strong WebAssembly and Web Worker ecosystem.
- **Cons**: Node.js tooling overhead; strict build boundaries require deliberate workspace configuration.

## Rejected Options & Reasons for Rejection
1. **Python Full-Stack (FastAPI / Django)**: Rejected because CODEMIND requires responsive in-browser Web Worker execution (Pyodide, SQLite-WASM) and interactive client graph rendering (Cytoscape.js). Maintaining schemas across Python (Pydantic) and Web (TypeScript) would create drift and violate Rule 9.
2. **Vite SPA**: Rejected because client-only SPAs have higher cold-start latency on mobile devices when loading dense lesson documents, lack built-in server-side API endpoints for future server sandboxes, and require heavier client bundles.
3. **npm / yarn workspaces**: Rejected in favor of `pnpm` due to pnpm's strict dependency isolation, content-addressable storage, and fast CI execution without phantom dependencies.
