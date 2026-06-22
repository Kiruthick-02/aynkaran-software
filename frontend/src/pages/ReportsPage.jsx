import React from 'react';
import { useApp } from '../context/AppContext';
import ReportSystem from '../modules/reports/ReportSystem';

export default function ReportsPage() {
  const { candidates, policies, customers, reminders, userRole } = useApp();

  return (
    <ReportSystem
      candidates={candidates}
      policies={policies}
      customers={customers}
      reminders={reminders}
      userRole={userRole}
    />
  );
}
