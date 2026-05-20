const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function main() {
  const migDir = path.join(__dirname, '..', 'migrations');
  for (const f of fs.readdirSync(migDir).filter((x) => x.endsWith('.sql')).sort()) {
    const sql = fs.readFileSync(path.join(migDir, f), 'utf8');
    try { await pool.query(sql); console.log(`[seed] applied ${f}`); }
    catch (e) { console.warn(`[seed] ${f} warn: ${e.message}`); }
  }
  await pool.query(
    "INSERT INTO users (email, password, name, role) VALUES ('admin@grounded-claims.local','secure123','Admin','commander') ON CONFLICT (email) DO NOTHING"
  );
  console.log('[seed] demo user ready');

  // documents
  for (const row of [{"title":"Lease Agreement 2026-Q1","source":"pdf-upload","sha256":"7a3b...","status":"indexed","page_count":18,"notes":null},{"title":"Medical Discharge Notes","source":"EHR-export","sha256":"b21c...","status":"indexed","page_count":5,"notes":null},{"title":"10-K Filing","source":"sec-filings","sha256":"4f88...","status":"indexed","page_count":122,"notes":null}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO documents (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // claims
  for (const row of [{"document_title":"10-K Filing","claim_text":"Revenue grew 22% YoY in Q3.","subject":"Revenue","predicate":"grew 22% YoY in Q3","status":"supported"},{"document_title":"Lease Agreement 2026-Q1","claim_text":"Tenant may terminate with 90 days notice.","subject":"Tenant","predicate":"may terminate with 90 days notice","status":"supported"},{"document_title":"Medical Discharge Notes","claim_text":"Patient discharged on metformin 500mg.","subject":"Patient","predicate":"discharged on metformin 500mg","status":"partial"}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO claims (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // source_corpora
  for (const row of [{"name":"Legal contracts 2026","doc_count":184,"status":"active"},{"name":"SEC filings 2024-2026","doc_count":912,"status":"active"},{"name":"Clinical guidelines","doc_count":64,"status":"active"}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO source_corpora (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // grounding_reports
  for (const row of [{"document_title":"10-K Filing","grounding_score":94,"merkle_root":"0x7a3b...","status":"signed","generated_at":null},{"document_title":"Lease Agreement 2026-Q1","grounding_score":88,"merkle_root":"0xb21c...","status":"signed","generated_at":null},{"document_title":"Medical Discharge Notes","grounding_score":71,"merkle_root":"0x4f88...","status":"generated","generated_at":null}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO grounding_reports (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // signatures
  for (const row of [{"report_id_ref":"rep-001","signer":"audit@firm.com","signed_at":null,"key_fingerprint":"a1:b2:c3:d4","status":"valid"},{"report_id_ref":"rep-002","signer":"compliance@firm.com","signed_at":null,"key_fingerprint":"e5:f6:11:22","status":"valid"}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO signatures (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // redaction_logs
  for (const row of [{"document_title":"Lease Agreement 2026-Q1","redacted_span":"SSN 123-45-6789","reason":"PII","status":"applied"},{"document_title":"Medical Discharge Notes","redacted_span":"DOB 1984-03-14","reason":"PHI","status":"applied"},{"document_title":"10-K Filing","redacted_span":"Executive salary table","reason":"sensitive","status":"pending"}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO redaction_logs (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  console.log('[seed] domain rows seeded');
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
