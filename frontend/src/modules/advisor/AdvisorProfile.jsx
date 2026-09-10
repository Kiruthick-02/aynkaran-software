import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  User, ShieldCheck, Mail, Phone, MapPin, Calendar, FileText, CheckCircle2,
  AlertCircle, Download, ExternalLink, RefreshCw, X, ShieldAlert, Award,
  Users, Building, DollarSign, TrendingUp, Bell, Clock, Eye, Check, Trash2,
  FolderLock, Edit3, ArrowLeft, Plus, Upload
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { advisorApi } from '../../services/advisorApi';
import { apiService } from '../../services/api';
import { resolveApiUrl } from '../../config/api';
import AdvisorMilestoneTimeline from './AdvisorMilestoneTimeline';
import DocumentPreviewModal from './DocumentPreviewModal';
import AdvisorStatusModal from './AdvisorStatusModal';

const TABS = [
  { id: 'overview', label: '1. Overview' },
  { id: 'personal', label: '2. Personal Info' },
  { id: 'professional', label: '3. Professional Info' },
  { id: 'documents', label: '4. Documents' },
  { id: 'customers', label: '6. Customers' },
  { id: 'reminders', label: '7. Reminders' },
  { id: 'history', label: '8. Activity History' }
];

const ADVISOR_DOCUMENT_TYPES = [
  { key: 'passport_photo', name: 'Passport Size Photo', required: true, icon: User },
  { key: 'aadhaar_card', name: 'Aadhaar Card', required: true, icon: ShieldCheck },
  { key: 'pan_card', name: 'PAN Card', required: true, icon: FileText },
  { key: 'bank_proof', name: 'Bank Passbook / Cancelled Cheque', required: true, icon: FileText },
  { key: 'education_certificate', name: 'Highest Education Certificate / Marksheet', required: true, icon: Award },
  { key: 'signature_specimen', name: 'Signature Specimen', required: false, icon: Edit3 }
];

const documentMatchesType = (doc, key) => {
  const text = `${doc?.category || ''} ${doc?.name || ''} ${doc?.fileName || ''}`.toLowerCase();
  const keywords = {
    passport_photo: ['passport', 'photo', 'photograph'],
    aadhaar_card: ['aadhaar', 'aadhar'],
    pan_card: ['pan'],
    bank_proof: ['bank', 'passbook', 'cheque'],
    education_certificate: ['education', 'certificate', 'marksheet', 'mark sheet'],
    signature_specimen: ['signature', 'specimen']
  };
  return keywords[key]?.some(word => text.includes(word));
};

const resolveDocumentUrl = (value) => {
  return resolveApiUrl(value);
};

export default function AdvisorProfile({
  advisorId,
  onBack,
  onShowNotification
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [advisorData, setAdvisorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDocPreviewModal, setShowDocPreviewModal] = useState(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('Advisor Document');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);

  const [rejectingDocId, setRejectingDocId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [perfYear, setPerfYear] = useState(new Date().getFullYear());
  const [performanceData, setPerformanceData] = useState(null);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [customerLink, setCustomerLink] = useState({ customerId: '', name: '', mobile: '', policy: '', company: '' });
  const [isSavingCustomerLink, setIsSavingCustomerLink] = useState(false);

  const fetchAdvisorDetails = async () => {
    if (!advisorId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await advisorApi.getAdvisor(advisorId);
      setAdvisorData({
        ...data,
        documents: Array.isArray(data?.documents) ? data.documents : [],
        policies: Array.isArray(data?.policies) ? data.policies : [],
        reminders: Array.isArray(data?.reminders) ? data.reminders : []
      });
    } catch (err) {
      console.error('[Advisor Profile Error]', err);
      setError(err.message || 'Failed to load advisor dossier profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPerformance = async () => {
    if (!advisorId) return;
    try {
      const perf = await advisorApi.getAdvisorPerformance(advisorId, null, perfYear);
      setPerformanceData(perf);
    } catch (err) {
      console.error('[Advisor Perf Error]', err);
    }
  };

  useEffect(() => {
    fetchAdvisorDetails();
  }, [advisorId]);

  useEffect(() => {
    apiService.getCustomers().then(rows => setAvailableCustomers(Array.isArray(rows) ? rows : [])).catch(() => setAvailableCustomers([]));
  }, []);

  useEffect(() => {
    if (activeTab === 'performance') {
      fetchPerformance();
    }
  }, [activeTab, perfYear, advisorId]);

  const handleFilePicked = (e, category) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedUploadFile(file);
    setUploadCategory(category || 'Advisor Document');
    setShowDocPreviewModal(true);
    e.target.value = '';
  };

  const handleConfirmDocUpload = async (file, category) => {
    setIsUploadingDoc(true);
    try {
      const uploadResult = await advisorApi.uploadAdvisorDocument(file, category, advisorData.id || advisorId);
      const uploadedDoc = uploadResult.document || {
        id: `doc-${Date.now()}`,
        name: file.name,
        fileName: file.name,
        category,
        path: uploadResult.path || uploadResult.url,
        url: uploadResult.url || uploadResult.path,
        verificationStatus: 'PENDING',
        uploadedAt: new Date().toISOString()
      };
      setAdvisorData(previous => previous ? {
        ...previous,
        documents: [
          ...(previous.documents || []).filter(document => document.category !== category),
          uploadedDoc
        ]
      } : previous);
      if (onShowNotification) {
        onShowNotification(category + ' uploaded and linked to advisor profile.');
      }
      setShowDocPreviewModal(false);
      setSelectedUploadFile(null);
      await fetchAdvisorDetails();
    } catch (err) {
      console.error('[Upload Doc Error]', err);
      if (onShowNotification) onShowNotification('Upload failed: ' + err.message);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleVerifyDocument = async (docId) => {
    try {
      await advisorApi.verifyDocument(docId, advisorData.id, 'advisor');
      if (onShowNotification) onShowNotification('Document verified successfully.');
      await fetchAdvisorDetails();
    } catch (err) {
      if (onShowNotification) onShowNotification('Verification failed: ' + err.message);
    }
  };

  const handleRejectDocument = async (docId) => {
    if (!rejectionReason.trim()) {
      if (onShowNotification) onShowNotification('Please provide a specific rejection reason.');
      return;
    }
    try {
      await advisorApi.rejectDocument(docId, advisorData.id, 'advisor', rejectionReason.trim());
      if (onShowNotification) onShowNotification('Document marked as rejected.');
      setRejectingDocId(null);
      setRejectionReason('');
      await fetchAdvisorDetails();
    } catch (err) {
      if (onShowNotification) onShowNotification('Rejection error: ' + err.message);
    }
  };

  const handleCustomerLinkSave = async (event) => {
    event.preventDefault();
    if (!customerLink.name.trim() || !customerLink.mobile.trim() || !customerLink.policy.trim() || !customerLink.company.trim()) {
      onShowNotification?.('Enter customer name, mobile number, policy, and company.');
      return;
    }
    setIsSavingCustomerLink(true);
    try {
      let customerId = customerLink.customerId;
      if (!customerId) {
        const created = await apiService.createCustomer({
          id: `cust-${Date.now().toString().slice(-6)}`,
          name: customerLink.name.trim(),
          mobile: customerLink.mobile.trim(),
          mobileNumber: customerLink.mobile.trim(),
          createdAt: new Date().toISOString()
        });
        customerId = created.id;
        setAvailableCustomers(previous => [...previous, created]);
      }
      await apiService.createPolicy({
        id: `pol-${Date.now().toString().slice(-6)}`,
        advisorId: adv.id,
        advisorCode: adv.advisorCode,
        customerId,
        customerName: customerLink.name.trim(),
        policyType: customerLink.policy.trim(),
        insuranceCompany: customerLink.company.trim(),
        companyName: customerLink.company.trim(),
        currentStage: 'Policy Issued',
        issueDate: new Date().toISOString().split('T')[0]
      });
      setCustomerLink({ customerId: '', name: '', mobile: '', policy: '', company: '' });
      await fetchAdvisorDetails();
      onShowNotification?.('Customer and policy linked to this advisor.');
    } catch (err) {
      onShowNotification?.(`Could not save customer link: ${err.message}`);
    } finally {
      setIsSavingCustomerLink(false);
    }
  };

  const handleProgressMilestone = async (stageNumber, stageName, payload = {}) => {
    try {
      await advisorApi.updateAdvisorMilestone(advisorData.id, stageNumber, {
        status: payload.status || 'COMPLETED',
        completedDate: payload.completedDate || new Date().toISOString().split('T')[0],
        remarks: payload.remarks || ('Manually updated to ' + stageName),
        stageData: payload.stageData || {}
      });
      if (onShowNotification) {
        onShowNotification('Updated milestone ' + stageNumber + ': ' + stageName);
      }
      await fetchAdvisorDetails();
    } catch (err) {
      console.error('[Milestone Progress Error]', err);
      if (onShowNotification) onShowNotification('Milestone error: ' + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-3 bg-[#1e293b] border border-slate-800 rounded-3xl">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Advisor Dossier...</p>
      </div>
    );
  }

  if (error || !advisorData) {
    return (
      <div className="p-10 text-center space-y-4 bg-[#1e293b] border border-rose-500/30 rounded-3xl">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-sm font-bold text-rose-300">{error || 'Advisor not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
        >
          Back to Advisors Directory
        </button>
      </div>
    );
  }

  const adv = advisorData;
  const displayName = typeof adv.fullName === 'string' && adv.fullName.trim()
    ? adv.fullName.trim()
    : 'Advisor';

  return (
    <div className="space-y-6 animate-fade-in" id="advisor-profile-view">
      <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Return to directory"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border-2 border-blue-500/40 text-blue-400 flex items-center justify-center text-2xl font-black italic shadow-inner">
              {displayName.split(/\s+/).map(namePart => namePart[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white tracking-tight">{displayName}</h2>
                <span className={'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ' + (
                  adv.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  adv.status === 'SUSPENDED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  'bg-slate-800 text-slate-400'
                )}>
                  {adv.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Advisor Code: <span className="text-blue-400 font-bold">{adv.advisorCode}</span> • License #{adv.licenseNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowStatusModal(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Change Status</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Policies</span>
            <span className="text-xl font-black text-white mt-1 block">{adv.stats?.activePolicies || 0}</span>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Policies</span>
            <span className="text-xl font-black text-white mt-1 block">{adv.stats?.totalPolicies || 0}</span>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Customers</span>
            <span className="text-xl font-black text-blue-400 mt-1 block">{adv.stats?.customerCount || 0}</span>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Documents</span>
            <span className="text-xl font-black text-slate-300 mt-1 block">{adv.documents?.length || 0}</span>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-slate-800 pt-3">
          <div className="flex items-center gap-1.5 min-w-max">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (
                  activeTab === tab.id
                    ? 'bg-[#0078d4] text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <AdvisorMilestoneTimeline
                  candidate={adv.candidate}
                  advisor={adv}
                  milestones={adv.milestones}
                  onProgressMilestone={handleProgressMilestone}
                  onShowNotification={onShowNotification}
                />
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs">
                  <h4 className="font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" /> License Details
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-slate-500">Official Joining:</span><span className="text-slate-300 font-mono">{adv.joiningDate}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">License Expiry:</span><span className="text-slate-300 font-mono">{adv.licenseExpiryDate || 'N/A'}</span></div>
                  </div>
                </div>

                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs">
                  <h4 className="font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" /> Contact Quick Access
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-300"><Phone className="w-3.5 h-3.5 text-slate-500" /><span>{adv.mobile}</span></div>
                    <div className="flex items-center gap-2 text-slate-300"><Mail className="w-3.5 h-3.5 text-slate-500" /><span>{adv.email || 'No email provided'}</span></div>
                    <div className="flex items-center gap-2 text-slate-300"><MapPin className="w-3.5 h-3.5 text-slate-500" /><span>{adv.city}, {adv.state}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'personal' && (
          <div className="space-y-6 text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              Advisor Personal Dossier Particulars
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 font-semibold">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Full Legal Name</span>
                <p className="text-sm text-white font-bold">{adv.fullName}</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Date of Birth</span>
                <p className="text-sm text-white font-mono">{adv.dateOfBirth || 'Not Recorded'}</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Gender</span>
                <p className="text-sm text-white">{adv.gender || 'Male'}</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Blood Group</span>
                <p className="text-sm text-white">{adv.bloodGroup || 'O+'}</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Primary Mobile Number</span>
                <p className="text-sm text-white font-mono">{adv.mobile}</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Alternate Mobile Number</span>
                <p className="text-sm text-white font-mono">{adv.alternateMobile || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 sm:col-span-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Email Address</span>
                <p className="text-sm text-white">{adv.email || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Qualification & Experience</span>
                <p className="text-sm text-white">{adv.experience || 'Fresher'}</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 sm:col-span-3">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Residential Address Particulars</span>
                <p className="text-sm text-white">{adv.address || 'Aynkaran Consultants Operations, Chennai'}</p>
                <p className="text-xs text-slate-400 mt-1">{adv.city}, {adv.district || 'Chennai'}, {adv.state} - {adv.pincode || '600001'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'professional' && (
          <div className="space-y-6 text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              IRDAI Licensing & Professional Certification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 font-semibold">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Advisor Code</span>
                <p className="text-sm text-blue-400 font-mono font-black">{adv.advisorCode}</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Carrier Partner</span>
                <p className="text-sm text-white font-bold">{adv.insuranceCompanyName}</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">License Number</span>
                <p className="text-sm text-white font-mono">{adv.licenseNumber}</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">License Issue Date</span>
                <p className="text-sm text-white font-mono">{adv.licenseIssueDate || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">License Expiry Date</span>
                <p className="text-sm text-amber-400 font-mono font-bold">{adv.licenseExpiryDate || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Official Joining Date</span>
                <p className="text-sm text-white font-mono">{adv.joiningDate}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">Historical Status Transitions</h4>
              <div className="space-y-2">
                {(adv.statusHistory || []).map((sh, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">{sh.oldStatus}</span>
                        <span className="text-slate-600">→</span>
                        <span className="font-bold text-white text-xs">{sh.newStatus}</span>
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">{sh.reason}</p>
                    </div>
                    <div className="text-right text-[10px] font-mono text-slate-500">
                      <span>By @{sh.changedBy}</span><br />
                      <span>{new Date(sh.changedAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hierarchy' && (
          <div className="space-y-6 text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              Network Hierarchy Structure (Business Manager → ABP → Level-1 Manager → Advisor)
            </h3>
            <div className="flex flex-col items-center space-y-4 max-w-lg mx-auto py-4">
              <div className="w-full p-4 bg-blue-950/40 border border-blue-500/40 rounded-2xl text-center shadow-lg">
                <span className="text-[10px] font-mono uppercase text-blue-400 font-bold block">Top Tier</span>
                <h4 className="text-sm font-black text-white mt-1">Business Manager / Owner</h4>
                <p className="text-slate-400 text-xs">Aynkaran Consultants HQ Central Control</p>
              </div>
              <div className="w-0.5 h-6 bg-blue-500/40" />
              <div className="w-full p-4 bg-amber-950/30 border border-amber-500/40 rounded-2xl text-center shadow-lg">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">Assistant Business Partner (ABP)</span>
                <h4 className="text-sm font-black text-white mt-1">{adv.abpName || adv.abpId || 'Direct Partner Assigned'}</h4>
                <p className="text-slate-400 text-xs">ABP Sponsor Code: {adv.abpId || 'N/A'}</p>
              </div>
              <div className="w-0.5 h-6 bg-amber-500/40" />
              <div className="w-full p-4 bg-purple-950/30 border border-purple-500/40 rounded-2xl text-center shadow-lg">
                <span className="text-[10px] font-mono uppercase text-purple-400 font-bold block">Level-1 Supervisory Manager</span>
                <h4 className="text-sm font-black text-white mt-1">{adv.level1ManagerName || adv.level1ManagerId || 'Direct Manager Assigned'}</h4>
                <p className="text-slate-400 text-xs">Manager Code: {adv.level1ManagerId || 'N/A'}</p>
              </div>
              <div className="w-0.5 h-6 bg-purple-500/40" />
              <div className="w-full p-4 bg-emerald-950/30 border-2 border-emerald-500 rounded-2xl text-center shadow-xl ring-2 ring-emerald-500/20">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">Licensed Insurance Advisor</span>
                <h4 className="text-base font-black text-white mt-1">{adv.fullName} ({adv.advisorCode})</h4>
                <p className="text-slate-300 text-xs mt-0.5 font-mono">{adv.insuranceCompanyName}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0"><Upload className="w-5 h-5" /></div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Advisor KYC & Licensing Documents Vault
                </h3>
                <p className="text-slate-400 mt-0.5">
                  Upload documents here. Each file is linked to this advisor dossier and the Consolidated Document Vault.
                </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ADVISOR_DOCUMENT_TYPES.map(type => {
                  const foundDocument = (adv.documents || []).find(item => documentMatchesType(item, type.key));
                  const isUploaded = Boolean(foundDocument);
                  const doc = foundDocument || {};
                  const isVerified = doc?.verificationStatus === 'VERIFIED';
                  const isRejected = doc?.verificationStatus === 'REJECTED';
                  const Icon = type.icon;

                  return (
                    <div key={type.key} className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${isUploaded ? 'bg-slate-900 border-slate-700 text-white shadow' : 'bg-slate-900/60 border-slate-800 text-slate-400'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs leading-tight">{type.name}</h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{type.required ? 'Mandatory' : 'Optional'}</p>
                            {doc?.rejectionReason && (
                              <p className="text-[10px] text-rose-400 mt-1 font-semibold">Reason: {doc.rejectionReason}</p>
                            )}
                          </div>
                        </div>

                        <span className={'px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ' + (
                          isVerified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          isRejected ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        )}>
                          {isVerified ? 'Verified' : isRejected ? 'Rejected' : isUploaded ? 'Uploaded' : 'Not Uploaded'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <div className="flex items-center gap-2">
                          {isUploaded && <button type="button" onClick={() => setViewingDocument(doc)} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition"><Eye className="w-3 h-3" /> View</button>}
                          <a
                            href={doc.url || doc.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden"
                          >
                            <ExternalLink className="w-3 h-3" /> Open
                          </a>
                          <a
                            href={doc.url || doc.path}
                            download
                            className="hidden"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                          <label className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition">
                            <Upload className="w-3 h-3" /> Replace
                            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={event => handleFilePicked(event, doc.category || type.name)} />
                          </label>
                        </div>

                        {isUploaded && !isVerified && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleVerifyDocument(doc.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Verify
                            </button>
                            <button
                              onClick={() => setRejectingDocId(doc.id)}
                              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>

                      {rejectingDocId === doc.id && (
                        <div className="p-3 bg-slate-950 border border-rose-500/40 rounded-xl space-y-2 pt-2">
                          <label className="text-[10px] font-bold text-rose-300 block">Rejection Reason *</label>
                          <input
                            type="text"
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="e.g. Blurry scan, missing signature, mismatched name..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => { setRejectingDocId(null); setRejectionReason(''); }}
                              className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded text-[10px]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleRejectDocument(doc.id)}
                              className="px-3 py-1 bg-rose-600 text-white rounded text-[10px] font-bold"
                            >
                              Confirm Rejection
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
              })}
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-6 text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">Advisor Customers</h3>
            <form onSubmit={handleCustomerLinkSave} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <select value={customerLink.customerId} onChange={event => { const selected = availableCustomers.find(customer => String(customer.id) === event.target.value); setCustomerLink(previous => ({ ...previous, customerId: event.target.value, name: selected?.name || '', mobile: selected?.mobile || selected?.mobileNumber || '' })); }} className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"><option value="">Create a new customer</option>{availableCustomers.map(customer => <option key={customer.id} value={customer.id}>{customer.name} — {customer.mobile || customer.mobileNumber || 'No mobile'}</option>)}</select>
              <input required value={customerLink.name} disabled={Boolean(customerLink.customerId)} onChange={event => setCustomerLink(previous => ({ ...previous, name: event.target.value }))} placeholder="Customer name" className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white disabled:opacity-60" />
              <input required value={customerLink.mobile} disabled={Boolean(customerLink.customerId)} onChange={event => setCustomerLink(previous => ({ ...previous, mobile: event.target.value }))} placeholder="Mobile number" className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white disabled:opacity-60" />
              <input required value={customerLink.policy} onChange={event => setCustomerLink(previous => ({ ...previous, policy: event.target.value }))} placeholder="Policy chosen" className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white" />
              <input required value={customerLink.company} onChange={event => setCustomerLink(previous => ({ ...previous, company: event.target.value }))} placeholder="Company" className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white" />
              <button disabled={isSavingCustomerLink} className="bg-[#0078d4] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl p-2.5 font-bold">{isSavingCustomerLink ? 'Saving...' : 'Save customer'}</button>
            </form>
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-500 uppercase text-[9px] tracking-widest border-b border-slate-800">
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Mobile</th>
                    <th className="p-4">Policy chosen</th>
                    <th className="p-4">Company</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-bold text-slate-200">
                  {(adv.policies || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        No customer policy sales records linked to this advisor yet.
                      </td>
                    </tr>
                  ) : (
                    adv.policies.map(policy => {
                      const customer = (adv.customers || []).find(row => String(row.id) === String(policy.customerId));
                      return <tr key={policy.id} className="hover:bg-slate-800/50">
                        <td className="p-4 text-white font-bold">{policy.customerName || customer?.name || '—'}</td>
                        <td className="p-4 font-mono text-slate-400">{customer?.mobile || customer?.mobileNumber || '—'}</td>
                        <td className="p-4 text-slate-200">{policy.policyType || policy.policyName || '—'}</td>
                        <td className="p-4 text-slate-300">{policy.insuranceCompany || policy.companyName || '—'}</td>
                      </tr>;
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="space-y-6 text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              Insurance Policies Portfolios
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-500 uppercase text-[9px] tracking-widest border-b border-slate-800">
                    <th className="p-4">Policy #</th>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Policy Type</th>
                    <th className="p-4">Premium</th>
                    <th className="p-4">Issue Date</th>
                    <th className="p-4">Renewal Date</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-bold text-slate-200">
                  {(adv.policies || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No active policy files found for this advisor ID.
                      </td>
                    </tr>
                  ) : (
                    adv.policies.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/50">
                        <td className="p-4 font-mono text-blue-400">{p.issuedPolicyNumber || p.id}</td>
                        <td className="p-4 text-white font-bold">{p.customerName}</td>
                        <td className="p-4 text-slate-300">{p.policyType}</td>
                        <td className="p-4 font-mono text-emerald-400">₹{(Number(p.premiumAmount) || 0).toLocaleString('en-IN')}</td>
                        <td className="p-4 font-mono text-slate-400">{p.issueDate || 'Pending'}</td>
                        <td className="p-4 font-mono text-amber-400">{p.renewalDate || 'N/A'}</td>
                        <td className="p-4 text-right">
                          <span className={'px-2.5 py-0.5 rounded text-[9px] font-black uppercase ' + (
                            p.currentStage === 'Policy Issued' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                          )}>
                            {p.currentStage}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'commission' && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Advisor Commission Earnings & Settlement Ledger
              </h3>
              <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-xl font-mono font-bold">
                Total Earned: ₹{(adv.stats?.totalCommission || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-500 uppercase text-[9px] tracking-widest border-b border-slate-800">
                    <th className="p-4">Policy Number</th>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Premium (INR)</th>
                    <th className="p-4 text-center">Comm. Rate</th>
                    <th className="p-4">Commission Amount</th>
                    <th className="p-4 text-right">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-bold text-slate-200">
                  {(adv.policies || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No commission entries recorded yet.
                      </td>
                    </tr>
                  ) : (
                    adv.policies.map(p => {
                      const prem = Number(p.premiumAmount || 0);
                      const comm = Number(p.commissionAmount || (prem * 0.15));
                      return (
                        <tr key={p.id} className="hover:bg-slate-800/50">
                          <td className="p-4 font-mono text-blue-400">{p.issuedPolicyNumber || p.id}</td>
                          <td className="p-4 text-white">{p.customerName}</td>
                          <td className="p-4 font-mono text-slate-300">₹{prem.toLocaleString('en-IN')}</td>
                          <td className="p-4 text-center font-mono text-purple-400">15%</td>
                          <td className="p-4 font-mono text-emerald-400 font-bold">₹{comm.toLocaleString('en-IN')}</td>
                          <td className="p-4 text-right">
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[9px] font-black uppercase">
                              Disbursed
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Sales Trajectory & Monthly Production KPI
              </h3>
              <select
                value={perfYear}
                onChange={e => setPerfYear(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-white font-mono text-xs focus:outline-none"
              >
                <option value={2026}>Year 2026</option>
                <option value={2025}>Year 2025</option>
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Sales Premium</span>
                <p className="text-xl font-black text-emerald-400 font-mono mt-1">
                  ₹{(performanceData?.totalPremium || adv.stats?.totalPremium || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Current Month Premium</span>
                <p className="text-xl font-black text-blue-400 font-mono mt-1">
                  ₹{(performanceData?.currentMonthPremium || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">YTD Production</span>
                <p className="text-xl font-black text-purple-400 font-mono mt-1">
                  ₹{(performanceData?.ytdPremium || adv.stats?.totalPremium || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Renewals Tracked</span>
                <p className="text-xl font-black text-amber-400 font-mono mt-1">
                  {performanceData?.renewalsCount || 0}
                </p>
              </div>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">Production Velocity (INR)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData?.monthlyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="sales" name="Sales Premium (₹)" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="commission" name="Commission (₹)" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="space-y-6 text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              Automated Compliance & Milestone Reminders
            </h3>
            <div className="space-y-3">
              {(adv.reminders || []).length === 0 ? (
                <div className="p-10 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
                  No active or pending reminders logged for this advisor.
                </div>
              ) : (
                adv.reminders.map((r, idx) => (
                  <div key={r.id || idx} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs">{r.title || r.description}</h4>
                      <p className="text-slate-400 mt-0.5">{r.description || r.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-500">
                        <span>Due: <strong className="text-amber-400">{r.dueDate || r.targetDate}</strong></span>
                        <span>Channel: {r.channel || 'WHATSAPP'}</span>
                      </div>
                    </div>
                    <span className={'px-2.5 py-0.5 rounded text-[9px] font-black uppercase ' + (
                      r.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    )}>
                      {r.completed ? 'COMPLETED' : (r.status || 'PENDING')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              Audit Ledger & Historical Action Logs
            </h3>
            <div className="space-y-3">
              {(adv.statusHistory || []).map((sh, idx) => (
                <div key={idx} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-xs">{sh.reason}</span>
                    <p className="text-slate-400 mt-0.5 font-mono text-[11px]">{sh.oldStatus} → {sh.newStatus}</p>
                  </div>
                  <div className="text-right text-[10px] font-mono text-slate-500">
                    <span>By @{sh.changedBy}</span><br />
                    <span>{new Date(sh.changedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showStatusModal && (
        <AdvisorStatusModal
          isOpen={showStatusModal}
          advisor={adv}
          onClose={() => setShowStatusModal(false)}
          onSuccess={updated => {
            setAdvisorData(prev => ({ ...prev, status: updated.status }));
          }}
          onShowNotification={onShowNotification}
        />
      )}

      {showDocPreviewModal && selectedUploadFile && (
        <DocumentPreviewModal
          isOpen={showDocPreviewModal}
          file={selectedUploadFile}
          category={uploadCategory}
          targetId={adv.id}
          targetType="advisor"
          isUploading={isUploadingDoc}
          onClose={() => {
            setShowDocPreviewModal(false);
            setSelectedUploadFile(null);
          }}
          onConfirm={handleConfirmDocUpload}
        />
      )}

      {viewingDocument && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-hidden rounded-3xl border border-slate-700 bg-[#0f172a] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#1e293b] px-5 py-4">
              <div className="min-w-0"><h3 className="truncate text-sm font-bold text-white">{viewingDocument.fileName || viewingDocument.name || 'Document Preview'}</h3><p className="text-[11px] text-slate-400">{viewingDocument.category || 'Advisor document'}</p></div>
              <button type="button" onClick={() => setViewingDocument(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" title="Close preview"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-950 p-4">
              {/\.pdf($|\?)/i.test(resolveDocumentUrl(viewingDocument.url || viewingDocument.path) || '') ? <iframe src={resolveDocumentUrl(viewingDocument.url || viewingDocument.path)} title="Document preview" className="h-[70vh] w-full rounded-xl bg-white" /> : <img src={resolveDocumentUrl(viewingDocument.url || viewingDocument.path)} alt={viewingDocument.fileName || viewingDocument.name || 'Document'} className="max-h-[70vh] max-w-full object-contain" />}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 bg-[#1e293b] px-5 py-3"><a href={resolveDocumentUrl(viewingDocument.url || viewingDocument.path)} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white">Open Document File</a><a href={resolveDocumentUrl(viewingDocument.url || viewingDocument.path)} download className="rounded-xl bg-[#0078d4] px-4 py-2 text-xs font-bold text-white">Download</a></div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
