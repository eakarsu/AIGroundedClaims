import React, { useEffect, useState } from 'react';
import { customViewsApi } from '../../services/api';

const EMPTY = { domain: '', trust: 'medium', min_confidence: 0.7, category: 'general', notes: '' };

export default function GroundingRulesEditor() {
  const [rules, setRules] = useState([]);
  const [err, setErr] = useState(null);
  const [draft, setDraft] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => customViewsApi.listRules().then((d) => setRules(d.rules || [])).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      if (editingId) {
        await customViewsApi.updateRule(editingId, draft);
      } else {
        await customViewsApi.createRule(draft);
      }
      setDraft(EMPTY); setEditingId(null);
      await load();
    } catch (e2) { setErr(e2.message); }
    finally { setBusy(false); }
  };

  const startEdit = (r) => { setEditingId(r.id); setDraft({ ...r }); };
  const cancelEdit = () => { setEditingId(null); setDraft(EMPTY); };
  const remove = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try { await customViewsApi.deleteRule(id); await load(); } catch (e) { setErr(e.message); }
  };

  const trustColor = (t) => ({ high: '#10b981', medium: '#eab308', low: '#dc2626' }[t] || '#94a3b8');

  return (
    <div
      data-testid="grounding-rules-editor"
      className="card"
      style={{ background: '#0f172a', border: '1px solid #1e293b', padding: 20, borderRadius: 10 }}
    >
      <h3 style={{ margin: 0, color: '#f1f5f9' }}>Source / Grounding Rules Editor</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>
        CRUD trusted domains and per-source confidence thresholds applied to grounding.
      </p>

      {err && <div className="ai-error" style={{ marginBottom: 10 }}>{err}</div>}

      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: 8, alignItems: 'end', marginBottom: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#94a3b8' }}>Domain</label>
          <input
            required
            value={draft.domain}
            onChange={(e) => setDraft({ ...draft, domain: e.target.value })}
            placeholder="example.org"
            style={inp}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#94a3b8' }}>Trust</label>
          <select value={draft.trust} onChange={(e) => setDraft({ ...draft, trust: e.target.value })} style={inp}>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#94a3b8' }}>Min confidence</label>
          <input
            type="number" step="0.05" min="0" max="1"
            value={draft.min_confidence}
            onChange={(e) => setDraft({ ...draft, min_confidence: parseFloat(e.target.value) })}
            style={inp}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#94a3b8' }}>Category</label>
          <input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} style={inp} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#94a3b8' }}>Notes</label>
          <input value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} style={inp} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn" type="submit" disabled={busy}>{editingId ? 'Save' : 'Add'}</button>
          {editingId && <button className="btn secondary" type="button" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: '#94a3b8', borderBottom: '1px solid #1e293b' }}>
              <th style={th}>Domain</th>
              <th style={th}>Trust</th>
              <th style={th}>Min conf.</th>
              <th style={th}>Category</th>
              <th style={th}>Notes</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 && (
              <tr><td colSpan="6" style={{ color: '#64748b', padding: 10 }}>No rules yet.</td></tr>
            )}
            {rules.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #1e293b', color: '#cbd5e1' }}>
                <td style={td}>{r.domain}</td>
                <td style={td}>
                  <span style={{ background: trustColor(r.trust), color: '#0f172a', padding: '2px 8px', borderRadius: 10, fontWeight: 600, fontSize: 11 }}>
                    {r.trust}
                  </span>
                </td>
                <td style={td}>{Number(r.min_confidence).toFixed(2)}</td>
                <td style={td}>{r.category}</td>
                <td style={td}>{r.notes}</td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <button className="btn secondary" style={{ padding: '4px 10px', marginRight: 6 }} onClick={() => startEdit(r)}>Edit</button>
                  <button className="btn danger" style={{ padding: '4px 10px' }} onClick={() => remove(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inp = { width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', padding: '6px 8px', borderRadius: 4, fontSize: 13 };
const th = { textAlign: 'left', padding: '6px 8px', fontWeight: 500 };
const td = { padding: '8px' };
