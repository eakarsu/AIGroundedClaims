const configuredApiBase = process.env.REACT_APP_API_URL || '/api';
const API_BASE = configuredApiBase.endsWith('/api')
  ? configuredApiBase
  : `${configuredApiBase.replace(/\/$/, '')}/api`;
const TOKEN_KEY = 'grounded_claims_token';
const USER_KEY = 'grounded_claims_user';

export { API_BASE };
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} };
export const getStoredUser = () => { try { const r = localStorage.getItem(USER_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
export const setStoredUser = (u) => { try { u ? localStorage.setItem(USER_KEY, JSON.stringify(u)) : localStorage.removeItem(USER_KEY); } catch {} };
export function logout() { setToken(null); setStoredUser(null); if (typeof window !== 'undefined') window.location.assign('/login'); }
export function getRole() { return (getStoredUser()?.role || 'viewer').toLowerCase(); }
export function canWrite() { return ['commander', 'analyst'].includes(getRole()); }
export function isCommander() { return getRole() === 'commander'; }

async function request(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (res.status === 401 && !url.startsWith('/auth/login')) { logout(); throw new Error('Session expired'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function crud(base) {
  return {
    list: () => request(`/${base}`),
    get: (id) => request(`/${base}/${id}`),
    create: (data) => request(`/${base}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, d) => request(`/${base}/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    remove: (id) => request(`/${base}/${id}`, { method: 'DELETE' }),
    bulkImport: (csv) => request(`/${base}/bulk-import`, { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: csv }),
    listAttachments: (id) => request(`/${base}/${id}/attachments`),
    uploadAttachment: async (id, file) => {
      const token = getToken();
      const form = new FormData(); form.append('file', file);
      const res = await fetch(`${API_BASE}/${base}/${id}/attachments`, {
        method: 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      return data;
    },
  };
}

export const login = (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const getMe = () => request('/auth/me');

export const documentsApi = crud('documents');
export const claimsApi = crud('claims');
export const source_corporaApi = crud('source-corpora');
export const grounding_reportsApi = crud('grounding-reports');
export const signaturesApi = crud('signatures');
export const redaction_logsApi = crud('redaction-logs');

export const aiExtractClaims = (body, options = {}) => request('/ai/extract-claims', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiGroundClaims = (body, options = {}) => request('/ai/ground-claims', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiGroundingReport = (body, options = {}) => request('/ai/grounding-report', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiContradictionDetect = (body, options = {}) => request('/ai/contradiction-detect', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiParaphraseLink = (body, options = {}) => request('/ai/paraphrase-link', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiSourceDeduplicate = (body, options = {}) => request('/ai/source-deduplicate', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiEntailmentScore = (body, options = {}) => request('/ai/entailment-score', { ...options, method: 'POST', body: JSON.stringify(body || {}) });

// Pass 7 — new AI features
export const aiCitationCoverage = (body, options = {}) => request('/ai/citation-coverage', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiHallucinationFlag = (body, options = {}) => request('/ai/hallucination-flag', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiSourceCredibility = (body, options = {}) => request('/ai/source-credibility', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiCitationGenerate = (body, options = {}) => request('/ai/citation-generate', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiQuoteVerify = (body, options = {}) => request('/ai/quote-verify', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiNumericConsistency = (body, options = {}) => request('/ai/numeric-consistency', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiClaimNovelty = (body, options = {}) => request('/ai/claim-novelty', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiEvidenceRetrieve = (body, options = {}) => request('/ai/evidence-retrieve', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiRagAnswer = (body, options = {}) => request('/ai/rag-answer', { ...options, method: 'POST', body: JSON.stringify(body || {}) });

// Pass 7 — evidence library CRUD (sources / document_spans / evidence_links)
export const sourcesApi = crud('sources');
export const documentSpansApi = crud('document-spans');
export const evidenceLinksApi = crud('evidence-links');

// Pass 7 — extras
export const getAuditLog = (q = {}) => {
  const qs = new URLSearchParams(q).toString();
  return request(`/audit-log${qs ? '?' + qs : ''}`);
};
export const getClaimReviewJsonLd = (claimId) => request(`/claims/${claimId}/claim-review.jsonld`);
export const getClaimProvenance = (claimId) => request(`/claims/${claimId}/provenance`);
export const getClaimDiff = (claimId) => request(`/claims/${claimId}/diff`);
export const getFactCheck = (claimId) => request(`/fact-checks/${claimId}`);
export const getAnchorAdvice = (reportId) => request(`/grounding-reports/${reportId}/anchor-advice`);
export const assignClaim = (claimId, reviewer) => request(`/claims/${claimId}/assign`, { method: 'POST', body: JSON.stringify({ reviewer }) });
export const transitionClaim = (claimId, to_status) => request(`/claims/${claimId}/transition`, { method: 'POST', body: JSON.stringify({ to_status }) });
export const bulkIngestDocuments = (ndjson) => request('/documents/bulk', { method: 'POST', headers: { 'Content-Type': 'application/x-ndjson' }, body: ndjson });
export const getDashboardExtras = () => request('/dashboard-extras');

export const getAIHistory = (feature, limit = 25) => {
  const qs = new URLSearchParams({ ...(feature ? { feature } : {}), limit: String(limit) }).toString();
  return request(`/ai/history?${qs}`);
};
export const getAISamples = (feature) => {
  const qs = new URLSearchParams({ feature: feature || '' }).toString();
  return request(`/ai/samples?${qs}`);
};

export const getDashboardStats = () => request('/dashboard');

export const getNotifications = () => request('/notifications');
export const getUnreadNotifications = () => request('/notifications/unread');
export const markNotificationRead = (id) => request(`/notifications/${id}/read`, { method: 'POST' });
export const markAllNotificationsRead = () => request('/notifications/mark-all-read', { method: 'POST' });

export const customViewsApi = {
  citationDistribution: () => request('/custom-views/citation-distribution'),
  accuracyHeatmap: () => request('/custom-views/accuracy-heatmap'),
  factCheckReportPdfUrl: () => `${API_BASE}/custom-views/fact-check-report.pdf`,
  listRules: () => request('/custom-views/rules'),
  createRule: (d) => request('/custom-views/rules', { method: 'POST', body: JSON.stringify(d) }),
  updateRule: (id, d) => request(`/custom-views/rules/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteRule: (id) => request(`/custom-views/rules/${id}`, { method: 'DELETE' }),
};

export const webhooksApi = {
  list: () => request('/webhooks'),
  create: (d) => request('/webhooks', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d) => request(`/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove: (id) => request(`/webhooks/${id}`, { method: 'DELETE' }),
  test: (event, payload) => request('/webhooks/test', { method: 'POST', body: JSON.stringify({ event, payload }) }),
  deliveries: (id) => request(`/webhooks/${id}/deliveries`),
};
