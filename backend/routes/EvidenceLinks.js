// Evidence library: links claims ↔ sources ↔ document spans.
// Lacks updated_at — same shape as document_spans.
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireWriter } = require('../middleware/auth');

const FIELDS = ['claim_id','source_id','span_id','verdict','score','rationale','created_by'];

router.get('/', async (req, res) => {
  try {
    const { claim_id, source_id } = req.query || {};
    let r;
    if (claim_id) {
      r = await pool.query('SELECT * FROM evidence_links WHERE claim_id=$1 ORDER BY id DESC', [claim_id]);
    } else if (source_id) {
      r = await pool.query('SELECT * FROM evidence_links WHERE source_id=$1 ORDER BY id DESC', [source_id]);
    } else {
      r = await pool.query('SELECT * FROM evidence_links ORDER BY id DESC LIMIT 500');
    }
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM evidence_links WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireWriter, async (req, res) => {
  try {
    const vals = FIELDS.map((f) => {
      if (f === 'created_by') return req.body.created_by || (req.user && req.user.email) || null;
      return req.body[f] ?? null;
    });
    const ph = FIELDS.map((_, i) => `$${i + 1}`).join(',');
    const r = await pool.query(
      `INSERT INTO evidence_links (${FIELDS.join(',')}) VALUES (${ph}) RETURNING *`, vals
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireWriter, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM evidence_links WHERE id = $1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ message: 'deleted', row: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
