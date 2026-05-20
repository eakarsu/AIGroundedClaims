import React, { useEffect, useState } from 'react';
import { customViewsApi } from '../../services/api';

export default function CitationDistributionChart() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    customViewsApi.citationDistribution().then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="ai-error">Failed to load: {err}</div>;
  if (!data) return <div style={{ color: '#94a3b8' }}>Loading citation distribution...</div>;

  const max = Math.max(...data.buckets.map((b) => b.citations));
  const palette = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#a855f7'];

  return (
    <div className="card" style={{ background: '#0f172a', border: '1px solid #1e293b', padding: 20, borderRadius: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <h3 style={{ margin: 0, color: '#f1f5f9' }}>Source Citation Distribution</h3>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>
          {data.total_citations} citations across {data.distinct_sources} sources
        </span>
      </div>
      <div data-testid="citation-distribution-chart" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.buckets.map((b, i) => {
          const pct = (b.citations / max) * 100;
          const supportPct = b.citations ? (b.supported / b.citations) * 100 : 0;
          return (
            <div key={b.source}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>
                <span>{b.source}</span>
                <span style={{ color: '#94a3b8' }}>
                  {b.citations} cites &middot; {Math.round(supportPct)}% supported
                </span>
              </div>
              <div style={{ position: 'relative', height: 22, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: palette[i % palette.length],
                    transition: 'width 400ms',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${pct * (supportPct / 100)}%`,
                    height: '100%',
                    background: 'rgba(16, 185, 129, 0.35)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ color: '#64748b', fontSize: 11, marginTop: 12 }}>
        Green overlay = portion of citations that were supported by the source.
      </p>
    </div>
  );
}
