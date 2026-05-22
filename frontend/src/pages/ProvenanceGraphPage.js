import React, { useState } from 'react';
import { getClaimProvenance } from '../services/api';

export default function ProvenanceGraphPage() {
  const [claimId, setClaimId] = useState('');
  const [graph, setGraph] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!claimId) return;
    setLoading(true); setErr(null); setGraph(null);
    try { setGraph(await getClaimProvenance(claimId)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Provenance Graph</h2>
          <p>Claim → spans → sources, edges colored by verdict.</p>
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
            <button className="btn ai" onClick={load} disabled={loading || !claimId}>{loading ? 'Loading…' : 'Load Graph'}</button>
          </div>
        </div>
      </div>
      {err && <div className="ai-error">{err}</div>}
      {graph && (
        <div className="card">
          <h4>Nodes ({graph.nodes.length})</h4>
          <ul>
            {graph.nodes.map((n) => (
              <li key={n.id}><b>{n.kind}</b> <code>{n.id}</code> — {n.label || '(no label)'}</li>
            ))}
          </ul>
          <h4 style={{ marginTop: 16 }}>Edges ({graph.edges.length})</h4>
          <ul>
            {graph.edges.map((e, i) => (
              <li key={i}>
                <code>{e.from}</code> → <code>{e.to}</code> · verdict=<b>{e.verdict || '—'}</b> · score={e.score == null ? '—' : e.score}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
