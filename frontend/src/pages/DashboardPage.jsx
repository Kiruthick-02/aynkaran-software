import React from 'react';
import { useApp } from '../context/AppContext';
import Dashboard from '../modules/dashboard/Dashboard';

export default function DashboardPage() {
  const { candidates, policies, customers, reminders, setActiveTab, userRole } = useApp();

  return (
    <Dashboard
      candidates={candidates}
      policies={policies}
      customers={customers}
      reminders={reminders}
      userRole={userRole}
      onNavigate={(tab) => setActiveTab(tab)}
    />
  );
}
