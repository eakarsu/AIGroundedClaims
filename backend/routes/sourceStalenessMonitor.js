const express = require('express');

const router = express.Router();

function monitor(input = {}) {
  const sources = input.sources || [
    { title: 'Clinical guidance PDF', last_checked_days: 138, source_type: 'guideline', claim_count: 14 },
    { title: 'Market data table', last_checked_days: 12, source_type: 'data_feed', claim_count: 8 },
    { title: 'Archived press release', last_checked_days: 420, source_type: 'press_release', claim_count: 3 },
  ];
  return {
    sources: sources.map((s) => {
      const threshold = s.source_type === 'data_feed' ? 14 : s.source_type === 'guideline' ? 90 : 365;
      const overdue = Number(s.last_checked_days) - threshold;
      return {
        ...s,
        staleness_score: Math.max(0, Math.min(100, Math.round((overdue > 0 ? overdue : 0) * 0.7 + Number(s.claim_count) * 2))),
        status: overdue > 60 ? 'reverify_now' : overdue > 0 ? 'refresh_due' : 'current',
        action: overdue > 0 ? 'queue evidence recheck and claim impact review' : 'keep scheduled monitoring',
      };
    }),
  };
}

router.get('/', (req, res) => res.json(monitor()));
router.post('/monitor', (req, res) => res.json(monitor(req.body || {})));

module.exports = router;
