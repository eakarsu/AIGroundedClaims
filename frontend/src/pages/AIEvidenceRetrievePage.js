import React from 'react';
import AIPage from '../components/AIPage';
import { aiEvidenceRetrieve } from '../services/api';

export default function AIEvidenceRetrievePage() {
  return (
    <AIPage
      title="AI · Evidence Retriever (LLM rerank)"
      feature="evidence-retrieve"
      subtitle="LLM-rerank top-k passages for a claim. True vector retrieval is NEEDS-CREDS (see /api/ai/embedding-index)."
      inputs={[
        { key: 'query', label: 'Query / Claim', type: 'textarea' },
        { key: 'corpus_text', label: 'Corpus Text (label passages [s1]..[sN])', type: 'textarea' },
        { key: 'top_k', label: 'top_k', type: 'number', defaultValue: 3 },
      ]}
      run={(v) => aiEvidenceRetrieve(v)}
    />
  );
}
