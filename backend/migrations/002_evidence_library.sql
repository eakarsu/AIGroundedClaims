-- 002 — Evidence library + audit log + optional pgvector
-- Unlocks: sources, document_spans, evidence_links, audit_log per audit note.
-- pgvector wrapped in DO block so the migration succeeds when the extension is unavailable.

DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
  -- extension not installed in this Postgres instance; skip silently
  NULL;
END $$;

CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  corpus_id INTEGER,
  url VARCHAR(1000),
  title VARCHAR(500),
  publisher VARCHAR(255),
  author VARCHAR(255),
  published_at TIMESTAMPTZ,
  retrieved_at TIMESTAMPTZ,
  sha256 VARCHAR(64),
  license VARCHAR(120),
  credibility_score NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sources_corpus ON sources (corpus_id);
CREATE INDEX IF NOT EXISTS idx_sources_sha256 ON sources (sha256);

CREATE TABLE IF NOT EXISTS document_spans (
  id SERIAL PRIMARY KEY,
  document_id INTEGER,
  document_title VARCHAR(255),
  span_index INTEGER,
  page_number INTEGER,
  text TEXT,
  char_start INTEGER,
  char_end INTEGER,
  sha256 VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_document_spans_doc ON document_spans (document_id);
CREATE INDEX IF NOT EXISTS idx_document_spans_title ON document_spans (document_title);

CREATE TABLE IF NOT EXISTS evidence_links (
  id SERIAL PRIMARY KEY,
  claim_id INTEGER,
  source_id INTEGER,
  span_id INTEGER,
  verdict VARCHAR(40),
  score NUMERIC(6,3),
  rationale TEXT,
  created_by VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evidence_links_claim ON evidence_links (claim_id);
CREATE INDEX IF NOT EXISTS idx_evidence_links_source ON evidence_links (source_id);
CREATE INDEX IF NOT EXISTS idx_evidence_links_span ON evidence_links (span_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  entity VARCHAR(80) NOT NULL,
  entity_id VARCHAR(80),
  actor VARCHAR(150),
  action VARCHAR(60),
  before JSONB,
  after JSONB,
  at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log (entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_at ON audit_log (at DESC);
