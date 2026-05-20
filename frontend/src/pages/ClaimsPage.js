import React from 'react';
import CrudPage from '../components/CrudPage';
import { claimsApi } from '../services/api';

const FIELDS = [
  { key: 'document_title', label: 'Document', type: 'text' },
  { key: 'claim_text', label: 'Claim', type: 'textarea' },
  { key: 'subject', label: 'Subject', type: 'text' },
  { key: 'predicate', label: 'Predicate', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ["supported","partial","unsupported","contradicted"] }
];

export default function ClaimsPage() {
  return (
    <CrudPage
      title="Claims"
      subtitle="Manage claims records"
      api={claimsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
