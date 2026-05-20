import React from 'react';
import AIPage from '../components/AIPage';
import { aiExtractClaims } from '../services/api';

export default function AIExtractClaimsPage() {
  return (
    <AIPage
      title="AI · Extract Atomic Claims"
      feature="extract-claims"
      subtitle="Extract Atomic Claims"
      inputs={[
        { key: 'text', label: 'Source Text', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiExtractClaims(v)}
    />
  );
}
