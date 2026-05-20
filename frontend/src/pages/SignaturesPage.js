import React from 'react';
import CrudPage from '../components/CrudPage';
import { signaturesApi } from '../services/api';

const FIELDS = [
  { key: 'report_id_ref', label: 'Report', type: 'text' },
  { key: 'signer', label: 'Signer', type: 'text' },
  { key: 'signed_at', label: 'Signed', type: 'datetime-local' },
  { key: 'key_fingerprint', label: 'Key Fingerprint', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ["valid","revoked","expired"] }
];

export default function SignaturesPage() {
  return (
    <CrudPage
      title="Signatures"
      subtitle="Manage signatures records"
      api={signaturesApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
