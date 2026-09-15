import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ReportSystem from '../modules/reports/ReportSystem';
import { advisorApi } from '../services/advisorApi';
import { apiService } from '../services/api';
import { companyApi } from '../services/companyApi';

export default function ReportsPage() {
  const { candidates, policies, customers, reminders, userRole, adminUser } = useApp();
  const [advisors, setAdvisors] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [allSupervisedCustomers, setAllSupervisedCustomers] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchLiveTelemetry = () => {
      companyApi.getAll().then(data => {
        if (Array.isArray(data)) setCompanies(data);
      }).catch(err => console.warn('[Reports Companies Fetch]', err.message));

      if (userRole === 'SuperAdmin') {
        advisorApi.getAdvisors().then(data => {
          if (Array.isArray(data)) setAdvisors(data);
        }).catch(err => console.warn('[Reports Advisors Fetch]', err.message));

        apiService.getStaffList().then(data => {
          if (Array.isArray(data)) setStaffs(data);
        }).catch(err => console.warn('[Reports Staff Fetch]', err.message));

        apiService.getCustomers('SuperAdmin', 'admin', true).then(data => {
          if (Array.isArray(data)) setAllSupervisedCustomers(data);
        }).catch(err => console.warn('[Reports Supervised Custs Fetch]', err.message));
      }
    };

    fetchLiveTelemetry();
    const interval = setInterval(fetchLiveTelemetry, 6000);
    return () => clearInterval(interval);
  }, [userRole]);

  return (
    <ReportSystem
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
    />
  );
}
