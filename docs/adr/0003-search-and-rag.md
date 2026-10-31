# ADR 0003: Search Engine Architecture and Grounded RAG Pipeline

## Status
Accepted

## Context
Spec Section 9 mandates:
1. **Hybrid Retrieval**: Combining keyword search (BM25) with semantic embeddings.
2. **Strict Grounding**: Q&A answers generated strictly from retrieved CODE ATLAS content and linked official docs; citations labeled with source type (`spec 3.3`); low retrieval confidence triggers a refusal with closest lessons rather than hallucinated text.
3. **Filtering & Typo Tolerance**: Filters for language, version, difficulty level, content type, synonym mapping (`pointer` / `reference` / `address`), and cross-language queries.
4. **Offline Capability & Zero Leakage**: Search must work offline where possible without sending learner code or queries to third parties needlessly.

## Options Considered

### Option 1: Two-Tier Search (Client-Side In-Memory BM25/Vector for Phase 1, Postgres with pgvector for Phase 2 RAG)
- Phase 1: Pre-index content at build time into an in-memory inverted index (e.g., Orama / MiniSearch) bundled with normalized keyword tokens and pre-computed lightweight embeddings. Runs 100% in-browser, offline-capable, and sub-10ms latency.
- Phase 2: Deploy a backend PostgreSQL database with `pgvector` extension for full RAG vector indexing, chunk storage, and semantic cosine similarity search.
- Uses open standard embeddings (e.g., `text-embedding-3-small` or local ONNX runtime embeddings).

### Option 2: Dedicated Distributed Search Cluster (Elasticsearch / OpenSearch)
- Industrial-grade hybrid search, BM25 scoring, and vector plugins.
- Heavy operational burden: JVM memory overhead (minimum 2–4 GB RAM per node), cluster maintenance, costly for single-module educational deployment.

### Option 3: Fully Managed External Vector DB (Pinecone, Weaviate Cloud, Milvus)
- Fast vector similarity search with hosted infrastructure.
- Vendor lock-in, recurring monthly SaaS costs, network latency on every keystroke, breaks offline capabilities, and separates metadata storage from core lesson documents.

## Decision
Adopt **Option 1**: A **Two-Tier Architecture**:
1. **Phase 1 (Search v1)**:
   - Use an **in-memory hybrid search engine** (`packages/search` using MiniSearch / Orama with pre-calculated embeddings and BM25 token weighting).
   - Generated directly by CI from validated content files during build.
   - Includes synonym expansion (`pointer` ↔ `reference` ↔ `address`), version filtering, and typo tolerance (Levenshtein distance 1–2).
2. **Phase 2 (Grounded RAG & Q&A)**:
   - Introduce **Postgres with `pgvector`** for server-side RAG chunk indexing and retrieval evaluation against the golden question set.
   - Implement strict confidence thresholding: if cosine similarity < 0.72, refuse generation and return ranked links to the closest matching lessons.

## Trade-offs
- **Pros**: Zero infrastructure overhead for Phase 1; 100% offline-ready in the browser; instant search results without network hops; unified relational + vector queries in Phase 2 via Postgres.
- **Cons**: Client bundle carries the serialized search index (~200–500 KB compressed for the beginner slice); requires index rebuilding step during CI.

## Rejected Options & Reasons for Rejection
1. **Elasticsearch / OpenSearch**: Rejected due to high RAM and cluster maintenance overhead. Overkill for curated, versioned documentation packages.
2. **Cloud Vector SaaS (Pinecone / Weaviate Cloud)**: Rejected due to vendor lock-in, data privacy/retention concerns (AGENTS.md Rule 12), and inability to run offline on low-bandwidth student devices (Spec Section 1).
3. **Pure Keyword Search without Semantics**: Rejected because Spec Section 9.1 explicitly requires hybrid search with embeddings to handle concept inquiries like "how do I save multiple items" mapping to lists/tuples.
