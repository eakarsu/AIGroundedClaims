import React from 'react';
import CrudPage from '../components/CrudPage';
import { redaction_logsApi } from '../services/api';

const FIELDS = [
  { key: 'document_title', label: 'Document', type: 'text' },
  { key: 'redacted_span', label: 'Redacted Span', type: 'textarea' },
  { key: 'reason', label: 'Reason', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ["pending","applied","reverted"] }
];

export default function RedactionLogsPage() {
  return (
    <CrudPage
      title="Redaction Logs"
      subtitle="Manage redaction logs records"
      api={redaction_logsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
