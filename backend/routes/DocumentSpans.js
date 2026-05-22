// Note: document_spans has no updated_at column; CRUD factory's PUT updates updated_at,
// so we expose list/get/create/delete only via a custom router.
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireWriter } = require('../middleware/auth');

const FIELDS = ['document_id','document_title','span_index','page_number','text','char_start','char_end','sha256'];

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM document_spans ORDER BY id DESC LIMIT 500');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM document_spans WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireWriter, async (req, res) => {
  try {
    const vals = FIELDS.map((f) => req.body[f] ?? null);
    const ph = FIELDS.map((_, i) => `$${i + 1}`).join(',');
    const r = await pool.query(
      `INSERT INTO document_spans (${FIELDS.join(',')}) VALUES (${ph}) RETURNING *`, vals
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireWriter, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM document_spans WHERE id = $1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ message: 'deleted', row: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
