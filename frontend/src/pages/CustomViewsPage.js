import React from 'react';
import CitationDistributionChart from '../components/customViews/CitationDistributionChart';
import ClaimAccuracyHeatmap from '../components/customViews/ClaimAccuracyHeatmap';
import FactCheckReportPdf from '../components/customViews/FactCheckReportPdf';
import GroundingRulesEditor from '../components/customViews/GroundingRulesEditor';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page">
      <div className="dashboard-header" style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>Claims Views</h2>
        <p style={{ color: '#94a3b8', marginTop: 6 }}>
          Custom analytics, exports, and grounding policy controls for AI-claim verification.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <CitationDistributionChart />
        <ClaimAccuracyHeatmap />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18 }}>
        <FactCheckReportPdf />
        <GroundingRulesEditor />
      </div>
    </div>
  );
}
