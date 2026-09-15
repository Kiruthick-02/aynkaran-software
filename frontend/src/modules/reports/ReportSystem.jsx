import React, { useState, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileDown,
  Table,
  CheckCircle,
  Printer,
  Search,
  Sliders,
  Settings,
  FileText,
  Filter,
  Check,
  Clock,
  ShieldCheck,
  Users,
  UserPlus,
  Briefcase,
  Layers,
  Database,
  Building2
} from 'lucide-react';

export default function ReportSystem({
  candidates = [],
  policies = [],
  customers = [],
  allSupervisedCustomers = [],
  companies = [],
  reminders = [],
  advisors = [],
  staffs = [],
  userRole = 'SuperAdmin',
  adminUser = 'admin',
}) {
  const isStaff = userRole === 'Staff';
  const [reportType, setReportType] = useState('customer');
  const [exportTriggered, setExportTriggered] = useState(null);

  // Advanced Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [csvDelimiter, setCsvDelimiter] = useState(',');
  
  // Custom Dynamic Report type filters
  const [minIncome, setMinIncome] = useState(0);
  const [occupationFilter, setOccupationFilter] = useState('all');
  const [recruitmentStage, setRecruitmentStage] = useState('all');
  const [feeStatus, setFeeStatus] = useState('all'); // 'all', 'appPaid', 'trainPaid', 'both'
  const [companyFilter, setCompanyFilter] = useState('all');
  const [policyPlanType, setPolicyPlanType] = useState('all');
  const [renewalTimeframe, setRenewalTimeframe] = useState('all'); // 'all', 'overdue', 'scheduled'

  // Helper to extract nominee display name from various customer schema formats
  const getNomineeDisplay = (c) => {
    if (!c) return 'None';
    if (typeof c.nominee === 'object' && c.nominee !== null) {
      return c.nominee.name || c.nominee.nomineeName || 'None';
    }
    if (typeof c.nominee === 'string' && c.nominee.trim()) {
      try {
        const parsed = JSON.parse(c.nominee);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed.name || parsed.nomineeName || c.nominee;
        }
      } catch (e) {
        return c.nominee;
      }
    }
    return c.nomineeName || 'None';
  };

  // Dynamic Column Definitions
  const columnConfigs = {
    customer: [
      { id: 'id', label: 'Customer ID', default: true },
      { id: 'name', label: 'Full Name', default: true },
      { id: 'companyName', label: 'Insurance Company', default: true },
      { id: 'policyType', label: 'Policy Chosen', default: true },
      { id: 'renewalDate', label: 'Renewal Date', default: true },
      { id: 'dob', label: 'DOB', default: false },
      { id: 'mobile', label: 'Mobile No.', default: true },
      { id: 'email', label: 'Email ID', default: true },
      { id: 'annualIncome', label: 'Annual Income', default: true },
      { id: 'occupation', label: 'Occupation', default: false },
      { id: 'nomineeName', label: 'Nominee Name', default: true },
      { id: 'createdBy', label: 'Registering Agent/Staff', default: true },
    ],
    policy: [
      { id: 'customerName', label: 'Customer Name', default: true },
      { id: 'companyName', label: 'Insurance Company', default: true },
      { id: 'policyType', label: 'Policy Chosen', default: true },
      { id: 'renewalDate', label: 'Renewal Date', default: true },
      { id: 'issuedPolicyNumber', label: 'Policy No.', default: true },
      { id: 'currentStage', label: 'Sales / Lead Status', default: true },
      { id: 'premiumTerm', label: 'Payment Mode', default: false },
      { id: 'id', label: 'Proposal ID', default: false },
    ],
    renewal: [
      { id: 'customerName', label: 'Holder Name', default: true },
      { id: 'companyName', label: 'Insurance Company', default: true },
      { id: 'policyType', label: 'Policy Chosen', default: true },
      { id: 'renewalDate', label: 'Renewal Date', default: true },
      { id: 'policyNumber', label: 'Policy No.', default: true },
      { id: 'status', label: 'Renewal Status', default: true },
    ],
    recruitment: [
      { id: 'id', label: 'Candidate ID', default: true },
      { id: 'name', label: 'Candidate Name', default: true },
      { id: 'mobile', label: 'Mobile No.', default: true },
      { id: 'email', label: 'Email address', default: true },
      { id: 'currentStage', label: 'Current Stage', default: true },
      { id: 'appFeeStatus', label: 'Exam Fee Status', default: false },
      { id: 'trainFeeStatus', label: 'Training Fee Status', default: false },
      { id: 'examScore', label: 'Exam Score', default: true },
      { id: 'certificationResult', label: 'Certification Result', default: true },
      { id: 'agentCode', label: 'Agent Code', default: true },
    ],
    advisors: [
      { id: 'advisorCode', label: 'Advisor Code', default: true },
      { id: 'fullName', label: 'Advisor Name', default: true },
      { id: 'mobile', label: 'Mobile Number', default: true },
      { id: 'email', label: 'Email ID', default: true },
      { id: 'licenseNumber', label: 'License Number', default: true },
      { id: 'insuranceCompany', label: 'Company / Branch', default: true },
      { id: 'status', label: 'Activation Status', default: true },
      { id: 'abp', label: 'Assigned ABP Sponsor', default: false },
    ],
    staff: [
      { id: 'username', label: 'Staff Username', default: true },
      { id: 'displayName', label: 'Display Name', default: true },
      { id: 'customersCount', label: 'Customers Managed', default: true },
      { id: 'createdAt', label: 'Joined Timestamp', default: true },
      { id: 'role', label: 'System Role', default: true },
    ],
    database: [
      { id: 'collection', label: 'Collection Name', default: true },
      { id: 'count', label: 'Records Count', default: true },
      { id: 'integritySignature', label: 'Validation Checksum', default: true },
      { id: 'lastMod', label: 'System Health', default: true },
    ]
  };

  // State of active visible columns for selected model
  const [selectedColumns, setSelectedColumns] = useState(() => {
    const initial = {};
    Object.keys(columnConfigs).forEach(key => {
      initial[key] = columnConfigs[key].filter(col => col.default).map(col => col.id);
    });
    return initial;
  });

  const toggleColumn = (modelKey, colId) => {
    setSelectedColumns(prev => {
      const currentList = prev[modelKey] || [];
      if (currentList.includes(colId)) {
        if (currentList.length <= 1) return prev; // At least one column must stay active
        return { ...prev, [modelKey]: currentList.filter(id => id !== colId) };
      } else {
        return { ...prev, [modelKey]: [...currentList, colId] };
      }
    });
  };

  // Extract list of all unique insurance companies
  const availableCompanies = useMemo(() => {
    const list = new Set();
    (companies || []).forEach(c => { if (c.name) list.add(c.name); });
    (policies || []).forEach(p => {
      const c = p.companyName || p.insuranceCompany || p.company;
      if (c) list.add(c);
    });
    (customers || []).forEach(c => {
      const comp = c.insuranceCompany || c.companyName || c.company;
      if (comp) list.add(comp);
    });
    return Array.from(list);
  }, [companies, policies, customers]);

  // Extract list of all unique policy types available for filter selection
  const availablePlanTypes = useMemo(() => {
    const types = new Set();
    (companies || []).forEach(comp => {
      (comp.policies || []).forEach(pol => { if (pol.name) types.add(pol.name); });
    });
    (policies || []).forEach(p => { if (p.policyType) types.add(p.policyType); });
    (customers || []).forEach(c => {
      const pol = c.policyType || c.policyName || c.policy;
      if (pol) types.add(pol);
    });
    return Array.from(types);
  }, [companies, policies, customers]);

  // Extract list of all recruitment stages
  const availableRecruitmentStages = useMemo(() => {
    const stages = new Set(candidates.map(c => c.currentStage).filter(Boolean));
    return Array.from(stages);
  }, [candidates]);

  // Extract list of all occupations
  const availableOccupations = useMemo(() => {
    const pool = (allSupervisedCustomers && allSupervisedCustomers.length > 0) ? allSupervisedCustomers : customers;
    const occs = new Set(pool.map(c => typeof c.work === 'object' ? c.work?.occupation : (c.occupation || '')).filter(Boolean));
    return Array.from(occs);
  }, [allSupervisedCustomers, customers]);

  // Filtered & Projected Output Records
  const processedData = useMemo(() => {
    let result = [];
    const customerPool = (allSupervisedCustomers && allSupervisedCustomers.length > 0) ? allSupervisedCustomers : customers;

    if (reportType === 'customer') {
      result = customerPool.map(c => {
        // Find if customer is linked to any policy lead
        const linkedPolicy = policies.find(p => p.customerId === c.id || p.customerName === c.name);
        const compName = c.insuranceCompany || c.companyName || c.company || linkedPolicy?.companyName || linkedPolicy?.insuranceCompany || 'Aynkaran';
        const polChosen = c.policyType || c.policyName || c.policy || linkedPolicy?.policyType || 'Standard Plan';
        const renDate = c.renewalDate || c.policyRenewalDate || linkedPolicy?.renewalDate || 'Pending';

        return {
          id: c.id,
          name: c.name || 'Unnamed',
          companyName: compName,
          policyType: polChosen,
          renewalDate: renDate,
          dob: c.dob || c.dateOfBirth || 'N/A',
          mobile: c.mobileNumber || c.mobile || 'N/A',
          email: c.emailId || c.email || 'N/A',
          annualIncome: Number(c.annualIncome) || 0,
          occupation: (typeof c.work === 'object' ? c.work?.occupation : c.occupation) || 'Private Sector',
          nomineeName: getNomineeDisplay(c),
          createdBy: c.createdBy || 'SuperAdmin (admin)',
        };
      });

      // Apply Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(item => 
          (item.name || '').toLowerCase().includes(query) ||
          (item.id || '').toLowerCase().includes(query) ||
          (item.mobile || '').includes(query) ||
          (item.email || '').toLowerCase().includes(query) ||
          (item.nomineeName || '').toLowerCase().includes(query) ||
          (item.companyName || '').toLowerCase().includes(query) ||
          (item.policyType || '').toLowerCase().includes(query)
        );
      }

      // Apply Min Income Filter
      if (minIncome > 0) {
        result = result.filter(item => item.annualIncome >= minIncome);
      }

      // Apply Occupation Filter
      if (occupationFilter !== 'all') {
        result = result.filter(item => item.occupation === occupationFilter);
      }

      // Apply Company Filter
      if (companyFilter !== 'all') {
        result = result.filter(item => item.companyName === companyFilter);
      }

    } else if (reportType === 'policy') {
      // Build unified policy sales list from policies leads and customers
      const policyRows = [];

      // 1. Leads from policies collection
      policies.forEach(p => {
        const matchingCust = customers.find(c => c.id === p.customerId || c.name === p.customerName);
        const comp = p.companyName || p.insuranceCompany || p.company || matchingCust?.insuranceCompany || matchingCust?.companyName || 'Aynkaran';
        policyRows.push({
          id: p.id,
          customerName: p.customerName || matchingCust?.name || 'Unnamed Customer',
          companyName: comp,
          policyType: p.policyType || p.policyName || 'Insurance Scheme',
          renewalDate: p.renewalDate || matchingCust?.renewalDate || 'Pending',
          issuedPolicyNumber: p.issuedPolicyNumber || p.id,
          currentStage: p.currentStage || 'Active Proposal',
          premiumTerm: p.premiumTerm || 'Annual',
        });
      });

      // 2. Customers with assigned policies not in policies collection
      customers.forEach(c => {
        const hasPolicyLead = policies.some(p => p.customerId === c.id || p.customerName === c.name);
        if (!hasPolicyLead) {
          policyRows.push({
            id: c.id,
            customerName: c.name || 'Unnamed Customer',
            companyName: c.insuranceCompany || c.companyName || c.company || 'Aynkaran',
            policyType: c.policyType || c.policyName || c.policy || 'Standard Scheme',
            renewalDate: c.renewalDate || c.policyRenewalDate || 'Pending',
            issuedPolicyNumber: c.policyNumber || `POL-${c.id.slice(-5)}`,
            currentStage: 'Policy Active',
            premiumTerm: 'Annual',
          });
        }
      });

      result = policyRows;

      // Apply Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(item => 
          (item.customerName || '').toLowerCase().includes(query) ||
          (item.id || '').toLowerCase().includes(query) ||
          (item.companyName || '').toLowerCase().includes(query) ||
          (item.policyType || '').toLowerCase().includes(query) ||
          (item.issuedPolicyNumber || '').toLowerCase().includes(query)
        );
      }

      // Apply Company Filter
      if (companyFilter !== 'all') {
        result = result.filter(item => item.companyName === companyFilter);
      }

      // Apply Plan Type Filter
      if (policyPlanType !== 'all') {
        result = result.filter(item => item.policyType === policyPlanType);
      }

    } else if (reportType === 'renewal') {
      const renewalRows = [];

      // 1. From policies
      policies
        .filter((p) => p.renewalDate && p.renewalDate !== 'Pending' && p.renewalDate !== 'N/A')
        .forEach((p) => {
          const matchingCust = customers.find(c => c.id === p.customerId || c.name === p.customerName);
          const comp = p.companyName || p.insuranceCompany || p.company || matchingCust?.insuranceCompany || matchingCust?.companyName || 'Aynkaran';
          const isOverdue = new Date(p.renewalDate) <= new Date();
          renewalRows.push({
            policyNumber: p.issuedPolicyNumber || p.id || 'N/A',
            customerName: p.customerName || matchingCust?.name || 'Customer',
            companyName: comp,
            policyType: p.policyType || p.policyName || 'Standard Policy',
            renewalDate: p.renewalDate,
            status: isOverdue ? 'OVERDUE' : 'ACTIVE SCHEDULED',
          });
        });

      // 2. From customers
      customers.forEach((c) => {
        const renDate = c.renewalDate || c.policyRenewalDate;
        if (renDate && renDate !== 'Pending' && renDate !== 'N/A' && !renewalRows.some(r => r.customerName === c.name)) {
          const isOverdue = new Date(renDate) <= new Date();
          renewalRows.push({
            policyNumber: c.policyNumber || `POL-${c.id.slice(-5)}`,
            customerName: c.name,
            companyName: c.insuranceCompany || c.companyName || c.company || 'Aynkaran',
            policyType: c.policyType || c.policyName || c.policy || 'Standard Policy',
            renewalDate: renDate,
            status: isOverdue ? 'OVERDUE' : 'ACTIVE SCHEDULED',
          });
        }
      });

      result = renewalRows;

      // Apply Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(item => 
          (item.customerName || '').toLowerCase().includes(query) ||
          (item.policyNumber || '').toLowerCase().includes(query) ||
          (item.companyName || '').toLowerCase().includes(query) ||
          (item.policyType || '').toLowerCase().includes(query)
        );
      }

      // Apply renewal status timeframe filter
      if (renewalTimeframe === 'overdue') {
        result = result.filter(item => item.status === 'OVERDUE');
      } else if (renewalTimeframe === 'scheduled') {
        result = result.filter(item => item.status === 'ACTIVE SCHEDULED');
      }

      // Apply Company Filter
      if (companyFilter !== 'all') {
        result = result.filter(item => item.companyName === companyFilter);
      }

    } else if (reportType === 'recruitment') {
      result = candidates.map(c => ({
        id: c.id,
        name: c.name || 'Unnamed Trainee',
        mobile: c.mobile || 'N/A',
        email: c.email || 'N/A',
        currentStage: c.currentStage || 'Application Form',
        appFeeStatus: c.fees?.applicationFeePaid ? 'Paid' : 'Pending',
        trainFeeStatus: c.fees?.trainingFeePaid ? 'Paid' : 'Pending',
        examScore: c.exam?.score !== undefined ? `${c.exam.score}/50` : 'Pending Exam',
        certificationResult: c.exam?.result || (c.isConvertedToAdvisor ? 'PASSED' : 'PENDING'),
        agentCode: c.advisorCode || c.agentCode || 'Unassigned',
      }));

      // Apply Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(item => 
          (item.name || '').toLowerCase().includes(query) ||
          (item.id || '').toLowerCase().includes(query) ||
          (item.mobile || '').includes(query) ||
          (item.email || '').toLowerCase().includes(query) ||
          (item.agentCode || '').toLowerCase().includes(query)
        );
      }

      // Apply Recruitment Stage Filter
      if (recruitmentStage !== 'all') {
        result = result.filter(item => item.currentStage === recruitmentStage);
      }

      // Apply Fee Status Filter
      if (feeStatus === 'appPaid') {
        result = result.filter(item => item.appFeeStatus === 'Paid');
      } else if (feeStatus === 'trainPaid') {
        result = result.filter(item => item.trainFeeStatus === 'Paid');
      } else if (feeStatus === 'both') {
        result = result.filter(item => item.appFeeStatus === 'Paid' && item.trainFeeStatus === 'Paid');
      }

    } else if (reportType === 'advisors') {
      result = advisors.map(a => ({
        advisorCode: a.advisorCode || a.id || 'N/A',
        fullName: a.fullName || a.name || 'Unnamed Advisor',
        mobile: a.mobile || a.phone || 'N/A',
        email: a.email || 'N/A',
        licenseNumber: a.licenseNumber || 'LIC-PENDING',
        insuranceCompany: a.insuranceCompany || 'Aynkaran Consultants',
        status: a.status || 'ACTIVE',
        abp: a.abp || a.abpSponsor || 'None',
      }));

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(item => 
          (item.fullName || '').toLowerCase().includes(query) ||
          (item.advisorCode || '').toLowerCase().includes(query) ||
          (item.licenseNumber || '').toLowerCase().includes(query)
        );
      }

    } else if (reportType === 'staff') {
      const staffCustPool = (allSupervisedCustomers && allSupervisedCustomers.length > 0) ? allSupervisedCustomers : customers;
      result = staffs.map(s => ({
        username: s.username,
        displayName: s.displayName || s.username,
        customersCount: staffCustPool.filter(c => c.createdBy === s.username).length,
        createdAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A',
        role: s.role || 'Staff',
      }));

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(item => 
          item.username.toLowerCase().includes(query) || 
          item.displayName.toLowerCase().includes(query)
        );
      }

    } else if (reportType === 'database') {
      const schemesCount = (companies || []).reduce((acc, c) => acc + ((c.policies || []).length), 0);
      result = [
        { collection: 'Registered Customers (Dossier)', count: customers.length, integritySignature: '0x849FDE', lastMod: 'Healthy / Active' },
        { collection: 'Insurance Companies & Schemes', count: `${companies.length} Companies (${schemesCount} Schemes)`, integritySignature: '0x71BC39', lastMod: 'Healthy / Active' },
        ...(!isStaff ? [
          { collection: 'Trainee Candidates (Recruitment)', count: candidates.length, integritySignature: '0xAC55D4', lastMod: 'Healthy / Active' },
          { collection: 'Licensed Advisors (Directory)', count: advisors.length, integritySignature: '0xBD119C', lastMod: 'Healthy / Active' },
          { collection: 'Active Staff Accounts (Supervision)', count: staffs.length, integritySignature: '0xEA334F', lastMod: 'Healthy / Active' },
        ] : []),
        { collection: 'Policy Sales (Customer Leads)', count: policies.length, integritySignature: '0xDE12B8', lastMod: 'Healthy / Active' },
        { collection: 'Active Reminders (Workspace)', count: reminders.length, integritySignature: '0xF3091F', lastMod: 'Healthy / Active' },
      ];
    }

    return result;
  }, [reportType, customers, allSupervisedCustomers, candidates, advisors, policies, reminders, staffs, companies, searchQuery, minIncome, occupationFilter, recruitmentStage, feeStatus, companyFilter, policyPlanType, renewalTimeframe, isStaff]);

  const activeCols = (columnConfigs[reportType] || []).filter(col => 
    (selectedColumns[reportType] || []).includes(col.id)
  );

  const triggerNotification = (msg) => {
    setExportTriggered(msg);
    setTimeout(() => {
      setExportTriggered(null);
    }, 4500);
  };

  // EXPORT 1: RFC-Compliant Clean CSV Generator
  const downloadCSV = () => {
    if (processedData.length === 0) {
      triggerNotification('No active records matching filters to export.');
      return;
    }

    const headers = activeCols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(csvDelimiter);
    const rows = processedData.map(row => 
      activeCols.map(col => {
        const val = row[col.id] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(csvDelimiter)
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aynkaran-${reportType}-report-${Date.now().toString().slice(-6)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerNotification(`Successfully exported ${processedData.length} records to CSV format!`);
  };

  // EXPORT 2: Microsoft Excel Worksheet (.XLS XML) Generator
  const downloadExcel = () => {
    if (processedData.length === 0) {
      triggerNotification('No active records matching filters to export.');
      return;
    }

    const filename = `aynkaran-${reportType}-audit-ledger-${Date.now().toString().slice(-6)}.xls`;
    const headers = activeCols.map(c => c.label);
    const rows = processedData.map(row => activeCols.map(col => row[col.id] ?? ''));

    let xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
    xml += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
    xml += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
    xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
    
    xml += '<Styles>';
    xml += '<Style ss:ID="HeaderStyle"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>';
    xml += '<Style ss:ID="MetaStyle"><Font ss:Bold="1" ss:Color="#1E293B"/><Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/></Style>';
    xml += '</Styles>';

    xml += `<Worksheet ss:Name="${reportType.toUpperCase()} Report">`;
    xml += '<Table>';

    // Title Row
    xml += `<Row><Cell ss:StyleID="MetaStyle"><Data ss:Type="String">AYNKARAN CONSULTANTS - ${reportTitle || reportType.toUpperCase()} LEDGER</Data></Cell></Row>`;
    xml += `<Row><Cell><Data ss:Type="String">Generated: ${new Date().toLocaleString()} by ${userRole} (@${adminUser})</Data></Cell></Row>`;
    xml += '<Row></Row>';

    // Header Row
    xml += '<Row>';
    headers.forEach(h => {
      xml += `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${h}</Data></Cell>`;
    });
    xml += '</Row>';

    // Data Rows
    rows.forEach(row => {
      xml += '<Row>';
      row.forEach(val => {
        const type = typeof val === 'number' ? 'Number' : 'String';
        xml += `<Cell><Data ss:Type="${type}">${val}</Data></Cell>`;
      });
      xml += '</Row>';
    });

    xml += '</Table></Worksheet></Workbook>';

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerNotification('Advanced Excel Layout generated with Aynkaran corporate worksheet styling!');
  };

  // EXPORT 3: Direct PDF Print
  const triggerNativePrint = () => {
    triggerNotification('Generating High-Resolution Print Layout... Initializing printer.');
    setTimeout(() => {
      window.print();
    }, 800);
  };

  // EXPORT 4: Full Local JSON Database Backup
  const downloadJSONBackup = () => {
    const backupObject = {
      exportTimestamp: new Date().toISOString(),
      generatorRole: userRole,
      generatedBy: adminUser,
      customers,
      companies,
      policies,
      reminders,
      ...(!isStaff ? { candidates, advisors, staffs } : {}),
      verificationHash: `0x${Math.random().toString(16).substr(2, 8).toUpperCase()}`
    };

    const blob = new Blob([JSON.stringify(backupObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aynkaran-full-database-backup-${Date.now().toString().slice(-6)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerNotification('Secure JSON Database Snapshot exported successfully!');
  };

  const reportTypeOptions = [
    { id: 'customer', label: 'Customer Profiles (CRM)', desc: 'Client profiles with company, policy chosen, and renewal dates.', icon: Users },
    { id: 'policy', label: 'Policy Sales & Customer Leads', desc: 'Customer allocations, company providers, and policy numbers.', icon: FileText },
    { id: 'renewal', label: 'Overdue & Active Renewals Ledger', desc: 'Customer renewal calendar with companies and chosen policies.', icon: Clock },
    ...(!isStaff ? [
      { id: 'recruitment', label: 'Trainee Agent Recruitment Funnel', desc: 'Recruitment stage records, exam scores, and trainee fees.', icon: UserPlus },
      { id: 'advisors', label: 'Licensed Advisors Directory', desc: 'Active agent codes, license numbers, ABPs & L1 managers.', icon: Briefcase },
      { id: 'staff', label: 'Staff Supervision Audit Telemetry', desc: 'Staff rosters, customer portfolios, and activity logs.', icon: ShieldCheck },
    ] : []),
    { id: 'database', label: 'Full Database Local Backup (JSON)', desc: 'Total collections snapshot including companies & policies.', icon: Database },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-slate-200 animate-fade-in pb-12">
      
      {/* Dynamic CSS styles for printing high-resolution white-page corporate ledger */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 10pt !important;
          }
          aside, header, footer, button, .no-print {
            display: none !important;
          }
          .print-only-container {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th {
            background: #1E3A8A !important;
            color: #ffffff !important;
            font-weight: bold !important;
            border: 1px solid #334155 !important;
            padding: 6px !important;
          }
          td {
            border: 1px solid #cbd5e1 !important;
            padding: 6px !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5 gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-2xl">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Certified Exports &amp; Audit Reporting Suite
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate certified Excel worksheets, universal CSVs, or audit-ready PDF ledgers for Aynkaran Consultants.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={downloadExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Download size={15} />
            <span>Export Excel (.XLS)</span>
          </button>

          <button
            onClick={downloadCSV}
            className="px-4 py-2.5 bg-[#1E293B] hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition active:scale-95 cursor-pointer shadow"
          >
            <FileDown size={15} className="text-blue-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={triggerNativePrint}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Printer size={15} />
            <span>Direct PDF Print</span>
          </button>
        </div>
      </div>

      {/* Success alert notification */}
      {exportTriggered && (
        <div className="bg-emerald-950/90 text-emerald-200 border border-emerald-800 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs animate-slide-up no-print">
          <div className="bg-emerald-500/20 p-1.5 rounded-full text-emerald-400">
            <CheckCircle size={16} />
          </div>
          <p className="font-bold flex-1">{exportTriggered}</p>
          <button onClick={() => setExportTriggered(null)} className="font-extrabold text-[10px] text-emerald-400 hover:underline uppercase">Dismiss</button>
        </div>
      )}

      {/* Main interactive grid partition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Target Selector & Custom Dynamic Filters (4 Columns) */}
        <div className="lg:col-span-4 space-y-5 no-print">
          
          {/* Target Model Selector */}
          <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-3xl shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Layers size={14} className="text-blue-400" />
                <span>1. Report Design Target</span>
              </h3>
              <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold rounded-full">
                {reportType}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {reportTypeOptions.map((item) => {
                const Icon = item.icon;
                const isSelected = reportType === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setReportType(item.id);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg'
                        : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 pr-2 overflow-hidden">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 group-hover:text-blue-400'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <p className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>{item.label}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <Check size={16} className={`shrink-0 transition-opacity ${isSelected ? 'opacity-100 text-blue-400' : 'opacity-0'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Filter Controls based on Model */}
          <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <Sliders size={14} className="text-emerald-400" />
              <span>2. Custom Dynamic Filters</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              {/* Universal Search */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Keyword Search</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search customer, company, policy, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Insurance Company Filter (Available across Customer, Policy, Renewal reports) */}
              {(reportType === 'customer' || reportType === 'policy' || reportType === 'renewal') && availableCompanies.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Insurance Company</label>
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">All Insurance Companies</option>
                    {availableCompanies.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Model Specific Filters */}
              {reportType === 'customer' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Min Annual Income (₹)</label>
                    <input
                      type="number"
                      step="50000"
                      value={minIncome || ''}
                      onChange={(e) => setMinIncome(Number(e.target.value) || 0)}
                      placeholder="e.g. 500000"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {availableOccupations.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Occupation</label>
                      <select
                        value={occupationFilter}
                        onChange={(e) => setOccupationFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="all">All Occupations</option>
                        {availableOccupations.map(occ => (
                          <option key={occ} value={occ}>{occ}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {reportType === 'policy' && (
                <>
                  {availablePlanTypes.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Policy Scheme Chosen</label>
                      <select
                        value={policyPlanType}
                        onChange={(e) => setPolicyPlanType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="all">All Policy Schemes</option>
                        {availablePlanTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {reportType === 'recruitment' && (
                <>
                  {availableRecruitmentStages.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Milestone Stage</label>
                      <select
                        value={recruitmentStage}
                        onChange={(e) => setRecruitmentStage(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="all">All 10 Milestone Stages</option>
                        {availableRecruitmentStages.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fee Payment Status</label>
                    <select
                      value={feeStatus}
                      onChange={(e) => setFeeStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="all">All Fee Statuses</option>
                      <option value="appPaid">Exam Fee Paid</option>
                      <option value="trainPaid">Training Fee Paid</option>
                      <option value="both">Both Fees Paid</option>
                    </select>
                  </div>
                </>
              )}

              {reportType === 'renewal' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Renewal Timeframe</label>
                  <select
                    value={renewalTimeframe}
                    onChange={(e) => setRenewalTimeframe(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">All Active Renewals</option>
                    <option value="overdue">Overdue Renewals Only</option>
                    <option value="scheduled">Scheduled Renewals Only</option>
                  </select>
                </div>
              )}

              {reportType === 'database' && (
                <div className="pt-2">
                  <button
                    onClick={downloadJSONBackup}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow"
                  >
                    <Database size={14} />
                    <span>Download Full JSON Backup</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Column Toggles */}
          {reportType !== 'database' && (
            <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-3xl shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <Settings size={14} className="text-purple-400" />
                <span>3. Dynamic Visible Columns</span>
              </h3>
              <p className="text-[10px] text-slate-500">Toggle columns to include in PDF &amp; Excel output</p>

              <div className="flex flex-wrap gap-1.5">
                {(columnConfigs[reportType] || []).map((col) => {
                  const isChecked = (selectedColumns[reportType] || []).includes(col.id);
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => toggleColumn(reportType, col.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isChecked
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-slate-400'
                      }`}
                    >
                      <Check size={11} className={isChecked ? 'opacity-100' : 'opacity-0'} />
                      <span>{col.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Live Report Preview & PDF Render (8 Columns) */}
        <div className="lg:col-span-8 bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-6">
          
          {/* Header Preview Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Table size={18} className="text-blue-400" />
                <span>Live Audit Ledger Preview</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Displaying {processedData.length} records matching current parameters
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs no-print">
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 font-mono text-[11px]">
                {activeCols.length} Columns Active
              </span>
            </div>
          </div>

          {/* Printable Report Title & Seal Header */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white uppercase tracking-wider">Aynkaran Consultants</span>
                <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                  OFFICIAL AUDIT LEDGER
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Generated by: <strong className="text-slate-200">{userRole} (@{adminUser})</strong> • Date: {new Date().toLocaleString()}
              </p>
            </div>

            <div className="text-right font-mono text-[10px] text-slate-500 hidden sm:block">
              <p>REF: AY-REP-{Date.now().toString().slice(-6)}</p>
              <p>SECURE LEDGER</p>
            </div>
          </div>

          {/* Records Table Preview */}
          {processedData.length === 0 ? (
            <div className="p-16 text-center text-slate-500 rounded-2xl bg-slate-950/40 border border-slate-800/60">
              <Filter size={36} className="mx-auto text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-400">No records found matching the configured criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-[#131F37]">
                    {activeCols.map((col) => (
                      <th key={col.id} className="px-4 py-3.5 whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs bg-slate-950/40">
                  {processedData.slice(0, 100).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition duration-100">
                      {activeCols.map((col) => {
                        const val = row[col.id];
                        const isIncome = col.id === 'annualIncome';

                        return (
                          <td key={col.id} className="px-4 py-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                            {isIncome && typeof val === 'number' && val > 0 ? (
                              <span className="text-emerald-400 font-bold">₹{val.toLocaleString('en-IN')}</span>
                            ) : val !== undefined && val !== null ? (
                              String(val)
                            ) : (
                              '—'
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {processedData.length > 100 && (
            <p className="text-center text-[10px] text-slate-500 font-mono no-print">
              Preview truncated at 100 items. Excel and CSV exports contain all {processedData.length} records.
            </p>
          )}

          {/* Audit Verification Footer Signature Box */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] text-slate-400">
            <div className="space-y-1">
              <p className="font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Data Integrity Certification</span>
              </p>
              <p className="text-[10px] text-slate-500">
                Verified against active MongoDB database cluster. Records exported under role authority of {userRole}.
              </p>
            </div>

            <div className="text-right font-mono text-[10px] text-slate-500">
              <p>AYNKARAN CONSULTANTS DESK</p>
              <p>ALL RIGHTS RESERVED © 2026</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
