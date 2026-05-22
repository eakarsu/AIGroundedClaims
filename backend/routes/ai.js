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
  'entailment-score': `{"label":"entails"|"contradicts"|"neutral","score":number,"highlighted_premise_span":string,"explanation":string,"summary":string}`,
  'citation-coverage': `{"sentence_count":number,"cited_sentence_count":number,"coverage_rate":number,"per_sentence":[{"sentence":string,"has_citation":boolean,"citations":[string],"necessity":"required"|"optional"|"redundant","reason":string}],"summary":string}`,
  'hallucination-flag': `{"flagged_count":number,"per_sentence":[{"sentence":string,"verdict":"grounded"|"hallucinated"|"fabricated-source"|"unverifiable","confidence":number,"explanation":string}],"summary":string}`,
  'source-credibility': `{"ranked":[{"source":string,"score":number,"authority":number,"recency":number,"independence":number,"bias":number,"rationale":string}],"summary":string}`,
  'citation-generate': `{"style":string,"citation":string,"in_text":string,"fields":{"author":string,"title":string,"publisher":string,"year":string,"url":string,"locator":string},"summary":string}`,
  'quote-verify': `{"verdict":"exact"|"paraphrase"|"misattributed"|"not-found","match_span":string,"similarity":number,"differences":[string],"explanation":string,"summary":string}`,
  'numeric-consistency': `{"issues":[{"field":string,"claim_value":string,"source_value":string,"kind":"number"|"unit"|"currency"|"date","mismatch":boolean,"explanation":string}],"all_consistent":boolean,"summary":string}`,
  'claim-novelty': `{"clusters":[{"cluster_id":string,"representative":string,"members":[string]}],"novel_claims":[string],"duplicate_pairs":[{"a":string,"b":string,"similarity":number}],"summary":string}`,
  'evidence-retrieve': `{"query":string,"results":[{"source_id":string,"passage":string,"score":number,"rationale":string}],"summary":string}`,
  'rag-answer': `{"question":string,"answer":string,"sentences":[{"text":string,"citations":[string]}],"citations":[{"id":string,"source":string,"span":string}],"unsupported":[string],"summary":string}`
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
  ],
  'citation-coverage': [
    { label: 'Earnings report', values: {"report_text":"Q3 revenue grew 22% YoY [1]. Margins expanded by 200 bps. Headcount fell 5% [2].","citations_text":"[1] 10-K p.14\n[2] HR memo 2026-04"} },
    { label: 'Lease summary', values: {"report_text":"Tenant has 90-day termination right [A]. No early termination fee.","citations_text":"[A] Lease §12.3"} },
    { label: 'Medical brief', values: {"report_text":"Patient discharged on metformin [1]. Lisinopril added at discharge.","citations_text":"[1] Discharge note p.2"} }
  ],
  'hallucination-flag': [
    { label: 'Mixed report', values: {"report_text":"Q3 revenue was $1.4B. Q3 margin was 80%. Acme acquired Beta in 2026.","sources_text":"Q3 revenue $1.4B. Q3 margin 64%."} },
    { label: 'Lease with fab fee', values: {"report_text":"Tenant pays $10,000 early termination fee.","sources_text":"Tenant may terminate with 90 days notice. No fee mentioned."} },
    { label: 'Med fabrications', values: {"report_text":"Patient discharged on metformin and warfarin per Dr. Smith 2099 study.","sources_text":"Discharge meds: metformin only."} }
  ],
  'source-credibility': [
    { label: 'Mixed list', values: {"source_list_text":"nytimes.com\nrandomblog.example\ngovernment.gov/report\nreddit.com/r/news"} },
    { label: 'Medical sources', values: {"source_list_text":"nejm.org\nwebmd.com\nbmj.com\nfacebook.com/post"} },
    { label: 'Financial sources', values: {"source_list_text":"sec.gov/edgar\nbloomberg.com\nseekingalpha.com\nrandomstockblog.example"} }
  ],
  'citation-generate': [
    { label: 'APA web', values: {"style":"APA","claim":"Q3 revenue grew 22%.","evidence_span":"Q3 revenue increased 22% YoY to $1.4B.","source_metadata":"Author: Acme Inc. Title: Q3 2026 Earnings Release. Publisher: Acme. Year: 2026. URL: https://acme.example/q3"} },
    { label: 'MLA book', values: {"style":"MLA","claim":"Tenant has 90-day termination right.","evidence_span":"Tenant may, upon ninety (90) days written notice, terminate.","source_metadata":"Title: Commercial Lease Agreement. Year: 2024. Section: 12.3."} },
    { label: 'Vancouver med', values: {"style":"Vancouver","claim":"Metformin first-line for type 2 diabetes.","evidence_span":"Metformin remains the first-line therapy.","source_metadata":"Authors: ADA. Title: Standards of Care. Journal: Diabetes Care. Year: 2025. Volume: 48. Pages: S1-S300."} }
  ],
  'quote-verify': [
    { label: 'Exact', values: {"quote":"We will deliver in Q4.","source_text":"CEO said: 'We will deliver in Q4.'"} },
    { label: 'Paraphrased', values: {"quote":"Delivery is on track for Q4.","source_text":"CEO said: 'We will deliver in Q4.'"} },
    { label: 'Misattributed', values: {"quote":"Innovation distinguishes a leader.","source_text":"Steve Jobs quoted in Forbes 2011: 'Innovation distinguishes between a leader and a follower.' Often misattributed to Henry Ford."} }
  ],
  'numeric-consistency': [
    { label: 'Currency unit', values: {"claim_text":"Revenue was $1,400M.","source_text":"Q3 revenue: $1.4 billion."} },
    { label: 'Date format', values: {"claim_text":"Effective 04/05/2026.","source_text":"Effective May 4, 2026."} },
    { label: 'Dose mismatch', values: {"claim_text":"Metformin 1000mg.","source_text":"metformin 500mg BID."} }
  ],
  'claim-novelty': [
    { label: 'Earnings claims', values: {"new_claims_text":"Q3 revenue grew 22%.\nGross margin was 64%.\nQ3 revenue increased 22% YoY.","verified_claims_text":"Q3 revenue grew 22% to $1.4B.\nHeadcount fell 5%."} },
    { label: 'Lease claims', values: {"new_claims_text":"Tenant can terminate in 90 days.\nTenant has 90-day notice right.","verified_claims_text":"Tenant has a 90-day termination right."} },
    { label: 'Med claims', values: {"new_claims_text":"Patient on metformin.\nPatient on diabetes medication.","verified_claims_text":"Patient discharged on metformin 500mg BID."} }
  ],
  'evidence-retrieve': [
    { label: 'Revenue query', values: {"query":"Did Q3 revenue grow 22%?","corpus_text":"[s1] Q3 revenue increased 22% YoY to $1.4B.\n[s2] Q2 revenue was flat.\n[s3] Headcount fell 5% in Q3.","top_k":3} },
    { label: 'Lease query', values: {"query":"How much notice to terminate the lease?","corpus_text":"[s1] Tenant may, upon ninety (90) days written notice, terminate this lease.\n[s2] Landlord covenants apply throughout the term.\n[s3] Rent is due on the first.","top_k":2} },
    { label: 'Med query', values: {"query":"What was the discharge medication?","corpus_text":"[s1] Discharge meds: metformin 500mg BID.\n[s2] BP measured 130/85 at discharge.\n[s3] Follow-up in 2 weeks.","top_k":2} }
  ],
  'rag-answer': [
    { label: 'Revenue Q', values: {"question":"What was Q3 revenue?","corpus_text":"[s1] Q3 revenue increased 22% YoY to $1.4B.\n[s2] Q3 margin was 64%."} },
    { label: 'Lease Q', values: {"question":"Can the tenant terminate early?","corpus_text":"[s1] Tenant may, upon ninety (90) days written notice, terminate.\n[s2] No early termination fee."} },
    { label: 'Med Q', values: {"question":"What medications were prescribed?","corpus_text":"[s1] Discharge meds: metformin 500mg BID.\n[s2] Lisinopril 10mg QD added at discharge."} }
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

// ── Pass 7: new MECHANICAL AI features ─────────────────────────────
function makeFeatureRoute(slug) {
  router.post(`/${slug}`, async (req, res) => {
    try {
      const result = await ai.runFeature(slug, SCHEMAS[slug], req.body || {});
      await record(slug, req.body || {}, result);
      res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
['citation-coverage','hallucination-flag','source-credibility','citation-generate',
 'quote-verify','numeric-consistency','claim-novelty','evidence-retrieve','rag-answer']
  .forEach(makeFeatureRoute);

// ── Pass 7: NEEDS-CREDS stubs (503 — explicit, documented) ─────────
router.post('/embedding-index', (req, res) => {
  res.status(503).json({
    error: 'NEEDS-CREDS: embedding provider not configured',
    detail: 'Requires OPENAI/Voyage/Cohere API key + pgvector extension; see _AUDIT_NOTE.md §5.',
    hint: 'Use /api/ai/evidence-retrieve for LLM-rerank-only retrieval in the meantime.'
  });
});
router.post('/live-web-fetch', (req, res) => {
  res.status(503).json({
    error: 'NEEDS-CREDS + TOO-RISKY: live web fetch disabled',
    detail: 'Arbitrary-URL fetch is gated on archival/proxy creds + SSRF/legal review; see _AUDIT_NOTE.md §6.'
  });
});

module.exports = router;
