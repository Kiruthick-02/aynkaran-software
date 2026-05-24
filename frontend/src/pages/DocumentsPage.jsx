import React from 'react';
import { useApp } from '../context/AppContext';
import Documents from '../modules/documents/Documents';

export default function DocumentsPage() {
  const { candidates, customers } = useApp();

  return (
    <Documents
      candidates={candidates}
      customers={customers}
    />
  );
}
