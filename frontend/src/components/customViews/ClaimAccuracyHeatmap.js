import React, { useEffect, useState } from 'react';
import { customViewsApi } from '../../services/api';

function cellColor(pct) {
  // 0 = red, 50 = amber, 100 = green
  if (pct >= 90) return '#10b981';
  if (pct >= 75) return '#22c55e';
  if (pct >= 60) return '#eab308';
  if (pct >= 40) return '#f97316';
  return '#dc2626';
}

export default function ClaimAccuracyHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    customViewsApi.accuracyHeatmap().then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="ai-error">Failed to load: {err}</div>;
  if (!data) return <div style={{ color: '#94a3b8' }}>Loading accuracy heatmap...</div>;

  return (
    <div className="card" style={{ background: '#0f172a', border: '1px solid #1e293b', padding: 20, borderRadius: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <h3 style={{ margin: 0, color: '#f1f5f9' }}>Claim Accuracy Heatmap</h3>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>
          {data.cell_count} cells &middot; claim type x source quality
        </span>
      </div>
      <div data-testid="claim-accuracy-heatmap" style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 4, minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={{ background: 'transparent' }}></th>
              {data.source_quality.map((sq) => (
                <th key={sq} style={{ color: '#cbd5e1', fontSize: 12, padding: '6px 8px', textAlign: 'center' }}>
                  {sq}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.claim_types.map((ct, r) => (
              <tr key={ct}>
                <td style={{ color: '#cbd5e1', fontSize: 12, padding: '6px 10px', textAlign: 'right' }}>{ct}</td>
                {data.source_quality.map((_, c) => {
                  const pct = data.matrix[r][c];
                  return (
                    <td
                      key={c}
                      title={`${ct} x ${data.source_quality[c]}: ${pct}% accurate`}
                      style={{
                        background: cellColor(pct),
                        color: pct >= 60 ? '#0f172a' : '#f1f5f9',
                        fontWeight: 600,
                        padding: '12px 14px',
                        textAlign: 'center',
                        borderRadius: 6,
                        minWidth: 70,
                      }}
                    >
                      {pct}%
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12, color: '#94a3b8', fontSize: 11 }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#10b981', marginRight: 4 }} /> ≥90%</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#eab308', marginRight: 4 }} /> 60-74%</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#dc2626', marginRight: 4 }} /> &lt;40%</span>
      </div>
    </div>
  );
}
