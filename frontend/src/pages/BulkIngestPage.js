import React, { useState } from 'react';
import { bulkIngestDocuments } from '../services/api';

const SAMPLE =
  '{"title":"Doc A","source":"acme.com","status":"ingested","page_count":12}\n' +
  '{"title":"Doc B","source":"beta.io","status":"indexed","page_count":4}';

export default function BulkIngestPage() {
  const [ndjson, setNdjson] = useState('');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true); setErr(null); setResult(null);
    try { setResult(await bulkIngestDocuments(ndjson)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Bulk Ingest Documents</h2>
          <p>POST NDJSON — one document JSON object per line.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn secondary" onClick={() => setNdjson(SAMPLE)}>Fill Sample</button>
          <button className="btn ai" onClick={send} disabled={loading || !ndjson.trim()}>{loading ? 'Uploading…' : 'Ingest'}</button>
        </div>
      </div>
      <div className="card">
        <div className="form-group full-width">
          <label>NDJSON</label>
          <textarea
            style={{ minHeight: 240, fontFamily: 'monospace' }}
            value={ndjson}
            onChange={(e) => setNdjson(e.target.value)}
            placeholder='{"title":"…","source":"…","status":"ingested","page_count":1}'
          />
        </div>
      </div>
      {err && <div className="ai-error">{err}</div>}
      {result && (
        <div className="card" style={{ marginTop: 12 }}>
          <p><b>Inserted:</b> {result.inserted} · <b>Failed:</b> {result.failed}</p>
          {(result.errors || []).length > 0 && (
            <details><summary>Errors</summary>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(result.errors, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
