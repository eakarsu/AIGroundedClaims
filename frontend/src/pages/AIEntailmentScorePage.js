import React from 'react';
import AIPage from '../components/AIPage';
import { aiEntailmentScore } from '../services/api';

export default function AIEntailmentScorePage() {
  return (
    <AIPage
      title="AI · Entailment Score"
      feature="entailment-score"
      subtitle="Entailment Score"
      inputs={[
        { key: 'premise', label: 'Premise', type: 'textarea', placeholder: '' },
        { key: 'hypothesis', label: 'Hypothesis', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiEntailmentScore(v)}
    />
  );
}
