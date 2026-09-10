// frontend/src/modules/advisor/AdvisorManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, BookOpen, Award, Building, Bell, FileText, Search,
  Plus, Eye, ShieldCheck, Mail, Phone, MapPin, Sparkles, Check, X,
  Clock, Download, AlertCircle, ShieldAlert, Key, Filter, ExternalLink,
  ChevronRight, ArrowUpRight, TrendingUp, RefreshCw, Send, FastForward,
  RotateCcw, CheckCircle2, ChevronDown, ChevronUp, Edit3, Camera, Upload, Inbox, Trash2
} from 'lucide-react';
import { advisorApi } from '../../services/advisorApi';
import API_URL from '../../config/api';
import AdvisorProfile from './AdvisorProfile';
import CandidateConversionModal from './CandidateConversionModal';
import DocumentPreviewModal from './DocumentPreviewModal';
import AdvisorStatusModal from './AdvisorStatusModal';
import OtpVerificationModal from './OtpVerificationModal';
import AdvisorMilestoneTimeline from './AdvisorMilestoneTimeline';
import EditCandidateModal from './EditCandidateModal';
import { validateCandidateFields } from './candidateValidation';

export default function AdvisorManagement({
  candidates = [],
  programs = [],
  exams = [],
  advisors = [],
  onAddCandidate,
  onUpdateCandidate,
  onDeleteCandidate,
  onAddProgram,
  onUpdateProgram,
  onAddExam,
  onAddAdvisor,
  onShowNotification,
  initialEnquiry = null
}) {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('ayn_advisor_management_tab') || 'advisors');
  const [selectedAdvisorId, setSelectedAdvisorId] = useState(null);

  useEffect(() => {
    localStorage.setItem('ayn_advisor_management_tab', activeTab);
  }, [activeTab]);

  // Top Dashboard Aggregate KPIs
  const [dashboardStats, setDashboardStats] = useState(null);
  const [hierarchyOptions, setHierarchyOptions] = useState({ abps: [], level1Managers: [] });

  // Advisors List Search & Filter State
  const [advisorList, setAdvisorList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterAbp, setFilterAbp] = useState('All');
  const [filterL1, setFilterL1] = useState('All');
  const [isLoadingAdvisors, setIsLoadingAdvisors] = useState(false);
  const [advisorEnquiries, setAdvisorEnquiries] = useState([]);
  const [isLoadingAdvisorEnquiries, setIsLoadingAdvisorEnquiries] = useState(false);
  const [advisorEnquirySearch, setAdvisorEnquirySearch] = useState('');
  const [selectedAdvisorEnquiry, setSelectedAdvisorEnquiry] = useState(null);

  // Selected candidate for viewing roadmap (persisted across page refresh)
  const [selectedCandidateId, setSelectedCandidateId] = useState(() => {
    return localStorage.getItem('ayn_selected_candidate_id') || null;
  });
  const [deleteCandidateTarget, setDeleteCandidateTarget] = useState(null);
  const [deleteAdvisorTarget, setDeleteAdvisorTarget] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');

  // Modals state
  const [conversionCandidate, setConversionCandidate] = useState(null);
  const [statusModalAdvisor, setStatusModalAdvisor] = useState(null);
  const [previewDocFile, setPreviewDocFile] = useState(null);
  const [previewDocCategory, setPreviewDocCategory] = useState('');
  const [previewTargetId, setPreviewTargetId] = useState('');
  const [previewTargetType, setPreviewTargetType] = useState('candidate');
  
  // OTP Modal State for Bulk Communications Only
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpActionDetails, setOtpActionDetails] = useState({ title: '', type: '', data: null });

  // Candidate Registration & Edit Modal
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [showEditCandidateModal, setShowEditCandidateModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [candPhotoFile, setCandPhotoFile] = useState(null);
  const [candPhotoPreview, setCandPhotoPreview] = useState(null);
  const [candName, setCandName] = useState('');
  const [candMobile, setCandMobile] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candCity, setCandCity] = useState('Chennai');
  const [candCompany, setCandCompany] = useState('SBI Life Insurance');
  const [candDob, setCandDob] = useState('1998-05-12');
  const [candGender, setCandGender] = useState('Male');
  const [candQual, setCandQual] = useState('Graduate');
  const [candAddress, setCandAddress] = useState('');

  // Bulk Message State
  const [bulkChannel, setBulkChannel] = useState('WHATSAPP');
  const [bulkMessage, setBulkMessage] = useState('Dear Advisor, please ensure your pending policy files and renewal reminders are reviewed.');

  // Load KPIs, hierarchy, and advisors
  const fetchDashboardData = async () => {
    try {
      const statsRes = await advisorApi.getDashboardStats();
      if (statsRes.success) setDashboardStats(statsRes.stats);
    } catch (err) {
      console.warn('[Dashboard Stats Error]', err.message);
    }

    try {
      const hierRes = await advisorApi.getHierarchyOptions();
      if (hierRes.success) {
        setHierarchyOptions({
          abps: hierRes.abps || [],
          level1Managers: hierRes.level1Managers || []
        });
      }
    } catch (err) {
      console.warn('[Hierarchy Options Error]', err.message);
    }
  };

  const fetchAdvisorsList = async () => {
    setIsLoadingAdvisors(true);
    try {
      const data = await advisorApi.getAdvisors({
        search: searchQuery,
        status: filterStatus,
        abp: filterAbp,
        level1Manager: filterL1
      });
      setAdvisorList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Fetch Advisors Error]', err);
    } finally {
      setIsLoadingAdvisors(false);
    }
  };

  const loadAdvisorEnquiries = async () => {
    setIsLoadingAdvisorEnquiries(true);
    try {
      const response = await fetch(`${API_URL}/api/enquiries?type=advisor`);
      if (!response.ok) throw new Error('Unable to load advisor enquiries');
      const data = await response.json();
      setAdvisorEnquiries(Array.isArray(data) ? data : data.enquiries || []);
    } catch (error) {
      console.warn('[Advisor Enquiries]', error.message);
      onShowNotification?.('Unable to load advisor enquiries.');
    } finally {
      setIsLoadingAdvisorEnquiries(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'advisors') {
      fetchAdvisorsList();
    }
  }, [activeTab, searchQuery, filterStatus, filterAbp, filterL1]);

  useEffect(() => {
    if (activeTab === 'enquiries') loadAdvisorEnquiries();
  }, [activeTab]);

  useEffect(() => {
    if (initialEnquiry) {
      setActiveTab('enquiries');
      setSelectedAdvisorEnquiry(initialEnquiry);
    }
  }, [initialEnquiry]);

  // Maintain selected candidate across loads and sync with localStorage
  useEffect(() => {
    if (selectedCandidateId) {
      localStorage.setItem('ayn_selected_candidate_id', selectedCandidateId);
    }
  }, [selectedCandidateId]);

  useEffect(() => {
    if (candidates.length > 0) {
      const savedId = localStorage.getItem('ayn_selected_candidate_id');
      const candidateExists = candidates.some(c => c.id === savedId);
      if (candidateExists) {
        setSelectedCandidateId(savedId);
      } else if (!selectedCandidateId || !candidates.some(c => c.id === selectedCandidateId)) {
        setSelectedCandidateId(candidates[0].id);
      }
    }
  }, [candidates]);

  // Actively selected candidate for timeline progression
  const activeCandidate = candidates.find(c => c.id === selectedCandidateId) || (candidates.length > 0 ? candidates[0] : null);

  // Handle Candidate Registration Submit
  const handleCandidateRegister = async (e) => {
    e.preventDefault();
    const validationError = validateCandidateFields({
      name: candName,
      mobile: candMobile,
      email: candEmail,
      address: candAddress,
      city: candCity
    });
    if (validationError) {
      if (onShowNotification) onShowNotification(validationError);
      return;
    }

    const candId = `cand-${Date.now().toString().slice(-6)}`;
    let photoPath = '';
    let uploadedPhotoDocument = null;

    if (candPhotoFile) {
      try {
        const uploadRes = await advisorApi.uploadAdvisorDocument(candPhotoFile, 'Passport Size Photo', candId, 'candidate');
        if (uploadRes && (uploadRes.url || uploadRes.path)) {
          photoPath = uploadRes.url || uploadRes.path;
          uploadedPhotoDocument = uploadRes.document || null;
        }
      } catch (uploadErr) {
        console.warn('[Upload Photo Err on registration]', uploadErr);
      }
    }

    const newCandidate = {
      id: candId,
      name: candName.trim(),
      mobile: candMobile.trim(),
      email: candEmail.trim() || 'trainee@gmail.com',
      city: candCity || 'Chennai',
      insuranceCompany: candCompany,
      dateOfBirth: candDob,
      gender: candGender,
      qualification: candQual,
      address: candAddress || 'Chennai',
      documents: photoPath ? [{
        ...(uploadedPhotoDocument || {}),
        id: uploadedPhotoDocument?.id || `doc-${Date.now()}`,
        name: candPhotoFile?.name || 'Passport Size Photo',
        fileName: candPhotoFile?.name || 'Passport Size Photo',
        category: 'Passport Size Photo',
        path: photoPath,
        url: photoPath,
        verificationStatus: 'PENDING',
        uploadedAt: new Date().toISOString()
      }] : [],
      photoUrl: photoPath,
      profilePicture: photoPath,
      passportPhoto: photoPath,
      passportPhotoUrl: photoPath,
      trainingStatus: 'Not Started',
      examStatus: 'Pending',
      eligibility: 'Pending',
      currentStage: 'Candidate Registered',
      stageNumber: 1,
      candidateRegistrationDate: new Date().toISOString().split('T')[0],
      pendingStageSince: new Date().toISOString().split('T')[0]
    };

    if (onAddCandidate) {
      await onAddCandidate(newCandidate);
    }
    if (onShowNotification) {
      onShowNotification(`Trainee candidate "${candName}" registered successfully.`);
    }

    setShowAddCandidateModal(false);
    setCandName('');
    setCandMobile('');
    setCandEmail('');
    setCandAddress('');
    setCandPhotoFile(null);
    setCandPhotoPreview(null);
  };

  // Convert candidate button click
  const handleOpenConversion = (cand) => {
    setConversionCandidate(cand);
  };

  // MANUALLY PROGRESS CANDIDATE MILESTONES (17-Stage Controlled Workflow)
  const handleProgressCandidateMilestone = async (candId, targetStageNumber, nextStageNumber, stageName, payload = {}) => {
    const cand = candidates.find(c => c.id === candId);
    if (!cand) return;

    const finalNextStage = nextStageNumber || (targetStageNumber + 1);
    const updatedFields = {
      stageNumber: finalNextStage,
      currentStage: stageName || `Stage ${finalNextStage}`,
      pendingStageSince: new Date().toISOString().split('T')[0],
      trainingStatus: finalNextStage >= 6 ? 'Completed' : (finalNextStage >= 4 ? 'In Progress' : (finalNextStage >= 3 ? 'Scheduled' : 'Not Started')),
      examStatus: finalNextStage >= 10 ? 'Passed' : (finalNextStage >= 8 ? 'Scheduled' : (finalNextStage >= 7 ? 'Registered' : 'Pending')),
      result: finalNextStage >= 10 ? 'Pass' : 'Pending',
      eligibility: finalNextStage >= 11 ? 'Eligible' : 'Pending',
      eligibilityDate: finalNextStage >= 11 ? new Date().toISOString().split('T')[0] : undefined
    };

    if (payload?.stageData) {
      updatedFields.stageData = {
        ...(cand.stageData || {}),
        [targetStageNumber]: payload.stageData,
        ...payload.stageData
      };
      Object.assign(updatedFields, payload.stageData);
    }

    if (payload?.uploadedDocument) {
      const existingDocs = Array.isArray(cand.documents)
        ? cand.documents
        : (typeof cand.documents === 'string' ? JSON.parse(cand.documents || '[]') : []);
      const docCatName = payload.uploadedDocument.category || payload.uploadedDocument.name;
      const filtered = existingDocs.filter(d => (d.category || d.name) !== docCatName);
      const newDoc = {
        ...payload.uploadedDocument,
        verificationStatus: payload.uploadedDocument.verificationStatus || 'PENDING'
      };
      updatedFields.documents = [...filtered, newDoc];
      const docCat = (docCatName || '').toLowerCase();
      const docUrl = payload.uploadedDocument.url || payload.uploadedDocument.path;
      if (docCat.includes('photo') || docCat.includes('passport') || docCat.includes('profile')) {
        updatedFields.photoUrl = docUrl;
        updatedFields.profilePicture = docUrl;
        updatedFields.passportPhoto = docUrl;
      } else if (docCat.includes('aadhaar')) {
        updatedFields.aadhaarUrl = docUrl;
      } else if (docCat.includes('pan')) {
        updatedFields.panUrl = docUrl;
      } else if (docCat.includes('bank') || docCat.includes('passbook') || docCat.includes('cheque')) {
        updatedFields.bankProofUrl = docUrl;
      } else if (docCat.includes('education') || docCat.includes('marksheet') || docCat.includes('certificate')) {
        updatedFields.marksheetUrl = docUrl;
      } else if (docCat.includes('signature')) {
        updatedFields.signatureUrl = docUrl;
      }
    }

    if (onUpdateCandidate) {
      await onUpdateCandidate(candId, updatedFields);
    }
  };

  // Direct CSV Export Helper (Downloads CSV immediately without OTP)
  const downloadCsv = (data, filename) => {
    if (!data || data.length === 0) {
      if (onShowNotification) onShowNotification('No records found to export.');
      return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onShowNotification) {
      onShowNotification(`Exported ${data.length} records to ${filename}.csv.`);
    }
  };

  // Direct Exports (No OTP required)
  const handleDirectExport = async (reportType) => {
    try {
      const res = await advisorApi.exportAdvisorData(reportType, 'CSV');
      if (res.success && res.data) {
        downloadCsv(res.data, `Advisor_${reportType}_Report`);
      } else {
        if (onShowNotification) onShowNotification('Failed to generate report data.');
      }
    } catch (err) {
      console.error('[Export Error]', err);
      if (onShowNotification) onShowNotification(`Export error: ${err.message}`);
    }
  };

  // Bulk Notification Send with OTP check (bulk communications only)
  const handleInitiateBulkSend = () => {
    const activeAdvisors = advisorList.filter(a => a.status === 'ACTIVE' && a.mobile);
    if (activeAdvisors.length === 0) {
      if (onShowNotification) onShowNotification('No active advisors with valid mobile numbers located.');
      return;
    }

    setOtpActionDetails({
      title: `Bulk ${bulkChannel} Broadcast to ${activeAdvisors.length} Advisors`,
      type: 'BULK_COMMUNICATION',
      data: {
        recipients: activeAdvisors.map(a => ({
          id: a.id,
          advisorId: a.id,
          advisorCode: a.advisorCode,
          advisorName: a.fullName,
          mobile: a.mobile,
          email: a.email
        })),
        channel: bulkChannel,
        messageBody: bulkMessage
      }
    });
    setShowOtpModal(true);
  };

  const handleOtpVerified = async (otpCode) => {
    if (otpActionDetails.type === 'BULK_COMMUNICATION') {
      try {
        const payload = {
          ...otpActionDetails.data,
          otp: otpCode,
          username: 'admin'
        };
        const res = await advisorApi.bulkSendReminders(payload);
        if (onShowNotification) {
          onShowNotification(`Bulk messages successfully dispatched to ${res.successCount} recipients!`);
        }
      } catch (err) {
        if (onShowNotification) onShowNotification(`Bulk send failed: ${err.message}`);
      }
    }
  };

  if (selectedAdvisorId) {
    return (
      <AdvisorProfile
        advisorId={selectedAdvisorId}
        onBack={() => {
          setSelectedAdvisorId(null);
          fetchAdvisorsList();
          fetchDashboardData();
        }}
        onShowNotification={onShowNotification}
      />
    );
  }

  const filteredAdvisorEnquiries = advisorEnquiries.filter((enquiry) => {
    const query = advisorEnquirySearch.trim().toLowerCase();
    if (!query) return true;
    return [enquiry.name, enquiry.mobile, enquiry.whatsApp, enquiry.email, enquiry.city, enquiry.message, enquiry.notes]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  return (
    <div className="space-y-6" id="advisor-management-workspace">
      
      {/* Top Banner / Executive Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">
            Advisor Management & Network Operations
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Supervise the complete candidate-to-advisor lifecycle, IRDAI licensing milestones, network hierarchy, and real production performance.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowAddCandidateModal(true)}
            className="px-4 py-2.5 bg-[#0078d4] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Candidate</span>
          </button>
        </div>
      </div>

      {/* Database-Driven KPI Dashboard Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-[#1e293b] border border-slate-800 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Advisors</span>
          <p className="text-2xl font-black text-white">{dashboardStats?.totalAdvisors || advisorList.length || 0}</p>
          <span className="text-[10px] text-blue-400 font-bold block">Registered in Registry</span>
        </div>

        <div className="p-4 bg-[#1e293b] border border-slate-800 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Advisors</span>
          <p className="text-2xl font-black text-emerald-400">{dashboardStats?.activeAdvisors || 0}</p>
          <span className="text-[10px] text-emerald-500 font-bold block">Authorized for Sales</span>
        </div>

        <div className="hidden p-4 bg-[#1e293b] border border-slate-800 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Premium Booked</span>
          <p className="text-2xl font-black text-white font-mono">₹{(dashboardStats?.totalPremium || 0).toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-400 font-bold block">From Active Policies</span>
        </div>

        <div className="hidden p-4 bg-[#1e293b] border border-slate-800 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Commission</span>
          <p className="text-2xl font-black text-purple-400 font-mono">₹{(dashboardStats?.totalCommission || 0).toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-purple-400 font-bold block">Settled & Disbursed</span>
        </div>

        <div className="p-4 bg-[#1e293b] border border-slate-800 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expiring Licenses (60D)</span>
          <p className="text-2xl font-black text-amber-400 font-mono">{dashboardStats?.expiringLicenses || 0}</p>
          <span className="text-[10px] text-amber-500 font-bold block">Renewal Notice Due</span>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0f172a] p-1.5 shadow-sm">
        <div className="flex min-w-max items-center gap-1.5">
          {[
            { id: 'advisors', label: 'Advisors Directory', icon: Users },
            { id: 'candidates', label: 'Recruitment & Milestones', icon: UserCheck },
            { id: 'reminders', label: 'Communications & Outbox', icon: Bell },
            { id: 'reports', label: 'Reports & Exports', icon: FileText },
            { id: 'enquiries', label: 'Enquiries', icon: Inbox }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0078d4] text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: ADVISORS DIRECTORY */}
      {activeTab === 'advisors' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#1e293b] border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
            <div className="relative flex-1 w-full text-xs">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search advisor by name, advisor code, mobile, email, license..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>

              <button
                onClick={fetchAdvisorsList}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition cursor-pointer"
                title="Refresh Directory"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingAdvisors ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-500 uppercase tracking-widest text-[9px] border-b border-slate-800">
                    <th className="p-4">Advisor Code</th>
                    <th className="p-4">Advisor Name</th>
                    <th className="p-4">Mobile</th>
                    <th className="p-4">Joining Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Policies</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-bold text-slate-200">
                  {isLoadingAdvisors ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Loading advisors registry...
                      </td>
                    </tr>
                  ) : advisorList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-500">
                        No advisor dossiers found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    advisorList.map(a => (
                      <tr key={a.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 font-mono text-blue-400 font-black">{a.advisorCode}</td>
                        <td className="p-4">
                          <div>
                            <span className="text-white font-bold">{a.fullName}</span>
                            <p className="text-[10px] text-slate-500 font-mono">Lic: {a.licenseNumber}</p>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-400">{a.mobile}</td>
                        <td className="p-4 font-mono text-slate-500">{a.joiningDate}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            a.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            a.status === 'SUSPENDED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono text-blue-400">{a.activePoliciesCount || 0}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedAdvisorId(a.id)}
                            className="px-3 py-1.5 bg-[#0078d4] hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                          <button type="button" onClick={() => { setDeleteAdvisorTarget(a); setDeletePassword(''); }} className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition" title="Delete advisor" aria-label="Delete advisor"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CANDIDATE RECRUITMENT & INTERACTIVE MILESTONE ROADMAP */}
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          <div className="p-5 bg-[#1e293b] border border-slate-800 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">Candidate Recruitment & Milestone Progress Console</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Select a candidate below to view and manually progress their milestone roadmap stages.
              </p>
            </div>
            <button
              onClick={() => setShowAddCandidateModal(true)}
              className="px-4 py-2 bg-[#0078d4] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" /> Register New Trainee
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Candidate List Selector */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                Active Trainee Candidates ({candidates.length})
              </h4>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {candidates.map(cand => {
                  const isSelected = (cand.id === selectedCandidateId) || (!selectedCandidateId && cand === candidates[0]);
                  const isEligible = cand.eligibility === 'Eligible' || cand.examStatus === 'Passed';
                  const isConverted = cand.isConvertedToAdvisor === true;
                  const candidateStageNumber = Number(cand.stageNumber) || 1;
                  const candAvatar = cand.photoUrl || cand.profilePicture || cand.passportPhoto;

                  return (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedCandidateId(cand.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? 'bg-[#0f2338] border-blue-500 shadow-lg ring-1 ring-blue-500/40'
                          : 'bg-[#1e293b] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{cand.traineeId || 'Trainee ID pending Stage 2'}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          isConverted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          candidateStageNumber === 1 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {isConverted ? 'CONVERTED' : (cand.currentStage || `Stage ${cand.stageNumber || 1}`)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center shadow">
                          {candAvatar ? (
                            <img src={candAvatar} alt={cand.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-xs font-black text-blue-400">
                              {(cand.name || 'C').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-white text-sm truncate">{cand.name}</h5>
                          <p className="text-xs text-slate-400 font-mono truncate">{cand.mobile} • {cand.insuranceCompany || 'SBI Life'}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Milestone: <strong className="text-white">{Math.min(Number(cand.stageNumber) || 1, 10)} of 10</strong></span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCandidate(cand);
                              setShowEditCandidateModal(true);
                            }}
                            className="p-1.5 text-emerald-300 hover:text-white bg-emerald-600/20 hover:bg-emerald-600 rounded-lg text-xs transition"
                            title="Edit Trainee Details & Photo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteCandidateTarget(cand);
                              setDeletePassword('');
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition"
                            title="Delete trainee candidate (password required)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {isConverted ? (
                            <button type="button" disabled className="px-2.5 py-1 bg-slate-700 text-slate-400 rounded-lg text-[10px] font-bold cursor-not-allowed">Already Converted</button>
                          ) : isEligible && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenConversion(cand);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Convert
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 2 Columns: Strict 18-Stage Milestone Roadmap for Selected Candidate */}
            {/* Right 2 Columns: Authoritative 17-Stage Milestone Roadmap for Selected Candidate */}
            <div className="lg:col-span-2 p-6 bg-[#1e293b] border border-slate-800 rounded-3xl shadow-xl space-y-5">
              {activeCandidate ? (
                <>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="relative group shrink-0">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border-2 border-blue-500/50 flex items-center justify-center shadow-lg">
                          {activeCandidate.photoUrl || activeCandidate.profilePicture || activeCandidate.passportPhoto ? (
                            <img
                              src={activeCandidate.photoUrl || activeCandidate.profilePicture || activeCandidate.passportPhoto}
                              alt={activeCandidate.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-base font-black text-blue-400">
                              {(activeCandidate.name || 'C').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCandidate(activeCandidate);
                            setShowEditCandidateModal(true);
                          }}
                          className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow transition"
                          title="Change Photo"
                        >
                          <Camera className="w-3 h-3" />
                        </button>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Trainee ID: {activeCandidate.traineeId || 'Pending Stage 2 entry'}</span>
                        <h4 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
                          <span>{activeCandidate.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCandidate(activeCandidate);
                              setShowEditCandidateModal(true);
                            }}
                            className="px-2.5 py-1 text-emerald-100 hover:text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs flex items-center gap-1.5 font-bold transition cursor-pointer shadow"
                            title="Edit Trainee Details & Photo"
                          >
                            <Edit3 className="w-3 h-3 text-blue-400" />
                            <span className="text-[10px]">Edit Profile</span>
                          </button>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {activeCandidate.mobile} • {activeCandidate.email || 'No email'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                    {activeCandidate.isConvertedToAdvisor ? (
                      <button type="button" disabled className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-xs font-black uppercase tracking-wider cursor-not-allowed">
                        Already Converted to Advisor
                      </button>
                    ) : (activeCandidate.eligibility === 'Eligible' || activeCandidate.examStatus === 'Passed') ? (
                      <button
                        type="button"
                        onClick={() => handleOpenConversion(activeCandidate)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition cursor-pointer"
                      >
                        <Award className="w-4 h-4" /> Convert to Advisor
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => { setDeleteCandidateTarget(activeCandidate); setDeletePassword(''); }}
                      className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition"
                      title="Delete trainee candidate"
                      aria-label="Delete trainee candidate"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    </div>
                  </div>

                  {/* The Strict 18-Stage Roadmap Component */}
                  {/* The Authoritative 17-Stage Roadmap Component */}
                  <AdvisorMilestoneTimeline
                    candidate={activeCandidate}
                    onProgressMilestone={(targetStageNum, nextStageNum, stageName, payload) => {
                      handleProgressCandidateMilestone(activeCandidate.id, targetStageNum, nextStageNum, stageName, payload);
                    }}
                    onOpenConversionModal={handleOpenConversion}
                    onOpenEditCandidateModal={(cand) => {
                      setEditingCandidate(cand);
                      setShowEditCandidateModal(true);
                    }}
                    onShowNotification={onShowNotification}
                  />
                </>
              ) : (
                <div className="p-12 text-center text-slate-500">
                  Select a candidate to view and progress milestones.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: COMMUNICATIONS & REMINDERS OUTBOX */}
      {activeTab === 'reminders' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 bg-[#1e293b] border border-slate-800 rounded-3xl space-y-5 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-400" /> Authorized Bulk Communication Dispatcher
            </h3>
            <p className="text-xs text-slate-400">
              Dispatches multi-channel bulk milestone notices to active advisors and candidates. Operations with more than 3 recipients require Owner Security OTP authorization.
            </p>

            <div className="space-y-4 text-xs font-semibold text-slate-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Communication Channel</label>
                  <select
                    value={bulkChannel}
                    onChange={e => setBulkChannel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none"
                  >
                    <option value="WHATSAPP">Custom WhatsApp Bulk Sender API</option>
                    <option value="SMS">Digital SMS Carrier Gateway</option>
                    <option value="EMAIL">SMTP Corporate Email Relay</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Recipient Target Group</label>
                  <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs">
                    All Active Advisors ({advisorList.filter(a => a.status === 'ACTIVE').length} Recipients)
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Message Body Content</label>
                <textarea
                  rows={4}
                  value={bulkMessage}
                  onChange={e => setBulkMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleInitiateBulkSend}
                  className="px-6 py-3 bg-[#0078d4] hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Request Owner Approval & Dispatch Batch</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#1e293b] border border-slate-800 rounded-3xl space-y-4 shadow-xl text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" /> Automated Schedule Offsets
            </h4>
            <div className="space-y-3 text-slate-300">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="font-bold text-white block">Licensing Training Sessions</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Automated pings 7 days, 3 days, 1 day, and on morning of training start.</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="font-bold text-white block">IRDA Licensing Examination</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Alerts dispatched 7 days, 3 days, and 1 day prior to confirmed exam date.</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="font-bold text-white block">Advisor License Expiry</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Renewal notifications 60 days, 30 days, and 7 days before license expiration.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REPORTS & DIRECT EXPORTS (NO OTP REQUIRED) */}
      {activeTab === 'reports' && (
        <div className="p-6 bg-[#1e293b] border border-slate-800 rounded-3xl space-y-6 shadow-xl text-xs">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> Direct Reports & CSV Downloads
            </h3>
            <p className="text-slate-400 mt-1">
              Click any report below to instantly download the complete dataset in CSV format.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">Advisor Master Directory Report</h4>
                <p className="text-slate-400 mt-1">Complete register of all advisors, license credentials, contact details, and hierarchy links.</p>
              </div>
              <button
                type="button"
                onClick={() => handleDirectExport('MASTER')}
                className="w-full py-2.5 bg-[#0078d4] hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
              >
                <Download className="w-4 h-4" /> Download Master CSV
              </button>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">Advisor Performance & Production Report</h4>
                <p className="text-slate-400 mt-1">Detailed policy counts, premium amounts booked, active policies, and renewal metrics.</p>
              </div>
              <button
                type="button"
                onClick={() => handleDirectExport('PERFORMANCE')}
                className="w-full py-2.5 bg-[#0078d4] hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
              >
                <Download className="w-4 h-4" /> Download Production CSV
              </button>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">Commission & Disbursements Ledger</h4>
                <p className="text-slate-400 mt-1">Comprehensive breakdown of total commissions earned and disbursed across advisor portfolios.</p>
              </div>
              <button
                type="button"
                onClick={() => handleDirectExport('COMMISSION')}
                className="w-full py-2.5 bg-[#0078d4] hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
              >
                <Download className="w-4 h-4" /> Download Commission CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ADVISOR WEBSITE / MOBILE APP ENQUIRIES */}
      {activeTab === 'enquiries' && (
        <div className="space-y-5 rounded-3xl border border-slate-800 bg-[#1e293b] p-6 shadow-xl">
          <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><Inbox className="h-4 w-4 text-blue-400" /> Advisor Enquiries</h3>
              <p className="mt-1 text-xs text-slate-400">Applications submitted from the advisor form on the public website and mobile app.</p>
            </div>
            <button type="button" onClick={loadAdvisorEnquiries} className="flex items-center gap-2 self-start rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:border-blue-500"><RefreshCw className={`h-3.5 w-3.5 ${isLoadingAdvisorEnquiries ? 'animate-spin' : ''}`} /> Refresh</button>
          </div>
          <div className="relative max-w-lg"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input value={advisorEnquirySearch} onChange={event => setAdvisorEnquirySearch(event.target.value)} placeholder="Search name, mobile, email, city..." className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-xs text-white outline-none focus:border-blue-500" /></div>
          {isLoadingAdvisorEnquiries && !advisorEnquiries.length ? <p className="py-10 text-center text-xs text-slate-400">Loading advisor enquiries...</p> : !filteredAdvisorEnquiries.length ? <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center"><Inbox className="mx-auto mb-2 h-8 w-8 text-slate-600" /><p className="text-sm font-semibold text-slate-300">No advisor enquiries yet</p></div> : <div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full text-left text-xs"><thead className="bg-slate-900 text-[9px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="p-4">Applicant</th><th className="p-4">Mobile</th><th className="p-4">Email</th><th className="p-4">City</th><th className="p-4">Message</th><th className="p-4">Received</th><th className="p-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-800">{filteredAdvisorEnquiries.map(enquiry => <tr key={enquiry.id} onClick={() => setSelectedAdvisorEnquiry(enquiry)} className={`cursor-pointer hover:bg-slate-800/80 ${enquiry.isRead ? 'text-slate-400' : 'bg-blue-500/5 text-white'}`}><td className="p-4 font-bold">{enquiry.name || '—'} {!enquiry.isRead && <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] text-amber-300">NEW</span>}</td><td className="p-4 font-mono">{enquiry.mobile || enquiry.whatsApp || '—'}</td><td className="p-4">{enquiry.email || '—'}</td><td className="p-4">{enquiry.city || '—'}</td><td className="max-w-xs truncate p-4">{enquiry.message || enquiry.notes || '—'}</td><td className="p-4 font-mono text-[10px]">{enquiry.timestamp || enquiry.createdAt || '—'}</td><td className="p-4 text-right" onClick={event => event.stopPropagation()}><div className="flex justify-end gap-2"><button type="button" onClick={async () => { await fetch(`${API_URL}/api/enquiries/${enquiry.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isRead: !enquiry.isRead }) }); setAdvisorEnquiries(previous => previous.map(row => row.id === enquiry.id ? { ...row, isRead: !row.isRead } : row)); }} className="rounded-lg bg-emerald-600/20 px-2 py-1 text-[10px] font-bold text-emerald-300">{enquiry.isRead ? 'Unread' : 'Read'}</button><button type="button" onClick={async () => { if (!window.confirm(`Delete enquiry from ${enquiry.name || 'this applicant'}?`)) return; await fetch(`${API_URL}/api/enquiries/${enquiry.id}`, { method: 'DELETE' }); setAdvisorEnquiries(previous => previous.filter(row => row.id !== enquiry.id)); }} className="rounded-lg bg-rose-600/20 p-1.5 text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button></div></td></tr>)}</tbody></table></div>}
        </div>
      )}

      {selectedAdvisorEnquiry && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={() => setSelectedAdvisorEnquiry(null)}>
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-[#1e293b] p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
            <button type="button" onClick={() => setSelectedAdvisorEnquiry(null)} className="absolute right-4 top-4 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Advisor Website Enquiry</p>
            <h3 className="mt-1 text-lg font-bold text-white">{selectedAdvisorEnquiry.name || '—'}</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
              <div><p className="text-[9px] uppercase text-slate-500">Mobile</p><p>{selectedAdvisorEnquiry.mobile || selectedAdvisorEnquiry.whatsApp || '—'}</p></div>
              <div><p className="text-[9px] uppercase text-slate-500">Email</p><p>{selectedAdvisorEnquiry.email || '—'}</p></div>
              <div><p className="text-[9px] uppercase text-slate-500">City</p><p>{selectedAdvisorEnquiry.city || '—'}</p></div>
              <div><p className="text-[9px] uppercase text-slate-500">Received</p><p>{selectedAdvisorEnquiry.timestamp || selectedAdvisorEnquiry.createdAt || '—'}</p></div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/50 p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Message</p><p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-200">{selectedAdvisorEnquiry.message || selectedAdvisorEnquiry.notes || '—'}</p></div>
          </div>
        </div>
      )}

      {/* MODAL 1: CANDIDATE CONVERSION MODAL */}
      {deleteCandidateTarget && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/40 bg-[#1e293b] p-6 shadow-2xl">
            <h3 className="text-base font-black text-white">Delete Trainee Candidate</h3>
            <p className="mt-2 text-xs text-slate-400">Enter the deletion password to permanently remove <strong className="text-white">{deleteCandidateTarget.name}</strong>.</p>
            <input type="password" autoFocus value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Password" className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-500" />
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDeleteCandidateTarget(null)} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300">Cancel</button><button type="button" onClick={async () => { if (deletePassword !== '1111') { onShowNotification?.('Incorrect deletion password.'); return; } try { await onDeleteCandidate?.(deleteCandidateTarget.id); if (selectedCandidateId === deleteCandidateTarget.id) setSelectedCandidateId(null); setDeleteCandidateTarget(null); onShowNotification?.('Trainee candidate and linked vault documents deleted.'); } catch (err) { onShowNotification?.(`Unable to delete candidate: ${err.message}`); } }} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white">Delete Candidate</button></div>
          </div>
        </div>
      )}
      {deleteAdvisorTarget && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/40 bg-[#1e293b] p-6 shadow-2xl">
            <h3 className="text-base font-black text-white">Delete Advisor</h3>
            <p className="mt-2 text-xs text-slate-400">Enter the deletion password to permanently remove <strong className="text-white">{deleteAdvisorTarget.fullName}</strong>.</p>
            <input type="password" autoFocus value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Password" className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-500" />
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDeleteAdvisorTarget(null)} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300">Cancel</button><button type="button" onClick={async () => { if (deletePassword !== '1111') { onShowNotification?.('Incorrect deletion password.'); return; } try { await advisorApi.deleteAdvisor(deleteAdvisorTarget.id, deletePassword); setAdvisorList(prev => prev.filter(a => a.id !== deleteAdvisorTarget.id)); setDeleteAdvisorTarget(null); onShowNotification?.('Advisor deleted.'); } catch (err) { onShowNotification?.(`Unable to delete advisor: ${err.message}`); } }} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white">Delete Advisor</button></div>
          </div>
        </div>
      )}
      {conversionCandidate && (
        <CandidateConversionModal
          isOpen={Boolean(conversionCandidate)}
          candidate={conversionCandidate}
          hierarchyOptions={hierarchyOptions}
          onClose={() => setConversionCandidate(null)}
          onSuccess={newAdv => {
            if (conversionCandidate) {
              onUpdateCandidate?.(conversionCandidate.id, {
                isConvertedToAdvisor: true,
                convertedAdvisorCode: newAdv?.advisorCode,
                currentStage: 'Already Converted to Advisor',
                stageNumber: 10
              });
            }
            fetchAdvisorsList();
            fetchDashboardData();
          }}
          onShowNotification={onShowNotification}
        />
      )}

      {/* MODAL 2: STATUS CHANGE MODAL */}
      {statusModalAdvisor && (
        <AdvisorStatusModal
          isOpen={Boolean(statusModalAdvisor)}
          advisor={statusModalAdvisor}
          onClose={() => setStatusModalAdvisor(null)}
          onSuccess={() => {
            fetchAdvisorsList();
            fetchDashboardData();
          }}
          onShowNotification={onShowNotification}
        />
      )}

      {/* MODAL 3: MANDATORY DOCUMENT PREVIEW MODAL */}
      {previewDocFile && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDocFile)}
          file={previewDocFile}
          category={previewDocCategory}
          targetId={previewTargetId}
          targetType={previewTargetType}
          onClose={() => {
            setPreviewDocFile(null);
          }}
          onConfirm={async (file, category, targetId, targetType) => {
            try {
              await advisorApi.uploadAdvisorDocument(file, category, targetId, previewTargetType);
              if (onShowNotification) onShowNotification('Document confirmed and saved successfully.');
              setPreviewDocFile(null);
              fetchAdvisorsList();
            } catch (err) {
              if (onShowNotification) onShowNotification(`Upload failed: ${err.message}`);
            }
          }}
        />
      )}

      {/* MODAL 4: OTP AUTHORIZATION MODAL (Bulk Communications only) */}
      {showOtpModal && (
        <OtpVerificationModal
          isOpen={showOtpModal}
          actionTitle={otpActionDetails.title}
          actionType={otpActionDetails.type}
          targetDetails={JSON.stringify(otpActionDetails.data)}
          onClose={() => setShowOtpModal(false)}
          onVerifySuccess={handleOtpVerified}
          onShowNotification={onShowNotification}
        />
      )}

      {/* CANDIDATE ONBOARDING MODAL */}
      {showAddCandidateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-[#1e293b] p-6 shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowAddCandidateModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-400" /> Register Trainee Candidate
              </h3>
              <p className="text-xs text-slate-400">Onboard candidate into Stage 1 of the advisor licensing pipeline.</p>
            </div>

            <form onSubmit={handleCandidateRegister} className="space-y-4 text-xs font-semibold text-slate-300">
              {/* Photo Upload for new trainee */}
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-blue-500/50 flex items-center justify-center shadow">
                    {candPhotoPreview ? (
                      <img src={candPhotoPreview} alt="Trainee" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-7 h-7 text-slate-500" />
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow cursor-pointer transition">
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCandPhotoFile(file);
                          setCandPhotoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="space-y-0.5">
                  <h5 className="text-xs font-bold text-white">Passport-Size Photo (Optional)</h5>
                  <p className="text-[11px] text-slate-400">Upload now or add during Stage 2 Document Collection.</p>
                </div>
              </div>

              <div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 block font-bold">Candidate Name *</label>
                  <input
                    required
                    type="text"
                    value={candName}
                    onChange={e => setCandName(e.target.value.replace(/[^A-Za-z ]/g, ''))}
                    placeholder="e.g. Anand Sharma"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 block font-bold">Mobile Number *</label>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={candMobile}
                    onChange={e => setCandMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 block font-bold">Email Address</label>
                  <input
                    type="email"
                    value={candEmail}
                    onChange={e => setCandEmail(e.target.value)}
                    placeholder="trainee@gmail.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-400 block font-bold">Residential City & Address</label>
                <input
                  type="text"
                  value={candAddress}
                  onChange={e => setCandAddress(e.target.value)}
                  placeholder="e.g. T. Nagar, Chennai"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCandidateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0078d4] text-white rounded-xl font-bold hover:bg-blue-600 transition"
                >
                  Save Trainee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT CANDIDATE DOSSIER MODAL */}
      {showEditCandidateModal && editingCandidate && (
        <EditCandidateModal
          isOpen={showEditCandidateModal}
          candidate={editingCandidate}
          onClose={() => {
            setShowEditCandidateModal(false);
            setEditingCandidate(null);
          }}
          onSave={async (candidateId, updatedPayload) => {
            if (onUpdateCandidate) {
              await onUpdateCandidate(candidateId, updatedPayload);
            }
          }}
          onShowNotification={onShowNotification}
        />
      )}

    </div>
  );
}
