import React from 'react';
import CrudPage from '../components/CrudPage';
import { source_corporaApi } from '../services/api';

const FIELDS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'doc_count', label: 'Doc Count', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ["active","archived"] }
];

export default function SourceCorporaPage() {
  return (
    <CrudPage
      title="Source Corpora"
      subtitle="Manage source corpora records"
      api={source_corporaApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
