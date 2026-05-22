import React from 'react';
import AIPage from '../components/AIPage';
import { aiCitationCoverage } from '../services/api';

export default function AICitationCoveragePage() {
  return (
    <AIPage
      title="AI · Citation Coverage Scorer"
      feature="citation-coverage"
      subtitle="Score % of report sentences with a supporting citation + per-cite necessity."
      inputs={[
        { key: 'report_text', label: 'Report Text', type: 'textarea' },
        { key: 'citations_text', label: 'Citations / Footnotes', type: 'textarea' },
      ]}
      run={(v) => aiCitationCoverage(v)}
    />
  );
}
