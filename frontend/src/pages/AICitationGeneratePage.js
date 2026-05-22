import React from 'react';
import AIPage from '../components/AIPage';
import { aiCitationGenerate } from '../services/api';

export default function AICitationGeneratePage() {
  return (
    <AIPage
      title="AI · Citation Generator"
      feature="citation-generate"
      subtitle="Generate a formatted citation (APA / MLA / Bluebook / Vancouver)."
      inputs={[
        { key: 'style', label: 'Style', type: 'select', options: ['APA','MLA','Chicago','Bluebook','Vancouver','IEEE'] },
        { key: 'claim', label: 'Claim', type: 'textarea' },
        { key: 'evidence_span', label: 'Evidence Span', type: 'textarea' },
        { key: 'source_metadata', label: 'Source Metadata', type: 'textarea' },
      ]}
      run={(v) => aiCitationGenerate(v)}
    />
  );
}
