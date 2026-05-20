import React from 'react';
import AIPage from '../components/AIPage';
import { aiContradictionDetect } from '../services/api';

export default function AIContradictionDetectPage() {
  return (
    <AIPage
      title="AI · Contradiction Detect"
      feature="contradiction-detect"
      subtitle="Contradiction Detect"
      inputs={[
        { key: 'claim_a', label: 'Claim A', type: 'textarea', placeholder: '' },
        { key: 'claim_b', label: 'Claim B', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiContradictionDetect(v)}
    />
  );
}
