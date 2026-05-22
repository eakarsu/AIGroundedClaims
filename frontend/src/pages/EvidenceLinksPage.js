import React from 'react';
import CrudPage from '../components/CrudPage';
import { evidenceLinksApi } from '../services/api';

const FIELDS = [
  { key: 'claim_id', label: 'Claim ID', type: 'number' },
  { key: 'source_id', label: 'Source ID', type: 'number' },
  { key: 'span_id', label: 'Span ID', type: 'number' },
  { key: 'verdict', label: 'Verdict', type: 'select', options: ['supported','partial','unsupported','contradicted'] },
  { key: 'score', label: 'Score', type: 'number' },
  { key: 'rationale', label: 'Rationale', type: 'textarea' },
  { key: 'created_by', label: 'Created By', type: 'text' },
];

export default function EvidenceLinksPage() {
  return <CrudPage title="Evidence Links" subtitle="claim ↔ source ↔ span linkage with verdict + score" api={evidenceLinksApi} fields={FIELDS} />;
}
