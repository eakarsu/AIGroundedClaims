import React from 'react';
import CrudPage from '../components/CrudPage';
import { documentSpansApi } from '../services/api';

const FIELDS = [
  { key: 'document_id', label: 'Document ID', type: 'number' },
  { key: 'document_title', label: 'Document Title', type: 'text' },
  { key: 'span_index', label: 'Span Index', type: 'number' },
  { key: 'page_number', label: 'Page', type: 'number' },
  { key: 'text', label: 'Span Text', type: 'textarea' },
  { key: 'char_start', label: 'Char Start', type: 'number' },
  { key: 'char_end', label: 'Char End', type: 'number' },
  { key: 'sha256', label: 'SHA-256', type: 'text' },
];

export default function DocumentSpansPage() {
  // NOTE: document_spans has no updated_at — edit (PUT) is intentionally unsupported by backend.
  return <CrudPage title="Document Spans" subtitle="Document chunking / spans (read + create + delete)" api={documentSpansApi} fields={FIELDS} />;
}
