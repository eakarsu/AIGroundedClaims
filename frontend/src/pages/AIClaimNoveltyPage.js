import React from 'react';
import AIPage from '../components/AIPage';
import { aiClaimNovelty } from '../services/api';

export default function AIClaimNoveltyPage() {
  return (
    <AIPage
      title="AI · Claim Novelty / Duplicate"
      feature="claim-novelty"
      subtitle="Cluster new claims vs. already-verified claim store."
      inputs={[
        { key: 'new_claims_text', label: 'New Claims (one per line)', type: 'textarea' },
        { key: 'verified_claims_text', label: 'Verified Claim Store', type: 'textarea' },
      ]}
      run={(v) => aiClaimNovelty(v)}
    />
  );
}
