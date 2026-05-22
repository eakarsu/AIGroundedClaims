import React, { useEffect, useState } from 'react';

export default function SourceStalenessMonitor() {
  const [data, setData] = useState(null);
  const token = localStorage.getItem('grounded_claims_token');
  useEffect(() => {
    fetch('/api/source-staleness-monitor', { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then((r) => r.json()).then(setData).catch(() => {});
  }, [token]);
  return (
    <div>
      <h1>Source Staleness Monitor</h1>
      <p>Flags evidence sources whose refresh age can weaken grounded claims.</p>
      {data?.sources?.map((source) => (
        <section key={source.title} className="card">
          <h3>{source.title}</h3>
          <p>{source.status} - score {source.staleness_score}</p>
          <p>{source.action}</p>
        </section>
      ))}
    </div>
  );
}
