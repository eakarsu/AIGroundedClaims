import React, { useEffect, useState } from 'react';
import { getAuditLog } from '../services/api';

export default function AuditLogPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [entity, setEntity] = useState('');
  const [entityId, setEntityId] = useState('');

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const q = {};
      if (entity) q.entity = entity;
      if (entityId) q.entity_id = entityId;
      const data = await getAuditLog(q);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Audit Log</h2>
          <p>Immutable append-only log of who-changed-what-when (claims / reports / sources).</p>
        </div>
        <div className="page-header-actions">
          <button className="btn" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="form-grid">
          <div className="form-group">
            <label>Entity</label>
            <select value={entity} onChange={(e) => setEntity(e.target.value)}>
              <option value="">(any)</option>
              <option value="claim">claim</option>
              <option value="document">document</option>
              <option value="source">source</option>
              <option value="grounding_report">grounding_report</option>
            </select>
          </div>
          <div className="form-group">
            <label>Entity ID</label>
            <input type="text" value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="(optional)" />
          </div>
          <div className="form-group">
            <label>&nbsp;</label>
            <button className="btn secondary" onClick={load}>Apply Filter</button>
          </div>
        </div>
      </div>
      {err && <div className="ai-error">{err}</div>}
      <div className="card">
        {rows.length === 0 && !loading && <div className="empty-state">No audit entries.</div>}
        {rows.map((r) => (
          <div key={r.id} className="history-entry">
            <div className="history-entry-meta">
              <span className="history-entry-id">#{r.id} · {r.entity}/{r.entity_id || '—'} · {r.action}</span>
              <span className="history-entry-time">{r.at ? new Date(r.at).toLocaleString() : ''} · actor={r.actor || '—'}</span>
            </div>
            <details>
              <summary>before / after</summary>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify({ before: r.before, after: r.after }, null, 2)}</pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
