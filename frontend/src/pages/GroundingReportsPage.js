import React from 'react';
import CrudPage from '../components/CrudPage';
import { grounding_reportsApi } from '../services/api';

const FIELDS = [
  { key: 'document_title', label: 'Document', type: 'text' },
  { key: 'grounding_score', label: 'Score %', type: 'number' },
  { key: 'merkle_root', label: 'Merkle Root', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ["generated","signed","revoked"] },
  { key: 'generated_at', label: 'Generated', type: 'datetime-local' }
];

export default function GroundingReportsPage() {
  return (
    <CrudPage
      title="Grounding Reports"
      subtitle="Manage grounding reports records"
      api={grounding_reportsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
