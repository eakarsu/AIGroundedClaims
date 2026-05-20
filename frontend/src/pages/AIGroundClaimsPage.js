import React from 'react';
import AIPage from '../components/AIPage';
import { aiGroundClaims } from '../services/api';

export default function AIGroundClaimsPage() {
  return (
    <AIPage
      title="AI · Ground Claims"
      feature="ground-claims"
      subtitle="Ground Claims"
      inputs={[
        { key: 'claims_text', label: 'Claims (newline)', type: 'textarea', placeholder: '' },
        { key: 'sources_text', label: 'Source Corpus', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiGroundClaims(v)}
    />
  );
}
