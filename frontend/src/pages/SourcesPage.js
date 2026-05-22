import React from 'react';
import CrudPage from '../components/CrudPage';
import { sourcesApi } from '../services/api';

const FIELDS = [
  { key: 'corpus_id', label: 'Corpus ID', type: 'number' },
  { key: 'url', label: 'URL', type: 'text' },
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'publisher', label: 'Publisher', type: 'text' },
  { key: 'author', label: 'Author', type: 'text' },
  { key: 'published_at', label: 'Published At', type: 'datetime-local' },
  { key: 'retrieved_at', label: 'Retrieved At', type: 'datetime-local' },
  { key: 'sha256', label: 'SHA-256', type: 'text' },
  { key: 'license', label: 'License', type: 'text' },
  { key: 'credibility_score', label: 'Credibility', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function SourcesPage() {
  return <CrudPage title="Sources" subtitle="Individual source records" api={sourcesApi} fields={FIELDS} />;
}
