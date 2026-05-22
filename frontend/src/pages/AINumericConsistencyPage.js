import React from 'react';
import AIPage from '../components/AIPage';
import { aiNumericConsistency } from '../services/api';

export default function AINumericConsistencyPage() {
  return (
    <AIPage
      title="AI · Numeric / Unit Consistency"
      feature="numeric-consistency"
      subtitle="Flag mis-converted numbers, currency, units, dates between claim and source."
      inputs={[
        { key: 'claim_text', label: 'Claim Text', type: 'textarea' },
        { key: 'source_text', label: 'Source Text', type: 'textarea' },
      ]}
      run={(v) => aiNumericConsistency(v)}
    />
  );
}
