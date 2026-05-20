import React from 'react';
import CrudPage from '../components/CrudPage';
import { documentsApi } from '../services/api';

const FIELDS = [
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'source', label: 'Source', type: 'text' },
  { key: 'sha256', label: 'SHA-256', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ["ingested","indexed","redacted","archived"] },
  { key: 'page_count', label: 'Pages', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'textarea' }
];

export default function DocumentsPage() {
  return (
    <CrudPage
      title="Documents"
      subtitle="Manage documents records"
      api={documentsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
