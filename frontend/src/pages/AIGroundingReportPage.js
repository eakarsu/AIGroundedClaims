import React from 'react';
import AIPage from '../components/AIPage';
import { aiGroundingReport } from '../services/api';

export default function AIGroundingReportPage() {
  return (
    <AIPage
      title="AI · Build Grounding Report"
      feature="grounding-report"
      subtitle="Build Grounding Report"
      inputs={[
        { key: 'report_text', label: 'Generated Report', type: 'textarea', placeholder: '' },
        { key: 'sources_text', label: 'Source Corpus', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiGroundingReport(v)}
    />
  );
}
