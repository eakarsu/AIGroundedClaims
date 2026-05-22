# Audit Note — AIGroundedClaims

Domain: grounded-claims platform — fact-checking, citation/provenance, hallucination detection, retrieval-grounded answer generation.

## Stack
- Backend: Node.js + Express (port 4057), `helmet`, `cors`, JWT bearer (`middleware/auth.js`).
- Database: PostgreSQL (`grounded_claims` DB; schema at `backend/migrations/001_schema.sql`).
- LLM: OpenRouter via `services/ai.js` → `callOpenRouter` + `safeParse` + `runFeature(slug,schema,payload)`. Credentials fall back to canonical `/Users/erolakarsu/projects/beauty-wellness-ai/.env` (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, default `anthropic/claude-haiku-4.5`).
- Frontend: React 18 + react-router (CRA build, port 4056). Generic CRUD via `CrudPage`, generic AI feature via `AIPage` + `AIResultDisplay`.
- Persistence pattern: every AI call recorded to `ai_results(feature, input JSONB, output JSONB, created_at)` with `/api/ai/history` + `/api/ai/samples`.

## Current inventory

### CRUD entities (`/api/...`)
- `documents`, `claims`, `source-corpora`, `grounding-reports`, `signatures`, `redaction-logs` — all via `_crudFactory.js`.

### Cross-cutting routes
- `auth` (login/register), `notifications` (list/unread/mark-read), `attachments` (file uploads), `webhooks` (CRUD + delivery log), `dashboard` (count tiles), `custom-views` (saved views), `groundedExtras` → `GET /api/grounding-reports/:id/merkle-tree` (real SHA-256 Merkle tree built from claims of a document).

### AI endpoints (`/api/ai/...`, all POST + recorded)
1. `extract-claims` — atomic claim extraction (subject/predicate/qualifier, ambiguities).
2. `ground-claims` — per-claim span grounding with entailment scores + verdicts (supported / partial / unsupported / contradicted).
3. `grounding-report` — full-report sentence audit + grounding score + merkle_root + risk areas.
4. `contradiction-detect` — pairwise contradiction with type + resolution.
5. `paraphrase-link` — paraphrase detection + similarity + transformation type.
6. `source-deduplicate` — dedupe source lists with canonical picks.
7. `entailment-score` — premise/hypothesis NLI label (entails/contradicts/neutral) + highlighted span.

### Frontend pages
Dashboard, Documents, Claims, SourceCorpora, GroundingReports, Signatures, RedactionLogs, CustomViews, 7 AI pages mirroring above features, `PdfViewerWorkbench`, `MerkleViewerWorkbench`, `TimelineView`, `CodexCustomVizFeature`, `CodexOperationsFeature`.

## Audit recommendations

### Missing AI counterparts
- **Evidence retriever** — given a claim, retrieve top-k passages from `source_corpora` (today the user must paste `sources_text` into `ground-claims`). [MECHANICAL — LLM-only rerank possible without a vector DB; NEEDS-PRODUCT-DECISION if true retrieval over the corpus.]
- **Citation-coverage scorer** — % of report sentences with at least one supporting cite + per-cite necessity. Distinct from `grounding-report` because it scores *citations as written* (not whether claims are supportable). [MECHANICAL.]
- **Hallucination flagger** — explicit per-sentence "hallucinated / fabricated source / unverifiable" verdict with confidence; complements `ground-claims` (which only labels supported vs. contradicted). [MECHANICAL.]
- **Source-credibility ranker** — score a list of sources on authority / recency / independence / bias; outputs ranked array with rationale. [MECHANICAL.]
- **Citation generator** — given a claim + best evidence span, emit a formatted citation (APA/MLA/Bluebook/Vancouver). [MECHANICAL.]
- **Quote-verifier** — verify a direct quote against original source (exact-match + paraphrase + misattribution). [MECHANICAL — overlap w/ `paraphrase-link` but specialized for quotes.]
- **Numeric / unit consistency checker** — flag mis-converted numbers, currency, units, dates between claim and source. [MECHANICAL.]
- **Claim-novelty / duplicate detector** — cluster new claims vs. already-verified claim store. [MECHANICAL.]
- **Retrieval-grounded answer generator** — RAG endpoint: question + corpus → grounded answer with inline citations and per-sentence provenance. [NEEDS-PRODUCT-DECISION — defines the consumer-facing surface.]

### Missing non-AI features
- **Source CRUD beyond corpora** — there is `source_corpora` (collections) but no `sources` table for individual source records (URL, publisher, author, published_at, retrieved_at, sha256, license). [NEEDS-SCHEMA.]
- **Evidence library** — table linking `claims ↔ sources ↔ spans` (currently no FK relationship; spans live only in AI outputs). [NEEDS-SCHEMA.]
- **Audit trail** — `signatures` + `redaction_logs` exist as flat CRUD, but no immutable append-only audit log of who-changed-what-when on claims / reports. [NEEDS-SCHEMA.]
- **Batch ingest** — no bulk import endpoint for documents or sources (CSV / NDJSON / zip-of-PDFs). Only single-file `attachments`. [MECHANICAL.]
- **Retrieval index** — no embeddings / pgvector / BM25 store; `source_corpora.doc_count` is a flat int. [NEEDS-PRODUCT-DECISION (which retriever) + NEEDS-CREDS (embedding provider) + NEEDS-SCHEMA.]
- **Document chunking / spans** — no `document_spans` table; `claims.document_title` is a free-text join key. [NEEDS-SCHEMA.]
- **Reviewer workflow** — claims have `status` text but no reviewer assignment / SLA / escalation. [NEEDS-PRODUCT-DECISION.]

### Custom feature suggestions
- **Provenance graph visualization** — interactive graph (claim → spans → sources → corpora) with verdict-colored edges. Requires evidence-library FK schema first. [NEEDS-SCHEMA + NEEDS-PRODUCT-DECISION.]
- **Fact-check publisher** — public-facing fact-check article generator (claim, rating, evidence, methodology) with stable permalinks. [NEEDS-PRODUCT-DECISION.]
- **schema.org `ClaimReview` export** — emit Google-indexable JSON-LD `ClaimReview` for each verified claim (well-defined schema; mechanical once `claims` has a verdict + reviewer + url). [MECHANICAL once schema gap closed; depends on claim verdict field.]
- **Merkle-anchored attestation** — extend existing `groundedExtras` Merkle tree by anchoring roots to a public ledger (OpenTimestamps / Sigstore). [TOO-RISKY — external integration, key custody.]
- **Multi-language grounding** — translate-then-ground or cross-lingual entailment. [NEEDS-PRODUCT-DECISION.]
- **Live web retrieval** — fetch sources from URL list with HTML extraction + archival snapshot. [NEEDS-CREDS (proxy/archive provider) + TOO-RISKY (fetching arbitrary URLs).]
- **Claim diff over time** — track a claim as a public figure / document changes; surface retractions. [NEEDS-SCHEMA + NEEDS-PRODUCT-DECISION.]

## Implemented
None — audit-only.

## Backlog (prioritized)
1. **MECHANICAL** — citation-coverage scorer, hallucination flagger, source-credibility ranker, quote-verifier, numeric-consistency checker, citation generator, claim-novelty detector. All follow the existing `runFeature(slug, schema, payload)` + `ai_results` record pattern; only `routes/ai.js` (append-only) needs editing.
2. **MECHANICAL** — batch-ingest endpoint (`POST /api/documents/bulk` accepting NDJSON), `ClaimReview` JSON-LD export endpoint, `evidence-retriever` LLM-rerank-only variant.
3. **NEEDS-SCHEMA** — add `sources`, `document_spans`, `evidence_links (claim_id, source_id, span_id, verdict, score)`, `audit_log (entity, entity_id, actor, action, before, after, at)` tables in a `002_*.sql` migration. Unlocks evidence-library, provenance graph, proper `ClaimReview` export.
4. **NEEDS-PRODUCT-DECISION** — retrieval-grounded answer generator (defines the consumer API surface), reviewer-workflow model, provenance-graph visualization (depends on schema), fact-check publisher.
5. **NEEDS-CREDS** — embedding provider for true retrieval (OpenAI / Voyage / Cohere) + pgvector; live web retrieval (archive/proxy service).
6. **TOO-RISKY** — public-ledger Merkle anchoring (key custody, irreversible), arbitrary-URL live web fetch (SSRF/legal surface).

## Categorization counts
- MECHANICAL: 11 (7 AI + citation generator/coverage/credibility/etc. items in §1, plus batch-ingest, ClaimReview export, LLM-rerank retriever in §2 → 7 + 3 = 10 distinct; plus `evidence-retriever` LLM-only variant = 11)
- NEEDS-CREDS: 2 (embeddings provider, live web retrieval/archive)
- NEEDS-PRODUCT-DECISION: 5 (RAG answer generator, reviewer workflow, provenance graph viz, fact-check publisher, multi-language grounding)
- NEEDS-SCHEMA: 4 (sources, document_spans, evidence_links, audit_log) — single migration unlocks all four
- TOO-RISKY: 2 (public-ledger Merkle anchoring, arbitrary-URL web fetch)

Total distinct backlog items: 24.

## Constraints honored
Audit-only. No code edits. No files modified outside this `_AUDIT_NOTE.md`.

## Apply pass 7 (full backlog implementation)

### Schema migration (NEEDS-SCHEMA — unlocked in one migration)
- `backend/migrations/002_evidence_library.sql`
  - `DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS vector; EXCEPTION WHEN OTHERS THEN NULL; END $$;` — pgvector is best-effort; migration succeeds even without the extension (NEEDS-CREDS).
  - New tables (`IF NOT EXISTS`, no breaking changes): `sources`, `document_spans`, `evidence_links`, `audit_log`.
  - Indexes on common lookup columns (corpus, sha256, claim_id, source_id, span_id, entity/entity_id, at DESC).

### New AI endpoints (MECHANICAL, follow `runFeature(slug, SCHEMAS[slug], body)` + `ai_results` record pattern)
Appended to `backend/routes/ai.js` via a `makeFeatureRoute(slug)` helper:
- `POST /api/ai/citation-coverage`
- `POST /api/ai/hallucination-flag`
- `POST /api/ai/source-credibility`
- `POST /api/ai/citation-generate`
- `POST /api/ai/quote-verify`
- `POST /api/ai/numeric-consistency`
- `POST /api/ai/claim-novelty`
- `POST /api/ai/evidence-retrieve` (LLM-rerank only; vector retrieval gated)
- `POST /api/ai/rag-answer` (reasonable default for NEEDS-PRODUCT-DECISION RAG)

Each has a 3-sample seed in the `/api/ai/samples` registry and is automatically picked up by `/api/ai/history`.

### NEEDS-CREDS 503 stubs (explicit + actionable)
- `POST /api/ai/embedding-index` → 503, points to migration + audit note §5.
- `POST /api/ai/live-web-fetch` → 503, calls out SSRF/legal review (also TOO-RISKY).

### New non-AI endpoints
- CRUD: `/api/sources` (full), `/api/document-spans` (list/get/create/delete — no `updated_at` column), `/api/evidence-links` (list/get/create/delete with `?claim_id=` / `?source_id=` filters).
- Batch ingest: `POST /api/documents/bulk` (NDJSON, one doc per line), audit-logged per row.
- ClaimReview export: `GET /api/claims/:id/claim-review.jsonld` (schema.org JSON-LD; pulls best `evidence_links` row + linked `sources` row).
- Provenance graph: `GET /api/claims/:id/provenance` — nodes (claim/source/span) + verdict/score edges.
- Audit log: `GET /api/audit-log?entity=&entity_id=&actor=&limit=`, `POST /api/audit-log` (manual entries).
- Reviewer workflow (reasonable default — NEEDS-PRODUCT-DECISION): `POST /api/claims/:id/assign { reviewer }`, `POST /api/claims/:id/transition { to_status }` over `{draft|assigned|in-review|approved|rejected}`, both logged.
- Fact-check publisher: `GET /api/fact-checks/:claim_id` (permalink + methodology + evidence joins).
- Claim diff over time: `GET /api/claims/:id/diff` (audit-log derived).
- Merkle public-ledger anchoring (TOO-RISKY → ADVISORY): `GET /api/grounding-reports/:id/anchor-advice` returns next-steps list; no signing performed.
- Dashboard extras: `GET /api/dashboard-extras` (counts for the four new tables).

### Server wiring (BEFORE any 404 handler — existing server has none)
`backend/server.js` mounts new routers after `customViews` and before `app.listen`:
- `/api/sources`, `/api/document-spans`, `/api/evidence-links`, plus `/api` (groundedPass7 collects all the cross-cutting routes above).

### Frontend
- `frontend/src/services/api.js`: 9 new AI helpers, 3 new CRUD APIs (`sourcesApi`, `documentSpansApi`, `evidenceLinksApi`), plus `getAuditLog`, `getClaimReviewJsonLd`, `getClaimProvenance`, `getClaimDiff`, `getFactCheck`, `getAnchorAdvice`, `assignClaim`, `transitionClaim`, `bulkIngestDocuments`, `getDashboardExtras`.
- New pages under `frontend/src/pages/`:
  - AI: `AICitationCoveragePage`, `AIHallucinationFlagPage`, `AISourceCredibilityPage`, `AICitationGeneratePage`, `AIQuoteVerifyPage`, `AINumericConsistencyPage`, `AIClaimNoveltyPage`, `AIEvidenceRetrievePage`, `AIRagAnswerPage`.
  - CRUD: `SourcesPage`, `DocumentSpansPage`, `EvidenceLinksPage`.
  - Tools: `AuditLogPage`, `FactCheckPublisherPage`, `ProvenanceGraphPage`, `BulkIngestPage`.
- `App.js`: imports + routes added; `Sidebar.js`: links added under Data / AI Features / Workbenches.

### Skips / category disposition
- `NEEDS-CREDS` (embeddings, live web fetch): 503 stubs with actionable error bodies. pgvector still installed by migration if available (silently NULL-skipped if not).
- `TOO-RISKY` (public-ledger Merkle anchoring): advisory endpoint only, no key custody, no submission to any ledger.
- `NEEDS-PRODUCT-DECISION` (RAG, reviewer workflow): implemented with documented defaults (linear status machine; LLM-only RAG passage citing).

### Syntax checks
`node --check` passed on every modified non-JSX `.js` file:
`backend/server.js`, `backend/routes/ai.js`, `backend/routes/Sources.js`, `backend/routes/DocumentSpans.js`, `backend/routes/EvidenceLinks.js`, `backend/routes/groundedPass7.js`, `frontend/src/services/api.js`.

### Constraints honored (pass 7)
No new dependencies. No existing endpoint or table altered (`IF NOT EXISTS` migration, append-only routes/exports). All new mounts placed before the catch-all `<Navigate to="/" />` in the React router.
