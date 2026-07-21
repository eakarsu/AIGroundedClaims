const RULESET_VERSION = 'grounded-claim-entailment-2026-07-18';
const INJECTION_PATTERNS = [/ignore (all|any|the) previous/i, /system prompt/i, /developer message/i, /follow these instructions/i, /override.*rules/i];
const STOP = new Set(['the','a','an','and','or','of','to','in','on','for','is','are','was','were','with','by','that','this']);

function terms(text) {
  return new Set(String(text).toLowerCase().match(/[a-z0-9]+/g)?.filter((word) => word.length > 2 && !STOP.has(word)) || []);
}

function overlap(claim, evidence) {
  const a = terms(claim); const b = terms(evidence);
  if (!a.size) return 0;
  return [...a].filter((word) => b.has(word)).length / a.size;
}

function hasNegation(text) { return /\b(no|not|never|neither|without|false)\b/i.test(String(text)); }

function validateRequest(input = {}) {
  const errors = [];
  if (!input.client_claim_id || typeof input.client_claim_id !== 'string') errors.push('client_claim_id is required');
  if (!input.claim_text || typeof input.claim_text !== 'string' || input.claim_text.length > 4000) errors.push('claim_text must be a string up to 4000 characters');
  if (!Array.isArray(input.evidence_refs) || !input.evidence_refs.length) errors.push('at least one evidence_refs item is required');
  for (const ref of input.evidence_refs || []) if (!Number.isInteger(Number(ref.source_id)) || !Number.isInteger(Number(ref.span_id))) errors.push('each evidence ref requires numeric source_id and span_id');
  return [...new Set(errors)];
}

function verifyClaim({ claimText, evidenceItems, consequential = false }) {
  const usable = evidenceItems.filter((item) => item.authorized && item.source_sha256 && item.span_sha256);
  const injected = usable.filter((item) => INJECTION_PATTERNS.some((pattern) => pattern.test(item.text)));
  const clean = usable.filter((item) => !injected.includes(item));
  const ranked = clean.map((item) => ({ ...item, score: overlap(claimText, item.text) })).sort((a, b) => b.score - a.score);
  const top = ranked[0];
  let verdict = 'abstained';
  if (top && top.score >= 0.6) verdict = hasNegation(claimText) === hasNegation(top.text) ? 'supported' : 'contradicted';
  else if (top && top.score >= 0.45 && hasNegation(claimText) !== hasNegation(top.text)) verdict = 'contradicted';
  const confidence = top ? Math.min(0.95, Number(top.score.toFixed(3))) : 0;
  return {
    ruleset_version: RULESET_VERSION,
    verdict,
    confidence,
    citations: ranked.slice(0, 3).map((item) => ({ source_id: item.source_id, span_id: item.span_id, source_sha256: item.source_sha256, span_sha256: item.span_sha256, overlap: Number(item.score.toFixed(3)) })),
    excluded_injected_evidence: injected.map((item) => ({ source_id: item.source_id, span_id: item.span_id })),
    uncertainty: verdict === 'abstained' ? 'Insufficient authorized evidence overlap.' : 'Lexical fixture score only; human entailment review remains required.',
    review_required: consequential || verdict !== 'supported' || injected.length > 0,
    externally_published: false,
  };
}

module.exports = { RULESET_VERSION, validateRequest, verifyClaim, overlap, hasNegation };
