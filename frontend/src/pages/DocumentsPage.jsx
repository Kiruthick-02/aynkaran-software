// frontend/src/pages/DocumentsPage.jsx
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Documents from '../modules/documents/Documents';
import { advisorApi } from '../services/advisorApi';

export default function DocumentsPage({ onShowNotification }) {
  const {
    customers,
    candidates,
    updateCustomer,
    updateCandidate,
  } = useApp();

  const [advisors, setAdvisors] = useState([]);

  useEffect(() => {
    advisorApi.getAdvisors().then(data => {
      if (Array.isArray(data)) setAdvisors(data);
    }).catch(err => console.warn('[Doc Page Fetch Advisors]', err.message));
  }, []);

  return (
    <Documents
      policyHolders={customers}
      customers={customers}
      candidates={candidates}
      advisors={advisors}
      onUpdateCustomer={updateCustomer}
      onUpdateCandidate={updateCandidate}
    />
  );
}