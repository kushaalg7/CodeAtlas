# ADR 0005: Client State Management and Learning DNA Architecture

## Status
Accepted

## Context
Spec Section 15 and Section 15.1 require:
1. **Shared Learning Context**: A standardized object (`user_id`, `language`, `version`, `current_lesson_id`, `current_concept_ids`, `recent_errors`, `quiz_results`, `mastery_snapshot`, `trace_session_id`) shared across modules (UI, AI Tutor, Trace Studio, Playground).
2. **Learning DNA Events**: Event emission on key learner actions (`lesson_started`, `lesson_completed`, `quiz_answered`, `exercise_submitted`, `playground_run`, `trace_opened`, `search_performed`, `roadmap_progress`).
3. **Evidence-Weighted Mastery**: An automated scoring model updating concept mastery based on quiz outcomes, hint count, and exercise test results.
4. **Privacy & Data Governance**: AGENTS.md Rule 12 mandates never retaining learner code beyond configured retention settings; learners must be able to view, export, and delete all their Learning DNA records locally.

## Options Considered

### Option 1: Lightweight Modular Store (Zustand) with IndexedDB/LocalStorage & Typed Event Bus
- Small footprint (~1 KB), zero boilerplate, works seamlessly with React and non-React modules (e.g. background event dispatchers).
- Learning context and UI preferences (theme, glow intensity, reduced motion) stored in local state.
- Learning DNA events stored locally in IndexedDB / LocalStorage, providing full offline capability and instant learner-facing data inspect/export/delete.
- Strict event emitter pipeline in `packages/events` that computes evidence-weighted mastery snapshots.

### Option 2: Redux Toolkit (RTK)
- Standard centralized state container with action logging and DevTools.
- Excessive boilerplate for simple educational state transitions; heavy bundle size; adds unnecessary abstraction layers for local offline state.

### Option 3: Full Server-Side Session & Remote Database Persistence
- Every interaction (keystroke, tab switch, quiz answer) posted immediately to a backend server.
- High server bandwidth costs; breaks when the user is on low-bandwidth or offline networks; increases the risk of inadvertent learner code logging violating AGENTS.md Rule 12.

## Decision
Adopt **Option 1**:
1. **Client State**:
   - Use **Zustand** stores in `apps/web` for active UI state, lesson navigation, version selector, and playground settings.
2. **Learning DNA & Event Bus**:
   - Centralize event types and validation in `packages/schemas` and mastery computation in `packages/events`.
   - Store events locally in the browser (`localStorage` / `IndexedDB`) by default.
   - Implement learner privacy controls: **View Records**, **Export JSON**, and **Clear / Delete All Learning Data** immediately wiping local tables.
3. **Evidence-Weighted Mastery Formula**:
   - Mastery per concept is modeled as a decaying weighted confidence score $M \in [0.0, 1.0]$.
   - Quiz correct on first try: $+0.25$; quiz correct after hints: $+0.10$; quiz incorrect: $-0.15$; exercise test passed: $+0.35$.
   - Concepts transition through states: `locked` (missing prereqs) → `available` (prereqs met) → `in_progress` (events recorded) → `mastered` ($M \ge 0.80$).

## Trade-offs
- **Pros**: Zero latency; privacy by design (data stays on learner's machine); instant data export and deletion; full offline support.
- **Cons**: Clearing browser cache erases unexported learner progress unless cloud sync is explicitly enabled in Phase 2.

## Rejected Options & Reasons for Rejection
1. **Redux Toolkit**: Rejected due to high boilerplate, complex slices, and larger bundle size compared to Zustand.
2. **Server-Mandatory Persistence**: Rejected because CODE ATLAS is designed to work on low-bandwidth connections (Spec Section 1) and storing user code remotely increases privacy risks (AGENTS.md Rule 12).
3. **Direct React Context without external store**: Rejected because passing high-frequency events (playground runs, trace steps) through top-level React context triggers broad component re-renders and lags the UI.
