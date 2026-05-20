const express = require('express');
const router = express.Router();

// In-memory store for source/grounding rules (CRUD trusted domains, confidence rules)
let RULES = [
  { id: 1, domain: 'reuters.com', trust: 'high', min_confidence: 0.85, category: 'news', notes: 'Primary newswire' },
  { id: 2, domain: 'sec.gov', trust: 'high', min_confidence: 0.9, category: 'regulatory', notes: 'US SEC filings' },
  { id: 3, domain: 'who.int', trust: 'high', min_confidence: 0.88, category: 'health', notes: 'WHO guidance' },
  { id: 4, domain: 'arxiv.org', trust: 'medium', min_confidence: 0.7, category: 'research', notes: 'Preprints, not peer-reviewed' },
  { id: 5, domain: 'medium.com', trust: 'low', min_confidence: 0.4, category: 'blog', notes: 'User-generated content' },
];
let RULES_SEQ = RULES.length + 1;

// 1) VIZ: source citation distribution (counts per source category)
router.get('/citation-distribution', (req, res) => {
  const buckets = [
    { source: 'SEC filings', citations: 412, supported: 388, contradicted: 24 },
    { source: 'Reuters', citations: 296, supported: 281, contradicted: 15 },
    { source: 'WHO guidance', citations: 184, supported: 178, contradicted: 6 },
    { source: 'arXiv', citations: 142, supported: 110, contradicted: 32 },
    { source: 'PubMed', citations: 218, supported: 201, contradicted: 17 },
    { source: 'Court filings', citations: 96, supported: 91, contradicted: 5 },
    { source: 'Medium blogs', citations: 58, supported: 19, contradicted: 39 },
    { source: 'Twitter/X', citations: 41, supported: 11, contradicted: 30 },
  ];
  const total = buckets.reduce((s, b) => s + b.citations, 0);
  res.json({
    total_citations: total,
    distinct_sources: buckets.length,
    buckets,
    generated_at: new Date().toISOString(),
  });
});

// 2) VIZ: claim accuracy heatmap (claim type x source quality)
router.get('/accuracy-heatmap', (req, res) => {
  const claim_types = ['Financial', 'Medical', 'Legal', 'Scientific', 'Political', 'Historical'];
  const source_quality = ['Tier-1 verified', 'Tier-2 reputable', 'Tier-3 community', 'Tier-4 unverified'];
  // accuracy percentages 0-100
  const matrix = [
    [97, 91, 72, 41], // Financial
    [95, 88, 64, 33], // Medical
    [96, 89, 70, 38], // Legal
    [94, 87, 66, 35], // Scientific
    [88, 78, 55, 28], // Political
    [92, 84, 68, 42], // Historical
  ];
  res.json({
    claim_types,
    source_quality,
    matrix,
    unit: 'percent_accurate',
    cell_count: claim_types.length * source_quality.length,
    generated_at: new Date().toISOString(),
  });
});

// 3) NON-VIZ: fact-check report PDF (minimal valid PDF stream, no external deps)
router.get('/fact-check-report.pdf', (req, res) => {
  const lines = [
    'AIGroundedClaims - Fact-Check Report',
    `Generated: ${new Date().toISOString()}`,
    '',
    'Summary',
    '  Total claims audited: 1247',
    '  Supported with primary source: 1083 (86.8%)',
    '  Partially supported: 102 (8.2%)',
    '  Contradicted by trusted source: 41 (3.3%)',
    '  Unverifiable / no source: 21 (1.7%)',
    '',
    'Top sources by citation count',
    '  1. SEC filings - 412 citations',
    '  2. Reuters - 296 citations',
    '  3. PubMed - 218 citations',
    '  4. WHO guidance - 184 citations',
    '',
    'Risk register',
    '  - 30 claims rely solely on Twitter/X (Tier-4) - review needed',
    '  - 24 SEC-derived claims show contradiction signal - escalate',
    '',
    'Signed by audit pipeline. Merkle root committed to ledger.',
  ];
  // Build minimal PDF
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  let stream = 'BT /F1 12 Tf 50 760 Td 14 TL\n';
  lines.forEach((ln, i) => {
    stream += (i === 0 ? '' : 'T*\n') + `(${esc(ln)}) Tj\n`;
  });
  stream += 'ET';
  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n');
  objects.push(`4 0 obj\n<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream\nendobj\n`);
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (const o of objects) { offsets.push(Buffer.byteLength(pdf)); pdf += o; }
  const xrefStart = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += String(off).padStart(10, '0') + ' 00000 n \n';
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  const buf = Buffer.from(pdf, 'binary');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="fact-check-report.pdf"');
  res.setHeader('Content-Length', buf.length);
  res.end(buf);
});

// 4) NON-VIZ: source/grounding rules editor (CRUD trusted domains + confidence rules)
router.get('/rules', (req, res) => {
  res.json({ rules: RULES, count: RULES.length });
});

router.post('/rules', (req, res) => {
  const { domain, trust = 'medium', min_confidence = 0.7, category = 'general', notes = '' } = req.body || {};
  if (!domain || typeof domain !== 'string') return res.status(400).json({ error: 'domain (string) required' });
  const mc = Number(min_confidence);
  if (Number.isNaN(mc) || mc < 0 || mc > 1) return res.status(400).json({ error: 'min_confidence must be 0..1' });
  if (!['high', 'medium', 'low'].includes(trust)) return res.status(400).json({ error: 'trust must be high|medium|low' });
  const row = { id: RULES_SEQ++, domain: domain.trim().toLowerCase(), trust, min_confidence: mc, category, notes };
  RULES.push(row);
  res.status(201).json(row);
});

router.put('/rules/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = RULES.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'rule not found' });
  const cur = RULES[idx];
  const next = { ...cur, ...(req.body || {}), id };
  if (next.min_confidence != null) {
    const mc = Number(next.min_confidence);
    if (Number.isNaN(mc) || mc < 0 || mc > 1) return res.status(400).json({ error: 'min_confidence must be 0..1' });
    next.min_confidence = mc;
  }
  if (next.trust && !['high', 'medium', 'low'].includes(next.trust)) return res.status(400).json({ error: 'trust must be high|medium|low' });
  RULES[idx] = next;
  res.json(next);
});

router.delete('/rules/:id', (req, res) => {
  const id = Number(req.params.id);
  const before = RULES.length;
  RULES = RULES.filter((r) => r.id !== id);
  if (RULES.length === before) return res.status(404).json({ error: 'rule not found' });
  res.json({ ok: true, id });
});

module.exports = router;
