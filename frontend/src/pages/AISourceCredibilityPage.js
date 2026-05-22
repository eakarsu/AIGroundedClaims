import React from 'react';
import AIPage from '../components/AIPage';
import { aiSourceCredibility } from '../services/api';

export default function AISourceCredibilityPage() {
  return (
    <AIPage
      title="AI · Source Credibility Ranker"
      feature="source-credibility"
      subtitle="Score sources on authority, recency, independence, bias."
      inputs={[{ key: 'source_list_text', label: 'Sources (one per line)', type: 'textarea' }]}
      run={(v) => aiSourceCredibility(v)}
    />
  );
}
