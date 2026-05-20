import React from 'react';
import AIPage from '../components/AIPage';
import { aiParaphraseLink } from '../services/api';

export default function AIParaphraseLinkPage() {
  return (
    <AIPage
      title="AI · Paraphrase Linker"
      feature="paraphrase-link"
      subtitle="Paraphrase Linker"
      inputs={[
        { key: 'claim_text', label: 'Claim', type: 'textarea', placeholder: '' },
        { key: 'source_corpus', label: 'Source Corpus', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiParaphraseLink(v)}
    />
  );
}
