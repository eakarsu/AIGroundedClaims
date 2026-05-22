// Pass 7 additions: batch ingest, ClaimReview JSON-LD export, provenance graph,
// audit log, reviewer workflow, fact-check publisher, Merkle anchor (advisory),
// claim-diff. NEEDS-CREDS / TOO-RISKY items return 503 with explicit reasoning.
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../config/database');
const { requireWriter } = require('../middleware/auth');

function sha(s) { return crypto.createHash('sha256').update(String(s)).digest('hex'); }

async function logAudit(entity, entityId, actor, action, before, after) {
  try {
    await pool.query(
      'INSERT INTO audit_log (entity, entity_id, actor, action, before, after) VALUES ($1,$2,$3,$4,$5,$6)',
      [entity, entityId == null ? null : String(entityId), actor || null, action, before || null, after || null]
    );
  } catch (e) { console.warn('[audit] failed:', e.message); }
}

// ─── Batch ingest: NDJSON of documents ─────────────────────────────
// Body: text/* containing one JSON object per line with document fields.
// Also accepts { ndjson: "..." } JSON body for convenience.
router.post('/documents/bulk', requireWriter, express.text({ type: '*/*', limit: '20mb' }), async (req, res) => {
  try {
    let text = '';
    if (typeof req.body === 'string') text = req.body;
    else if (req.body && typeof req.body === 'object' && req.body.ndjson) text = String(req.body.ndjson);
    if (!text.trim()) return res.status(400).json({ error: 'ndjson body required (one JSON doc per line)' });

    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    let inserted = 0;
    const errors = [];
    const fields = ['title', 'source', 'sha256', 'status', 'page_count', 'notes'];
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        const vals = fields.map((f) => obj[f] ?? null);
        const ph = fields.map((_, i) => `$${i + 1}`).join(',');
        const r = await pool.query(
          `INSERT INTO documents (${fields.join(',')}) VALUES (${ph}) RETURNING id`, vals
        );
        await logAudit('document', r.rows[0].id, req.user && req.user.email, 'bulk-insert', null, obj);
        inserted++;
      } catch (err) { errors.push({ line: line.slice(0, 120), reason: err.message }); }
    }
    res.json({ table: 'documents', inserted, failed: errors.length, errors: errors.slice(0, 20) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── ClaimReview JSON-LD export ───────────────────────────────────
// Emits Google-indexable schema.org ClaimReview for one or all claims.
router.get('/claims/:id/claim-review.jsonld', async (req, res) => {
  try {
    const cr = await pool.query('SELECT * FROM claims WHERE id=$1', [req.params.id]);
    if (!cr.rows.length) return res.status(404).json({ error: 'not found' });
    const c = cr.rows[0];
    const ev = await pool.query('SELECT * FROM evidence_links WHERE claim_id=$1 ORDER BY id DESC LIMIT 1', [c.id]);
    const top = ev.rows[0];
    let sourceRow = null;
    if (top && top.source_id) {
      const sr = await pool.query('SELECT * FROM sources WHERE id=$1', [top.source_id]);
      sourceRow = sr.rows[0] || null;
    }
    const verdict = (top && top.verdict) || c.status || 'unrated';
    const ratingMap = { supported: 5, partial: 3, unsupported: 1, contradicted: 0 };
    const ratingValue = Object.prototype.hasOwnProperty.call(ratingMap, verdict) ? ratingMap[verdict] : 3;
    const doc = {
      '@context': 'https://schema.org',
      '@type': 'ClaimReview',
      datePublished: (c.updated_at || c.created_at || new Date()).toISOString
        ? new Date(c.updated_at || c.created_at).toISOString()
        : new Date().toISOString(),
      url: `${req.protocol}://${req.get('host')}/api/claims/${c.id}/claim-review.jsonld`,
      claimReviewed: c.claim_text,
      itemReviewed: {
        '@type': 'Claim',
        author: { '@type': 'Person', name: c.subject || 'unknown' },
        appearance: sourceRow ? { '@type': 'CreativeWork', url: sourceRow.url, name: sourceRow.title } : undefined,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue,
        bestRating: 5,
        worstRating: 0,
        alternateName: verdict,
      },
      author: { '@type': 'Organization', name: 'Grounded Claims Verifier' },
    };
    res.setHeader('Content-Type', 'application/ld+json');
    res.json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Provenance graph (claim → evidence_links → sources / spans) ──
router.get('/claims/:id/provenance', async (req, res) => {
  try {
    const cr = await pool.query('SELECT * FROM claims WHERE id=$1', [req.params.id]);
    if (!cr.rows.length) return res.status(404).json({ error: 'not found' });
    const c = cr.rows[0];
    const ev = await pool.query('SELECT * FROM evidence_links WHERE claim_id=$1 ORDER BY id ASC', [c.id]);
    const sourceIds = [...new Set(ev.rows.map((r) => r.source_id).filter(Boolean))];
    const spanIds = [...new Set(ev.rows.map((r) => r.span_id).filter(Boolean))];
    const sourcesRows = sourceIds.length
      ? (await pool.query(`SELECT * FROM sources WHERE id = ANY($1::int[])`, [sourceIds])).rows
      : [];
    const spansRows = spanIds.length
      ? (await pool.query(`SELECT * FROM document_spans WHERE id = ANY($1::int[])`, [spanIds])).rows
      : [];
    const nodes = [
      { id: `claim:${c.id}`, kind: 'claim', label: c.claim_text, status: c.status },
      ...sourcesRows.map((s) => ({ id: `source:${s.id}`, kind: 'source', label: s.title || s.url, url: s.url })),
      ...spansRows.map((s) => ({ id: `span:${s.id}`, kind: 'span', label: (s.text || '').slice(0, 120), document_title: s.document_title })),
    ];
    const edges = [];
    for (const link of ev.rows) {
      if (link.source_id) edges.push({ from: `claim:${c.id}`, to: `source:${link.source_id}`, verdict: link.verdict, score: link.score });
      if (link.span_id)   edges.push({ from: `claim:${c.id}`, to: `span:${link.span_id}`,   verdict: link.verdict, score: link.score });
    }
    res.json({ claim_id: c.id, nodes, edges });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Audit log query ──────────────────────────────────────────────
router.get('/audit-log', async (req, res) => {
  try {
    const { entity, entity_id, actor } = req.query || {};
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const where = [];
    const vals = [];
    if (entity)    { vals.push(entity);    where.push(`entity = $${vals.length}`); }
    if (entity_id) { vals.push(String(entity_id)); where.push(`entity_id = $${vals.length}`); }
    if (actor)     { vals.push(actor);     where.push(`actor = $${vals.length}`); }
    vals.push(limit);
    const sql = `SELECT * FROM audit_log ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY at DESC LIMIT $${vals.length}`;
    const r = await pool.query(sql, vals);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/audit-log', requireWriter, async (req, res) => {
  try {
    const { entity, entity_id, actor, action, before, after } = req.body || {};
    if (!entity || !action) return res.status(400).json({ error: 'entity and action are required' });
    const r = await pool.query(
      'INSERT INTO audit_log (entity, entity_id, actor, action, before, after) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [entity, entity_id == null ? null : String(entity_id), actor || (req.user && req.user.email) || null, action, before || null, after || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Reviewer workflow (assignment / status transition) ───────────
// Default model: claim.status ∈ {draft, assigned, in-review, approved, rejected}.
// Assignment stored in audit_log (no schema change beyond pass 7).
router.post('/claims/:id/assign', requireWriter, async (req, res) => {
  try {
    const { reviewer } = req.body || {};
    if (!reviewer) return res.status(400).json({ error: 'reviewer is required' });
    const cr = await pool.query('SELECT * FROM claims WHERE id=$1', [req.params.id]);
    if (!cr.rows.length) return res.status(404).json({ error: 'not found' });
    const before = cr.rows[0];
    const upd = await pool.query(
      'UPDATE claims SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      ['assigned', req.params.id]
    );
    await logAudit('claim', req.params.id, req.user && req.user.email, 'assign', before, { reviewer, after: upd.rows[0] });
    res.json({ claim: upd.rows[0], reviewer });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/claims/:id/transition', requireWriter, async (req, res) => {
  try {
    const { to_status } = req.body || {};
    const allowed = ['draft', 'assigned', 'in-review', 'approved', 'rejected'];
    if (!allowed.includes(to_status)) return res.status(400).json({ error: `to_status must be one of ${allowed.join(', ')}` });
    const cr = await pool.query('SELECT * FROM claims WHERE id=$1', [req.params.id]);
    if (!cr.rows.length) return res.status(404).json({ error: 'not found' });
    const before = cr.rows[0];
    const upd = await pool.query(
      'UPDATE claims SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [to_status, req.params.id]
    );
    await logAudit('claim', req.params.id, req.user && req.user.email, 'transition', before, upd.rows[0]);
    res.json(upd.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Fact-check publisher (permalink) ─────────────────────────────
router.get('/fact-checks/:claim_id', async (req, res) => {
  try {
    const cr = await pool.query('SELECT * FROM claims WHERE id=$1', [req.params.claim_id]);
    if (!cr.rows.length) return res.status(404).json({ error: 'not found' });
    const c = cr.rows[0];
    const ev = await pool.query(
      `SELECT el.*, s.url AS source_url, s.title AS source_title, ds.text AS span_text
       FROM evidence_links el
       LEFT JOIN sources s        ON s.id = el.source_id
       LEFT JOIN document_spans ds ON ds.id = el.span_id
       WHERE el.claim_id=$1 ORDER BY el.id DESC`,
      [c.id]
    );
    const permalink = `${req.protocol}://${req.get('host')}/api/fact-checks/${c.id}`;
    res.json({
      claim_id: c.id,
      claim: c.claim_text,
      rating: c.status || 'unrated',
      permalink,
      methodology: 'AI-assisted grounding via OpenRouter LLM with span-level evidence linking.',
      evidence: ev.rows.map((r) => ({
        verdict: r.verdict, score: r.score, rationale: r.rationale,
        source_url: r.source_url, source_title: r.source_title, span_text: r.span_text,
      })),
      published_at: (c.updated_at || c.created_at || new Date()).toISOString
        ? new Date(c.updated_at || c.created_at).toISOString()
        : new Date().toISOString(),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Merkle public-ledger anchoring — ADVISORY ONLY (TOO-RISKY) ──
router.get('/grounding-reports/:id/anchor-advice', async (req, res) => {
  try {
    const rep = await pool.query('SELECT * FROM grounding_reports WHERE id=$1', [req.params.id]);
    if (!rep.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({
      report_id: Number(req.params.id),
      merkle_root: rep.rows[0].merkle_root || null,
      anchoring_status: 'not-anchored',
      advisory: 'TOO-RISKY: external public-ledger anchoring (OpenTimestamps / Sigstore) is intentionally disabled. Requires key custody review + irreversibility sign-off. See _AUDIT_NOTE.md §6.',
      next_steps: [
        'Designate a key-custody owner.',
        'Choose a ledger (OpenTimestamps / Sigstore / private timestamp authority).',
        'Define revocation/rotation policy.',
        'Add a one-way, audited submit endpoint behind a feature flag.',
      ],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Claim diff over time (uses audit_log history) ────────────────
router.get('/claims/:id/diff', async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT * FROM audit_log WHERE entity='claim' AND entity_id=$1 ORDER BY at ASC LIMIT 500",
      [String(req.params.id)]
    );
    const versions = r.rows.map((row) => ({
      at: row.at, actor: row.actor, action: row.action, before: row.before, after: row.after,
    }));
    res.json({ claim_id: Number(req.params.id), versions });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Pass-7 dashboard counts (additions) ─────────────────────────
router.get('/dashboard-extras', async (req, res) => {
  try {
    const [sources_q, spans_q, links_q, audit_q] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM sources'),
      pool.query('SELECT COUNT(*) AS total FROM document_spans'),
      pool.query('SELECT COUNT(*) AS total FROM evidence_links'),
      pool.query('SELECT COUNT(*) AS total FROM audit_log'),
    ]);
    res.json({
      sources: sources_q.rows[0],
      document_spans: spans_q.rows[0],
      evidence_links: links_q.rows[0],
      audit_log: audit_q.rows[0],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
