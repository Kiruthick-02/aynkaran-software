import React from 'react';
import { useApp } from '../context/AppContext';
import Dashboard from '../modules/dashboard/Dashboard';

export default function DashboardPage() {
  const { candidates, policies, customers, reminders, setActiveTab } = useApp();

  return (
    <Dashboard
      candidates={candidates}
      policies={policies}
      customers={customers}
      reminders={reminders}
      onNavigate={(tab) => setActiveTab(tab)}
    />
  );
}
