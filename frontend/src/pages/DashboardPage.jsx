import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Dashboard from '../modules/dashboard/Dashboard';
import { advisorApi } from '../services/advisorApi';
import { apiService } from '../services/api';
import { companyApi } from '../services/companyApi';

export default function DashboardPage() {
  const { candidates, policies, customers, reminders, setActiveTab, userRole, adminUser } = useApp();
  const [advisors, setAdvisors] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [allSupervisedCustomers, setAllSupervisedCustomers] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchLiveTelemetry = () => {
      companyApi.getAll().then(data => {
        if (Array.isArray(data)) setCompanies(data);
      }).catch(err => console.warn('[Dashboard Companies Fetch]', err.message));

      if (userRole === 'SuperAdmin') {
        advisorApi.getAdvisors().then(data => {
          if (Array.isArray(data)) setAdvisors(data);
        }).catch(err => console.warn('[Dashboard Advisors Fetch]', err.message));

        apiService.getStaffList().then(data => {
          if (Array.isArray(data)) setStaffs(data);
        }).catch(err => console.warn('[Dashboard Staff Fetch]', err.message));

        apiService.getCustomers('SuperAdmin', 'admin', true).then(data => {
          if (Array.isArray(data)) setAllSupervisedCustomers(data);
        }).catch(err => console.warn('[Dashboard Supervised Custs Fetch]', err.message));
      }
    };

    fetchLiveTelemetry();
    const interval = setInterval(fetchLiveTelemetry, 6000);
    return () => clearInterval(interval);
  }, [userRole]);

  return (
    <Dashboard
      candidates={candidates}
      policies={policies}
      customers={customers}
      allSupervisedCustomers={allSupervisedCustomers}
      companies={companies}
      reminders={reminders}
      advisors={advisors}
      staffs={staffs}
      userRole={userRole}
      adminUser={adminUser}
      onNavigate={(tab) => setActiveTab(tab)}
    />
  );
}
