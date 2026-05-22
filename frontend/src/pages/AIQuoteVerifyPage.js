import React from 'react';
import AIPage from '../components/AIPage';
import { aiQuoteVerify } from '../services/api';

export default function AIQuoteVerifyPage() {
  return (
    <AIPage
      title="AI · Quote Verifier"
      feature="quote-verify"
      subtitle="Verify a quote against original (exact / paraphrase / misattributed)."
      inputs={[
        { key: 'quote', label: 'Quote', type: 'textarea' },
        { key: 'source_text', label: 'Source Text', type: 'textarea' },
      ]}
      run={(v) => aiQuoteVerify(v)}
    />
  );
}
