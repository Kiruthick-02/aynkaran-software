import React from 'react';
import { useApp } from '../context/AppContext';
import AdvisorManagement from '../modules/advisor/AdvisorManagement';

export default function AdvisorManagementPage({ onShowNotification, initialEnquiry = null }) {
  const {
    candidates,
    addCandidate,
    updateCandidate,
    deleteCandidate
  } = useApp();

  return (
    <AdvisorManagement
      candidates={candidates}
      onAddCandidate={addCandidate}
      onUpdateCandidate={updateCandidate}
      initialEnquiry={initialEnquiry}
      onShowNotification={onShowNotification}
    />
  );
}
