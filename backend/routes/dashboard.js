const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [documents_q, claims_q, source_corpora_q, grounding_reports_q, signatures_q, redaction_logs_q] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total FROM documents"),
      pool.query("SELECT COUNT(*) AS total FROM claims"),
      pool.query("SELECT COUNT(*) AS total FROM source_corpora"),
      pool.query("SELECT COUNT(*) AS total FROM grounding_reports"),
      pool.query("SELECT COUNT(*) AS total FROM signatures"),
      pool.query("SELECT COUNT(*) AS total FROM redaction_logs")
    ]);
    res.json({
      documents: documents_q.rows[0],
      claims: claims_q.rows[0],
      source_corpora: source_corpora_q.rows[0],
      grounding_reports: grounding_reports_q.rows[0],
      signatures: signatures_q.rows[0],
      redaction_logs: redaction_logs_q.rows[0]
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
