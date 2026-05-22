import React from 'react';
import AIPage from '../components/AIPage';
import { aiHallucinationFlag } from '../services/api';

export default function AIHallucinationFlagPage() {
  return (
    <AIPage
      title="AI · Hallucination Flagger"
      feature="hallucination-flag"
      subtitle="Per-sentence 'hallucinated / fabricated source / unverifiable' verdict with confidence."
      inputs={[
        { key: 'report_text', label: 'Report Text', type: 'textarea' },
        { key: 'sources_text', label: 'Sources / Evidence', type: 'textarea' },
      ]}
      run={(v) => aiHallucinationFlag(v)}
    />
  );
}
