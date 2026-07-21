ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_key VARCHAR(120) NOT NULL DEFAULT 'default';
ALTER TABLE users ALTER COLUMN password TYPE VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_key VARCHAR(120) NOT NULL DEFAULT 'default';
ALTER TABLE claims ADD COLUMN IF NOT EXISTS tenant_key VARCHAR(120) NOT NULL DEFAULT 'default';
ALTER TABLE sources ADD COLUMN IF NOT EXISTS tenant_key VARCHAR(120) NOT NULL DEFAULT 'default';
ALTER TABLE document_spans ADD COLUMN IF NOT EXISTS tenant_key VARCHAR(120) NOT NULL DEFAULT 'default';

CREATE TABLE IF NOT EXISTS claim_verification_runs (
  id BIGSERIAL PRIMARY KEY,
  tenant_key VARCHAR(120) NOT NULL,
  client_claim_id VARCHAR(160) NOT NULL,
  requester_id INTEGER NOT NULL REFERENCES users(id),
  claim_text TEXT NOT NULL,
  consequential BOOLEAN NOT NULL DEFAULT FALSE,
  ruleset_version VARCHAR(120) NOT NULL,
  verdict VARCHAR(30) NOT NULL CHECK(verdict IN ('supported','contradicted','abstained')),
  confidence NUMERIC NOT NULL,
  review_required BOOLEAN NOT NULL,
  result JSONB NOT NULL,
  review_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK(review_status IN ('pending','accepted','rejected')),
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_key, client_claim_id)
);

CREATE TABLE IF NOT EXISTS claim_evidence_snapshots (
  id BIGSERIAL PRIMARY KEY,
  run_id BIGINT NOT NULL REFERENCES claim_verification_runs(id) ON DELETE RESTRICT,
  source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  span_id INTEGER NOT NULL REFERENCES document_spans(id) ON DELETE RESTRICT,
  source_sha256 VARCHAR(64) NOT NULL,
  span_sha256 VARCHAR(64) NOT NULL,
  source_uri TEXT,
  source_published_at TIMESTAMPTZ,
  source_retrieved_at TIMESTAMPTZ,
  text_snapshot TEXT NOT NULL,
  excluded_reason VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claim_verification_audit (
  id BIGSERIAL PRIMARY KEY,
  tenant_key VARCHAR(120) NOT NULL,
  run_id BIGINT REFERENCES claim_verification_runs(id),
  actor_id INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_verification_tenant_status ON claim_verification_runs(tenant_key,review_status,created_at DESC);
