import React, { useState } from 'react';
import { getFactCheck, getClaimReviewJsonLd } from '../services/api';

export default function FactCheckPublisherPage() {
  const [claimId, setClaimId] = useState('');
  const [factCheck, setFactCheck] = useState(null);
  const [jsonld, setJsonld] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!claimId) return;
    setLoading(true); setErr(null); setFactCheck(null); setJsonld(null);
    try {
      const [fc, ld] = await Promise.all([
        getFactCheck(claimId),
        getClaimReviewJsonLd(claimId),
      ]);
      setFactCheck(fc); setJsonld(ld);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Fact-Check Publisher</h2>
          <p>Permalink fact-check article + schema.org ClaimReview JSON-LD export.</p>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="form-grid">
          <div className="form-group">
            <label>Claim ID</label>
            <input type="number" value={claimId} onChange={(e) => setClaimId(e.target.value)} />
          </div>
          <div className="form-group">
            <label>&nbsp;</label>
            <button className="btn ai" onClick={load} disabled={loading || !claimId}>{loading ? 'Loading…' : 'Publish'}</button>
          </div>
        </div>
      </div>
      {err && <div className="ai-error">{err}</div>}
      {factCheck && (
        <div className="card" style={{ marginBottom: 12 }}>
          <h3>{factCheck.claim}</h3>
          <p><b>Rating:</b> {factCheck.rating} · <b>Published:</b> {factCheck.published_at}</p>
          <p><b>Permalink:</b> <code>{factCheck.permalink}</code></p>
          <p><b>Methodology:</b> {factCheck.methodology}</p>
          <h4>Evidence ({(factCheck.evidence || []).length})</h4>
          <ul>
            {(factCheck.evidence || []).map((e, i) => (
              <li key={i}>
                <b>{e.verdict}</b> (score={e.score}) — {e.source_title || e.source_url || 'source?'}
                {e.span_text ? <div style={{ marginLeft: 12, fontStyle: 'italic' }}>"{e.span_text}"</div> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
      {jsonld && (
        <div className="card">
          <h4>schema.org ClaimReview JSON-LD</h4>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(jsonld, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
