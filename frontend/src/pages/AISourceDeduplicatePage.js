import React from 'react';
import AIPage from '../components/AIPage';
import { aiSourceDeduplicate } from '../services/api';

export default function AISourceDeduplicatePage() {
  return (
    <AIPage
      title="AI · Source Deduplicator"
      feature="source-deduplicate"
      subtitle="Source Deduplicator"
      inputs={[
        { key: 'source_list_text', label: 'Sources (newline)', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiSourceDeduplicate(v)}
    />
  );
}
