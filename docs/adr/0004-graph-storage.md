# ADR 0004: Concept Knowledge Graph Storage and Visualization Architecture

## Status
Accepted

## Context
Spec Section 12 and Section 20 mandate:
1. **Language-Neutral Concept Graph**: Concepts (e.g., `variables`, `functions`, `recursion`) linked by directed semantic edges (`prerequisite`, `part-of`, `related`, `contrasts-with`, `commonly-confused-with`, `leads-to`).
2. **Dual-Scale Visualization**:
   - Small diagrams: Lesson-level visual demonstrations, call stacks, loop traces, state machines, and local 3–5 node concept neighborhoods.
   - Large graph: Full interactive language-wide concept graph (hundreds of nodes) with pan, zoom, filtering, and "my gaps" mastery overlays.
3. **Accessibility**: Accessible list/tree fallback for screen readers and small mobile screens (Spec Section 12).
4. **Security**: Mermaid SVG rendering must not expose cross-site scripting (XSS) vectors.

## Options Considered

### Option 1: File-Based JSON Nodes + Cytoscape.js for Large Graph + Neon Mermaid for Local Diagrams
- Store concept nodes as individual JSON files in `content/_shared/concepts/<concept-id>.json`.
- Render the full global knowledge graph in the browser using **Cytoscape.js** (canvas/WebGL-backed, handles thousands of nodes and edges smoothly with fluid physics layouts, pan, and zoom).
- Use **Mermaid.js** exclusively for small, static diagrams within lessons (flowcharts, sequence diagrams, class diagrams) styled with the "ATLAS GLOW" neon theme.
- Enforce strict Mermaid security (`securityLevel: 'strict'`) and handle node click navigation via post-rendered SVG event listeners rather than unsafe raw HTML callbacks.
- Provide an accessible hierarchical HTML tree/list view alongside the graph.

### Option 2: Render Everything in Mermaid.js
- Single visualization engine for all diagrams and the global knowledge graph.
- Unusable at scale: Mermaid creates heavy DOM SVG elements that lag severely when rendering 50+ nodes; lacks native smooth pan/zoom or force-directed physics layout.
- Click events require relaxed security settings (`securityLevel: 'loose'`), which violates safe sandbox rules.

### Option 3: Dedicated Graph Database (Neo4j / Memgraph)
- Powerful Cypher query language for graph traversals and pattern matching.
- Requires running a separate database server daemon; decouples graph schema from git version control, making pull requests, CI verification, and diff-based code reviews difficult.

## Decision
Adopt **Option 1**:
1. **Storage**:
   - Single source of truth in git: Concept nodes are stored as JSON files in `content/_shared/concepts/<concept-id>.json`.
   - Relationships and prerequisite DAGs are validated by CI during Step 2 (checking for broken links or orphan nodes).
   - In-memory adjacency DAG index compiled at build time for the client, with optional Postgres adjacency tables in Phase 2 for server-side graph queries.
2. **Visualization**:
   - **Cytoscape.js** for the large interactive knowledge graph and roadmap views, styled using CSS variables from the shared "ATLAS GLOW" design token palette (`#0a0e1a`, `#00f0ff`, `#39ff14`, `#ffb300`, etc.).
   - **Mermaid.js** strictly for small diagrams (max ~25 nodes) embedded in lesson markdown.
   - Mermaid initialized with `theme: 'base'`, `securityLevel: 'strict'`, and interactive event listeners bound to SVG nodes post-rendering.
   - Screen-reader accessible collapsible list/tree fallback view provided for all graph interfaces.

## Trade-offs
- **Pros**: Version-controlled graph in git; Cytoscape.js offers 60fps performance on large node graphs; Mermaid remains easy to write for lesson authors; 100% compliant with accessibility and strict CSP requirements.
- **Cons**: Two visualization libraries in the frontend bundle (Cytoscape + Mermaid); requires maintaining style consistency between Cytoscape stylesheets and Mermaid theme variables.

## Rejected Options & Reasons for Rejection
1. **Rendering the entire knowledge graph in Mermaid**: Rejected because Mermaid DOM scaling limits choke on graphs with hundreds of nodes and cannot provide fluid canvas-based exploration.
2. **Neo4j / Graph DB daemon**: Rejected because content must remain version-controlled plain text and JSON files (Spec Section 3 and AGENTS.md Rule 9). An external graph database introduces operational bloat without benefit for static educational ontologies.
3. **Mermaid `click` callbacks with `securityLevel: 'loose'`**: Rejected because loose security allows executing arbitrary JavaScript strings embedded in untrusted or AI-generated Mermaid source, presenting severe XSS vulnerabilities.
