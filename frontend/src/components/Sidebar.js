import React from 'react';
import { NavLink } from 'react-router-dom';
import { logout, getStoredUser } from '../services/api';

const CRUD_LINKS = [
  { to: '/documents', label: 'Documents' },
  { to: '/claims', label: 'Claims' },
  { to: '/source-corpora', label: 'Source Corpora' },
  { to: '/sources', label: 'Sources' },
  { to: '/document-spans', label: 'Document Spans' },
  { to: '/evidence-links', label: 'Evidence Links' },
  { to: '/grounding-reports', label: 'Grounding Reports' },
  { to: '/signatures', label: 'Signatures' },
  { to: '/redaction-logs', label: 'Redaction Logs' },
];

const AI_LINKS = [
  { to: '/ai/extract-claims', label: 'AI · Extract Atomic Claims' },
  { to: '/ai/ground-claims', label: 'AI · Ground Claims' },
  { to: '/ai/grounding-report', label: 'AI · Build Grounding Report' },
  { to: '/ai/contradiction-detect', label: 'AI · Contradiction Detect' },
  { to: '/ai/paraphrase-link', label: 'AI · Paraphrase Linker' },
  { to: '/ai/source-deduplicate', label: 'AI · Source Deduplicator' },
  { to: '/ai/entailment-score', label: 'AI · Entailment Score' },
  { to: '/ai/citation-coverage', label: 'AI · Citation Coverage' },
  { to: '/ai/hallucination-flag', label: 'AI · Hallucination Flagger' },
  { to: '/ai/source-credibility', label: 'AI · Source Credibility' },
  { to: '/ai/citation-generate', label: 'AI · Citation Generator' },
  { to: '/ai/quote-verify', label: 'AI · Quote Verifier' },
  { to: '/ai/numeric-consistency', label: 'AI · Numeric Consistency' },
  { to: '/ai/claim-novelty', label: 'AI · Claim Novelty' },
  { to: '/ai/evidence-retrieve', label: 'AI · Evidence Retriever' },
  { to: '/ai/rag-answer', label: 'AI · RAG Answer' },
];

const CUSTOM_LINKS = [
  { to: '/wb/pdf-viewer', label: 'PDF Viewer' },
  { to: '/wb/merkle-viewer', label: 'Merkle Viewer' },
  { to: '/provenance-graph', label: 'Provenance Graph' },
  { to: '/fact-check-publisher', label: 'Fact-Check Publisher' },
  { to: '/bulk-ingest', label: 'Bulk Ingest' },
  { to: '/audit-log', label: 'Audit Log' },
];

export default function Sidebar() {
  const user = getStoredUser();
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <h1>GROUNDED CLAIMS VERIFIER</h1>
        <p>Per-claim provenance. Every sentence ships with a verifiable source span.</p>
      </div>
      <NavLink to="/" end>Dashboard</NavLink>
      <div className="sidebar-group-label">Data</div>
      {CRUD_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
      <div className="sidebar-group-label">AI Features</div>
      {AI_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
      {CUSTOM_LINKS.length > 0 && <div className="sidebar-group-label">Workbenches</div>}
      {CUSTOM_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
      <div className="sidebar-group-label">Custom</div>
      <NavLink to="/custom-views">Claims Views</NavLink>
      <div className="sidebar-user">
        {user && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name || user.email}</div>
            <div className="sidebar-user-role">{user.role || 'user'}</div>
          </div>
        )}
        <button className="btn secondary sidebar-logout" onClick={logout}>Sign Out</button>
      </div>
    </nav>
  );
}
