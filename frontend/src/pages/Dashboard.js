import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const FEATURES = [
  { path: '/documents', title: 'Documents', icon: 'D', color: '#3b82f6', desc: 'Manage documents.' },
  { path: '/claims', title: 'Claims', icon: 'C', color: '#3b82f6', desc: 'Manage claims.' },
  { path: '/source-corpora', title: 'Source Corpora', icon: 'S', color: '#3b82f6', desc: 'Manage source corpora.' },
  { path: '/grounding-reports', title: 'Grounding Reports', icon: 'G', color: '#3b82f6', desc: 'Manage grounding reports.' },
  { path: '/signatures', title: 'Signatures', icon: 'X', color: '#3b82f6', desc: 'Manage signatures.' },
  { path: '/redaction-logs', title: 'Redaction Logs', icon: 'R', color: '#3b82f6', desc: 'Manage redaction logs.' },
  { path: '/ai/extract-claims', title: 'AI · Extract Atomic Claims', icon: '*', color: '#8b5cf6', desc: 'Extract Atomic Claims' },
  { path: '/ai/ground-claims', title: 'AI · Ground Claims', icon: '*', color: '#8b5cf6', desc: 'Ground Claims' },
  { path: '/ai/grounding-report', title: 'AI · Build Grounding Report', icon: '*', color: '#8b5cf6', desc: 'Build Grounding Report' },
  { path: '/ai/contradiction-detect', title: 'AI · Contradiction Detect', icon: '*', color: '#8b5cf6', desc: 'Contradiction Detect' },
  { path: '/ai/paraphrase-link', title: 'AI · Paraphrase Linker', icon: '*', color: '#8b5cf6', desc: 'Paraphrase Linker' },
  { path: '/ai/source-deduplicate', title: 'AI · Source Deduplicator', icon: '*', color: '#8b5cf6', desc: 'Source Deduplicator' },
  { path: '/ai/entailment-score', title: 'AI · Entailment Score', icon: '*', color: '#8b5cf6', desc: 'Entailment Score' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { getDashboardStats().then(setStats).catch((e) => setErr(e.message)); }, []);

  return (
    <div>
      <div className="dashboard-header">
        <h2>Grounded Claims Verifier</h2>
        <p>Per-claim provenance. Every sentence ships with a verifiable source span.</p>
      </div>
      {err && <div className="ai-error">Stats unavailable: {err}</div>}
      {stats && (
        <div className="stats-grid">
          <div className="stat"><div className="stat-label">Documents</div><div className="stat-value">{stats.documents?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Claims</div><div className="stat-value">{stats.claims?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Source Corpora</div><div className="stat-value">{stats.source_corpora?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Grounding Reports</div><div className="stat-value">{stats.grounding_reports?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Signatures</div><div className="stat-value">{stats.signatures?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Redaction Logs</div><div className="stat-value">{stats.redaction_logs?.total ?? '—'}</div></div>
        </div>
      )}
      <h3 style={{ color: '#cbd5e1', margin: '8px 0 14px', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }}>Capabilities</h3>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div key={f.path} className="feature-card" style={{ ['--card-color']: f.color }} onClick={() => navigate(f.path)}>
            <div className="feature-card-icon" style={{ background: f.color + '22', color: f.color }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
