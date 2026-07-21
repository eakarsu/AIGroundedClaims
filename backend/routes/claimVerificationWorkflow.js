const express = require('express');
const pool = require('../config/database');
const { requireCommander } = require('../middleware/auth');
const { validateRequest, verifyClaim } = require('../domain/claimVerificationWorkflow');

const router = express.Router();
const tenantOf = (req) => req.user.tenant_key || 'default';

router.post('/claims', async (req, res) => {
  const errors = validateRequest(req.body);
  if (errors.length) return res.status(400).json({ error: 'validation_failed', details: errors });
  const tenant = tenantOf(req);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const prior = await client.query('SELECT * FROM claim_verification_runs WHERE tenant_key=$1 AND client_claim_id=$2', [tenant, req.body.client_claim_id]);
    if (prior.rows.length) { await client.query('ROLLBACK'); return res.json({ run: prior.rows[0], idempotent_replay: true }); }
    const evidenceItems = [];
    for (const ref of req.body.evidence_refs) {
      const evidence = await client.query(
        `SELECT s.id AS source_id,s.url,s.published_at,s.retrieved_at,s.sha256 AS source_sha256,
                ds.id AS span_id,ds.text,ds.sha256 AS span_sha256
         FROM sources s JOIN document_spans ds ON ds.id=$2 AND ds.tenant_key=$3
         WHERE s.id=$1 AND s.tenant_key=$3`,
        [ref.source_id, ref.span_id, tenant]
      );
      if (!evidence.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'authorized_evidence_not_found', ref }); }
      if (!/^[a-f0-9]{64}$/i.test(evidence.rows[0].source_sha256 || '') || !/^[a-f0-9]{64}$/i.test(evidence.rows[0].span_sha256 || '')) {
        await client.query('ROLLBACK');
        return res.status(422).json({ error: 'versioned_evidence_hash_required', ref });
      }
      evidenceItems.push({ ...evidence.rows[0], authorized: true });
    }
    const result = verifyClaim({ claimText: req.body.claim_text, evidenceItems, consequential: Boolean(req.body.consequential) });
    const run = (await client.query(
      `INSERT INTO claim_verification_runs(tenant_key,client_claim_id,requester_id,claim_text,consequential,ruleset_version,verdict,confidence,review_required,result)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [tenant, req.body.client_claim_id, req.user.id, req.body.claim_text, Boolean(req.body.consequential), result.ruleset_version, result.verdict, result.confidence, result.review_required, result]
    )).rows[0];
    for (const evidence of evidenceItems) {
      const excluded = result.excluded_injected_evidence.some((item) => item.source_id === evidence.source_id && item.span_id === evidence.span_id) ? 'prompt_injection_pattern' : null;
      await client.query(
        `INSERT INTO claim_evidence_snapshots(run_id,source_id,span_id,source_sha256,span_sha256,source_uri,source_published_at,source_retrieved_at,text_snapshot,excluded_reason)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [run.id, evidence.source_id, evidence.span_id, evidence.source_sha256, evidence.span_sha256, evidence.url, evidence.published_at, evidence.retrieved_at, evidence.text, excluded]
      );
    }
    await client.query('INSERT INTO claim_verification_audit(tenant_key,run_id,actor_id,action,details) VALUES($1,$2,$3,$4,$5)', [tenant, run.id, req.user.id, 'verification_created', { verdict: result.verdict, review_required: result.review_required }]);
    await client.query('COMMIT');
    res.status(201).json({ run, result, warning: 'The verdict was not published or used to execute a consequential decision.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('claim verification failed:', error);
    res.status(500).json({ error: 'claim_verification_failed' });
  } finally { client.release(); }
});

router.post('/claims/:id/review', requireCommander, async (req, res) => {
  const decision = req.body?.decision;
  if (!['accept', 'reject'].includes(decision)) return res.status(400).json({ error: 'decision must be accept or reject' });
  const tenant = tenantOf(req);
  const status = decision === 'accept' ? 'accepted' : 'rejected';
  const result = await pool.query(
    `UPDATE claim_verification_runs SET review_status=$1,reviewed_by=$2,reviewed_at=NOW()
     WHERE id=$3 AND tenant_key=$4 AND review_status='pending' AND requester_id<>$2 RETURNING *`,
    [status, req.user.id, req.params.id, tenant]
  );
  if (!result.rows.length) return res.status(409).json({ error: 'run_not_reviewable_or_role_separation_failed' });
  await pool.query('INSERT INTO claim_verification_audit(tenant_key,run_id,actor_id,action,details) VALUES($1,$2,$3,$4,$5)', [tenant, req.params.id, req.user.id, `review_${status}`, { notes: req.body.notes || null }]);
  res.json({ run: result.rows[0], warning: 'Review is recorded locally; no external publication occurred.' });
});

module.exports = router;
