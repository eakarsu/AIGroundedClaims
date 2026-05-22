import React from 'react';
import AIPage from '../components/AIPage';
import { aiRagAnswer } from '../services/api';

export default function AIRagAnswerPage() {
  return (
    <AIPage
      title="AI · Retrieval-Grounded Answer"
      feature="rag-answer"
      subtitle="RAG: question + corpus → grounded answer with inline citations and per-sentence provenance."
      inputs={[
        { key: 'question', label: 'Question', type: 'textarea' },
        { key: 'corpus_text', label: 'Corpus Text (label passages [s1]..[sN])', type: 'textarea' },
      ]}
      run={(v) => aiRagAnswer(v)}
    />
  );
}
