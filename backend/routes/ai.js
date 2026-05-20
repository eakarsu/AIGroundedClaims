const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const ai = require('../services/ai');

const SCHEMAS = {
  'extract-claims': `{"source_sentence_count":number,"claims":[{"claim_id":string,"atomic_claim":string,"subject":string,"predicate":string,"qualifier":string}],"ambiguities":[string],"summary":string}`,
  'ground-claims': `{"grounded":[{"claim":string,"supporting_span":string,"source_id":string,"entailment_score":number,"verdict":"supported"|"partial"|"unsupported"|"contradicted"}],"overall_grounding_rate":number,"unsupported_claims":[string],"summary":string}`,
  'grounding-report': `{"report_title":string,"grounding_score":number,"sentence_audit":[{"sentence":string,"verdict":"supported"|"partial"|"unsupported","score":number,"source_id":string}],"risk_areas":[string],"merkle_root":string,"summary":string}`,
  'contradiction-detect': `{"contradicts":boolean,"contradiction_type":string,"explanation":string,"recommended_resolution":string,"summary":string}`,
  'paraphrase-link': `{"paraphrase_found":boolean,"matched_span":string,"similarity_score":number,"transformation_type":string,"summary":string}`,
  'source-deduplicate': `{"unique_count":number,"duplicates":[{"a":string,"b":string,"reason":string,"similarity":number}],"canonical_picks":[string],"summary":string}`,
  'entailment-score': `{"label":"entails"|"contradicts"|"neutral","score":number,"highlighted_premise_span":string,"explanation":string,"summary":string}`
};

const SAMPLES = {
  'extract-claims': [
    { label: 'Earnings sentence', values: {"text":"Revenue grew 22% YoY to $1.4B in Q3 2026, driven primarily by enterprise contracts."} },
    { label: 'Lease clause', values: {"text":"Tenant may terminate the lease with 90 days written notice, provided no rent is in arrears."} },
    { label: 'Discharge note', values: {"text":"Patient discharged on metformin 500mg twice daily and lisinopril 10mg daily."} }
  ],
  'ground-claims': [
    { label: 'Revenue claim vs 10-K', values: {"claims_text":"Revenue grew 22% YoY.","sources_text":"Q3 revenue increased 22% over prior year, reaching $1.4B."} },
    { label: 'Lease claim vs contract', values: {"claims_text":"Tenant can terminate with 90 days notice.","sources_text":"Tenant may, upon ninety (90) days written notice, terminate this lease."} },
    { label: 'Med claim vs notes', values: {"claims_text":"Patient discharged on metformin.","sources_text":"Discharge meds: metformin 500mg BID, lisinopril 10mg QD."} }
  ],
  'grounding-report': [
    { label: 'Earnings summary report', values: {"report_text":"Q3 revenue grew 22% YoY to $1.4B. Margins expanded by 200 bps.","sources_text":"Q3 revenue increased 22% over prior year, reaching $1.4B. Gross margin: 64.2% vs 62.1%."} },
    { label: 'Lease summary', values: {"report_text":"Tenant has a 90-day termination right with no penalty.","sources_text":"Tenant may, upon ninety (90) days written notice, terminate this lease. Early termination fee: zero."} },
    { label: 'Med report', values: {"report_text":"Patient was discharged on metformin and ACE inhibitor.","sources_text":"Discharge meds: metformin 500mg BID, lisinopril 10mg QD."} }
  ],
  'contradiction-detect': [
    { label: 'Revenue numbers', values: {"claim_a":"Q3 revenue was $1.4B.","claim_b":"Q3 revenue was $1.2B."} },
    { label: 'Lease termination', values: {"claim_a":"Tenant can terminate with 90 days notice.","claim_b":"Tenant cannot terminate before year 3."} },
    { label: 'Med dose', values: {"claim_a":"Patient on metformin 500mg.","claim_b":"Patient on metformin 1000mg."} }
  ],
  'paraphrase-link': [
    { label: 'Active to passive', values: {"claim_text":"The board approved the budget.","source_corpus":"The 2026 budget was approved by the board last Thursday."} },
    { label: 'Number vs spelled', values: {"claim_text":"90 days notice required.","source_corpus":"Tenant may, upon ninety days written notice, terminate."} },
    { label: 'Synonyms', values: {"claim_text":"Patient discharged on diabetes medication.","source_corpus":"Discharge meds include metformin for diabetes management."} }
  ],
  'source-deduplicate': [
    { label: 'Versioned filings', values: {"source_list_text":"10-K-2025-Q4-v1.pdf\n10-K-2025-Q4-final.pdf\n10-K-2025-Q4-amended.pdf"} },
    { label: 'Same article diff sources', values: {"source_list_text":"reuters.com/article-x\nyahoofinance.com/article-x\noriginal-press-release.com/x"} },
    { label: 'Clinical guideline versions', values: {"source_list_text":"ADA-2024-guideline.pdf\nADA-2025-guideline.pdf\nADA-2025-guideline-rev1.pdf"} }
  ],
  'entailment-score': [
    { label: 'Revenue', values: {"premise":"Q3 revenue increased 22%.","hypothesis":"Revenue grew 22% YoY."} },
    { label: 'Termination', values: {"premise":"Tenant may terminate with 90 days notice.","hypothesis":"Tenant can terminate with 60 days notice."} },
    { label: 'Dosage', values: {"premise":"metformin 500mg BID.","hypothesis":"metformin 1000mg daily."} }
  ]
};

async function record(feature, input, output) {
  try {
    await pool.query('INSERT INTO ai_results (feature, input, output) VALUES ($1, $2, $3)',
      [feature, input || {}, output || {}]);
  } catch (e) { console.warn('[ai] record failed:', e.message); }
}

router.get('/samples', (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    if (!feature) return res.json({ features: Object.keys(SAMPLES) });
    const samples = SAMPLES[feature];
    if (!samples) return res.status(404).json({ error: `unknown feature: ${feature}` });
    res.json({ feature, samples });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/history', async (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 200);
    const r = feature
      ? await pool.query('SELECT id, feature, input, output, created_at FROM ai_results WHERE feature=$1 ORDER BY created_at DESC LIMIT $2', [feature, limit])
      : await pool.query('SELECT id, feature, input, output, created_at FROM ai_results ORDER BY created_at DESC LIMIT $1', [limit]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/extract-claims', async (req, res) => {
  try {
    const result = await ai.runFeature('extract-claims', SCHEMAS['extract-claims'], req.body || {});
    await record('extract-claims', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/ground-claims', async (req, res) => {
  try {
    const result = await ai.runFeature('ground-claims', SCHEMAS['ground-claims'], req.body || {});
    await record('ground-claims', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/grounding-report', async (req, res) => {
  try {
    const result = await ai.runFeature('grounding-report', SCHEMAS['grounding-report'], req.body || {});
    await record('grounding-report', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/contradiction-detect', async (req, res) => {
  try {
    const result = await ai.runFeature('contradiction-detect', SCHEMAS['contradiction-detect'], req.body || {});
    await record('contradiction-detect', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/paraphrase-link', async (req, res) => {
  try {
    const result = await ai.runFeature('paraphrase-link', SCHEMAS['paraphrase-link'], req.body || {});
    await record('paraphrase-link', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/source-deduplicate', async (req, res) => {
  try {
    const result = await ai.runFeature('source-deduplicate', SCHEMAS['source-deduplicate'], req.body || {});
    await record('source-deduplicate', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/entailment-score', async (req, res) => {
  try {
    const result = await ai.runFeature('entailment-score', SCHEMAS['entailment-score'], req.body || {});
    await record('entailment-score', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
