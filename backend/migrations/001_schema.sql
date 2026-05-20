-- Grounded Claims Verifier schema
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(120) NOT NULL,
  name VARCHAR(120),
  role VARCHAR(30) DEFAULT 'commander',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_results (
  id SERIAL PRIMARY KEY,
  feature VARCHAR(80) NOT NULL,
  input JSONB,
  output JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_results_feature_created ON ai_results (feature, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  title VARCHAR(200),
  body TEXT,
  severity VARCHAR(20) DEFAULT 'info',
  source VARCHAR(80),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, read_at);

CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  resource_type VARCHAR(60),
  resource_id INTEGER,
  filename VARCHAR(255),
  original_name VARCHAR(255),
  mimetype VARCHAR(120),
  size_bytes INTEGER,
  uploaded_by VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120),
  url VARCHAR(500),
  secret VARCHAR(120),
  events TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER,
  event VARCHAR(120),
  payload JSONB,
  status_code INTEGER,
  response_body TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  source VARCHAR(255),
  sha256 VARCHAR(255),
  status VARCHAR(255),
  page_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claims (
  id SERIAL PRIMARY KEY,
  document_title VARCHAR(255),
  claim_text TEXT,
  subject VARCHAR(255),
  predicate VARCHAR(255),
  status VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS source_corpora (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  doc_count INTEGER DEFAULT 0,
  status VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grounding_reports (
  id SERIAL PRIMARY KEY,
  document_title VARCHAR(255),
  grounding_score INTEGER DEFAULT 0,
  merkle_root VARCHAR(255),
  status VARCHAR(255),
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signatures (
  id SERIAL PRIMARY KEY,
  report_id_ref VARCHAR(255),
  signer VARCHAR(255),
  signed_at TIMESTAMPTZ,
  key_fingerprint VARCHAR(255),
  status VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS redaction_logs (
  id SERIAL PRIMARY KEY,
  document_title VARCHAR(255),
  redacted_span TEXT,
  reason VARCHAR(255),
  status VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
