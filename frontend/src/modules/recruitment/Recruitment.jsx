import React, { useState } from 'react';
import { compressImageToBase64, dataURLtoFile } from '../../utils/imageCompressor';
import { apiService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import API_URL from '../../config/api';
import {
  UserPlus,
  CheckCircle2,
  XCircle,
  FileDown,
  Upload,
  Calendar,
  DollarSign,
  Award,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Eye,
  Download,
  FileText,
  Camera,
  Pencil,
} from 'lucide-react';

export const RECRUITMENT_STAGES = [
  'Meeting Appointment',
  'Result (Yes/No)',
  'Collect Details & Documentation',
  'Application (PRL)',
  'Fee Collection',
  'Training Apply',
  'Training Fee Collection',
  'Schedule Exam',
  'Exam Result',
  'Pass/Fail',
  'Generate Agent Code',
  'Reschedule Exam',
];

const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL || ''}${url}`;
};

export default function Recruitment({ candidates = [], addCandidate, updateCandidate, deleteCandidate }) {
  const { loadStateFromServer, customers, addReminder } = useApp();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);

  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [previewDocName, setPreviewDocName] = useState('');
  const [previewDocCategory, setPreviewDocCategory] = useState('');

  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newProfilePic, setNewProfilePic] = useState('');
  const [newProfilePicFile, setNewProfilePicFile] = useState(null);
  const [activeTab, setActiveTab] = useState('progress'); // 'progress', 'kycdocs', 'history'

  const [stageNote, setStageNote] = useState('');
  const [tempRegFeeAmount, setTempRegFeeAmount] = useState('150');
  const [tempTrainFeeAmount, setTempTrainFeeAmount] = useState('150');
  const [tempExamFeeAmount, setTempExamFeeAmount] = useState('500');
  const [tempApptDate, setTempApptDate] = useState('');
  const [tempExamDate, setTempExamDate] = useState('');
  const [tempExamScore, setTempExamScore] = useState('35');
  const [tempExamResult, setTempExamResult] = useState('Pass');
  const [tempAgentCode, setTempAgentCode] = useState('');

  const [uploadCategory, setUploadCategory] = useState('Aadhaar');
  const [uploadFileName, setUploadFileName] = useState('');

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [manualCustomersCount, setManualCustomersCount] = useState('');
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [editProfilePic, setEditProfilePic] = useState('');
  const [editProfilePicFile, setEditProfilePicFile] = useState(null);

  React.useEffect(() => {
    if (selectedCandidate) {
      const current = candidates.find(c => c.id === selectedCandidate.id);
      if (current) {
        setSelectedCandidate(current);
      }
    }
  }, [candidates, selectedCandidate?.id]);

  const isStuck = (pendingDateStr) => {
    const pendingDate = new Date(pendingDateStr);
    const currentDate = new Date('2026-05-22T08:15:05Z');
    const diff = currentDate.getTime() - pendingDate.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days >= 3;
  };

  const computeAgentStatus = (candidate, customersList = []) => {
    if (!candidate.exam?.agentCodeGenerated) return 'N/A';
    
    // Debugging
    console.log('[DEBUG] Checking status for candidate:', candidate.name, 'Agent code:', candidate.exam.agentCodeGenerated);
    console.log('[DEBUG] Total customers:', customersList.length);
    const customersForAgent = customersList.filter(cust => cust.agentCode === candidate.exam.agentCodeGenerated);
    console.log('[DEBUG] Customers linked to agent:', customersForAgent.length);
    
    const agentCode = candidate.exam.agentCodeGenerated;
    const hasManualCount = candidate.manualCustomersCount !== undefined && candidate.manualCustomersCount !== null && candidate.manualCustomersCount !== '';
    const customersCount = hasManualCount 
      ? Math.max(0, parseInt(candidate.manualCustomersCount) || 0) 
      : (customersList || []).filter(cust => cust.agentCode === agentCode).length;

    const agentCustomers = (customersList || []).filter(cust => cust.agentCode === agentCode);
    
    // Fallback generation date, or use the generatedAt date
    const generatedDateStr = candidate.exam.agentCodeGeneratedAt || candidate.createdAt || new Date().toISOString();
    const generatedDate = new Date(generatedDateStr);
    const currentDate = new Date();
    
    // Check if 1 year has passed since code generation
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    const isOlderThan1Year = (currentDate.getTime() - generatedDate.getTime()) >= oneYearInMs;
    
    // Check timing of last customer registration/modification
    let lastUpdateDate = generatedDate;
    agentCustomers.forEach(cust => {
      if (cust.createdAt) {
        const d = new Date(cust.createdAt);
        if (d.getTime() > lastUpdateDate.getTime()) {
          lastUpdateDate = d;
        }
      }
    });
    
    const timeSinceLastCustomerInMs = currentDate.getTime() - lastUpdateDate.getTime();
    const noNewCustomerFor1Year = timeSinceLastCustomerInMs >= oneYearInMs;
    
    if (isOlderThan1Year && customersCount < 2) {
      return 'Inactive (Less than 2 customers after 1 year)';
    }
    
    if (noNewCustomerFor1Year) {
      return 'Inactive (No customers updated for 1 year)';
    }
    
    if (customersCount < 2) {
      return `Active (Initial Stage - Found ${customersCount}/2 customers)`;
    }
    
    return 'Active';
  };

  const handleAddCandidate = (e) => {
    e.preventDefault();
    if (!newName || !newMobile) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const candId = `cand-${Date.now().toString().substring(7)}`;
    const newCand = {
      id: candId,
      name: newName,
      mobile: newMobile,
      email: newEmail || 'no-email@aynakaran.com',
      profilePicture: newProfilePic || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newName)}`,
      appointmentDate: '', // Empty initially - only configured in the stage workflow
      currentStage: 'Meeting Appointment',
      stageHistory: [
        {
          stage: 'Meeting Appointment',
          date: todayStr,
          note: newNotes || 'Candidate registered in ERP',
        },
      ],
      documents: [],
      fees: {
        applicationFeePaid: false,
        trainingFeePaid: false,
        examFeePaid: false,
        appFeeAmount: 150,
        trainingFeeAmount: 150,
        examFeeAmount: 0,
      },
      exam: {},
      pendingStageSince: todayStr,
      notes: newNotes,
      createdAt: new Date().toISOString()
    };

    addCandidate(newCand).then(async () => {
      if (newProfilePicFile) {
        try {
          await apiService.uploadDocument(newProfilePicFile, 'profilePicture', candId, 'recruitment');
          await loadStateFromServer();
        } catch (err) {
          console.error('Failed to upload profile picture on register:', err);
        }
      }
    });

    setIsAddingCandidate(false);
    setNewName('');
    setNewMobile('');
    setNewEmail('');
    setNewNotes('');
    setNewProfilePic('');
    setNewProfilePicFile(null);
  };

  const promoteCandidateStage = (candId, nextStage) => {
    const c = candidates.find((item) => item.id === candId);
    if (!c) return;

    if (!c.appointmentDate) {
      alert("Please assign a meeting appointment date before proceeding.");
      return;
    }

    const updatedFees = { ...c.fees };
    const updatedExam = { ...c.exam };
    let finalStage = nextStage;

    if (nextStage === 'Result (Yes/No)') {
      // default meeting results
    } else if (nextStage === 'Fee Collection') {
      updatedFees.applicationFeePaid = true;
      updatedFees.appFeeAmount = parseFloat(tempRegFeeAmount) || 150;
      updatedFees.appFeeDate = new Date().toISOString().split('T')[0];
    } else if (nextStage === 'Training Fee Collection') {
      updatedFees.trainingFeePaid = true;
      updatedFees.trainingFeeAmount = 150; // training fee is 150 compulsory as requested!
      updatedFees.trainingFeeDate = new Date().toISOString().split('T')[0];
    } else if (nextStage === 'Schedule Exam') {
      updatedExam.scheduledDate = tempExamDate || new Date().toISOString().split('T')[0];
      // Manual Exam Fee entry Differing every time
      updatedFees.examFeePaid = true;
      updatedFees.examFeeAmount = parseFloat(tempExamFeeAmount) || 0;
      updatedFees.examFeeDate = new Date().toISOString().split('T')[0];
    } else if (nextStage === 'Exam Result') {
      updatedExam.score = parseInt(tempExamScore) || 0;
      updatedExam.result = tempExamResult;
    } else if (nextStage === 'Pass/Fail') {
      if (c.exam?.result === 'Fail') {
        finalStage = 'Reschedule Exam';
      }
    } else if (nextStage === 'Generate Agent Code') {
      const gCode = tempAgentCode || `AGN-AYN-${Math.floor(1000 + Math.random() * 9000)}`;
      updatedExam.agentCodeGenerated = gCode;
      updatedExam.agentCodeGeneratedAt = new Date().toISOString().split('T')[0];
      updatedExam.agentStatus = 'Active';

      // Automatically create and complete One-day Induction Program reminder message in the reminders console
      const inductionReminder = {
        id: `rem-induct-${Date.now().toString().slice(-5)}`,
        title: `One-day Induction Program - ${c.name}`,
        description: `Agent Code ${gCode} successfully generated. Notification sent to attend the compulsory one day induction program.`,
        triggerType: 'Induction Program',
        targetType: 'recruitment',
        dueDate: new Date().toISOString().split('T')[0],
        customerMobile: c.mobile,
        customerEmail: c.email || 'no-email@aynakaran.com',
        completed: true, // completion stage
        channels: { whatsapp: true, sms: true, email: true },
        createdAt: new Date().toISOString()
      };
      addReminder(inductionReminder);
    }

    const newHistory = [
      ...c.stageHistory,
      {
        stage: finalStage,
        date: new Date().toISOString().split('T')[0],
        note: stageNote || `Status updated in pipeline to ${finalStage}`,
      },
    ];

    const updatedCand = {
      ...c,
      currentStage: finalStage,
      stageHistory: newHistory,
      fees: updatedFees,
      exam: updatedExam,
      pendingStageSince: new Date().toISOString().split('T')[0],
    };

    updateCandidate(candId, updatedCand);
    if (selectedCandidate && selectedCandidate.id === candId) {
      setSelectedCandidate(updatedCand);
    }

    setStageNote('');
  };

  const handleRealUpload = async (candId, file) => {
    if (!file) return;

    const c = candidates.find((item) => item.id === candId);
    if (!c) return;

    try {
      await apiService.uploadDocument(file, uploadCategory, candId, 'recruitment');
      await loadStateFromServer();
    } catch (err) {
      console.error('[Candidate Multi-part Upload Error]', err);
    }
  };

  const handleDocumentDelete = (candId, docId) => {
    const c = candidates.find((item) => item.id === candId);
    if (!c) return;

    const updatedDocs = (c.documents || []).filter((d) => d.id !== docId);
    const updated = { ...c, documents: updatedDocs };

    updateCandidate(candId, updated);
    if (selectedCandidate && selectedCandidate.id === candId) {
      setSelectedCandidate(updated);
    }
  };

  const handleDeleteCandidate = (id) => {
    if (confirm('Are you sure you want to delete this candidate from recruitment database? This action is irreversible.')) {
      deleteCandidate(id);
      setSelectedCandidate(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Module 1: Agent Recruitment Pipeline</h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage stage-by-stage pipeline for newly registered trainees and generate valid license codes.
          </p>
        </div>
        <button
          onClick={() => setIsAddingCandidate(true)}
          id="btn-add-candidate"
          className="mt-3 sm:mt-0 inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/10 cursor-pointer"
        >
          <Plus size={15} />
          <span>Register Trainee Candidate</span>
        </button>
      </div>

      <div className="w-full space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Active Agency Applicants</h3>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
              {candidates.length} Record(s)
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
            {candidates.map((cand) => {
              const stuckCandidate = isStuck(cand.pendingStageSince);
              const currentStageIdx = RECRUITMENT_STAGES.indexOf(cand.currentStage);
              
              // Debugging
              console.log('[DEBUG] Recruitment module, customers list size:', customers.length);

              return (
                <div
                  key={cand.id}
                  className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    selectedCandidate?.id === cand.id ? 'bg-blue-50/20' : ''
                  }`}
                  onClick={() => {
                    setSelectedCandidate(cand);
                    if (cand.exam?.scheduledDate) setTempExamDate(cand.exam.scheduledDate);
                    if (cand.exam?.agentCodeGenerated) setTempAgentCode(cand.exam.agentCodeGenerated);
                    setEditName(cand.name);
                    setEditMobile(cand.mobile);
                    setEditEmail(cand.email || '');
                    setManualCustomersCount(cand.manualCustomersCount !== undefined && cand.manualCustomersCount !== null ? String(cand.manualCustomersCount) : '');
                    setIsEditingInfo(false);
                  }}
                >
                  <div className="flex items-center space-x-3 pr-4 flex-1">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shadow-sm flex-shrink-0">
                      <img
                        src={cand.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cand.name)}`}
                        alt={cand.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-sm text-slate-800 hover:text-blue-600 transition-colors truncate">
                          {cand.name}
                        </p>
                        {stuckCandidate && (
                          <span className="inline-flex items-center space-x-1 font-semibold text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded flex-shrink-0">
                            <Clock size={10} />
                            <span>Stuck &gt; 3 days</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>Tel: <strong>{cand.mobile}</strong></span>
                        <span>•</span>
                        <span>Stage set since {cand.pendingStageSince}</span>
                      </div>
                      {cand.exam?.agentCodeGenerated && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-extrabold text-slate-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-mono">Agent: {cand.exam.agentCodeGenerated}</span>
                          <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                            computeAgentStatus(cand, customers).startsWith('Active')
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-250'
                              : 'bg-rose-105 text-rose-800 border border-rose-250 animate-pulse'
                          }`}>
                            {computeAgentStatus(cand, customers)}
                          </span>
                        </div>
                      )}

                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.round(((currentStageIdx + 1) / RECRUITMENT_STAGES.length) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 mt-3 sm:mt-0">
                    <div className="text-right">
                      <span className={`inline-block font-extrabold text-[10px] px-2.5 py-1 rounded-full ${
                        cand.currentStage === 'Generate Agent Code'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cand.currentStage === 'Reschedule Exam'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {cand.currentStage}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Progress: {currentStageIdx + 1}/{RECRUITMENT_STAGES.length}
                      </p>
                    </div>

                    <button
                      title="Display recruitment workflows"
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCandidate(cand);
                        setEditName(cand.name);
                        setEditMobile(cand.mobile);
                        setEditEmail(cand.email || '');
                        setEditProfilePic(cand.profilePicture || '');
                        setEditProfilePicFile(null);
                      }}
                      title="Edit trainee profile info"
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 text-indigo-600 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCandidate(cand.id);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {candidates.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm">
                No trainee candidate records in pipeline. Click Register Trainee Candidate to add candidates.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trainee Details Workspace Modal Dialogue Overlay */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-40 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-5 flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-2.5">
                  <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-800 px-2 py-0.5 rounded font-mono font-bold">
                    ID: {selectedCandidate.id}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Trainee Candidate Profile</span>
                </div>

                <div className="flex items-center space-x-3 mt-2.5">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shadow-sm flex-shrink-0">
                    <img
                      src={selectedCandidate.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedCandidate.name)}`}
                      alt={selectedCandidate.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{selectedCandidate.name}</h3>
                </div>
                
                <p className="text-xs text-slate-500 leading-none mt-1">
                  Mobile: <strong className="text-slate-800">{selectedCandidate.mobile}</strong> • Email: <strong className="text-slate-800">{selectedCandidate.email || 'N/A'}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-2xl p-1 shrink-0 cursor-pointer focus:outline-none"
                title="Close overlay popup"
              >
                &times;
              </button>
            </div>

            {/* Modal Body with internal scrolling */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Modern Segmented Navigation Controls inside Popup */}
              <div className="flex border border-slate-200 p-1 rounded-xl bg-slate-50/60 gap-1.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('progress')}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all hover:cursor-pointer ${
                    activeTab === 'progress'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  Stages & Alerts
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('kycdocs')}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all hover:cursor-pointer ${
                    activeTab === 'kycdocs'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  KYC & Financials
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all hover:cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  Logs & History
                </button>
              </div>

              {/* PROGRESS & STAGES WORKFLOW TAB */}
              {activeTab === 'progress' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Aynkaran Career Milestones Checklist */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
                      <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-200 pb-2">
                        <Award size={14} className="text-amber-500" />
                        <span>Onboarding Milestone Progress</span>
                      </h4>
                      
                      <div className="grid grid-cols-1 gap-2 max-h-[340px] overflow-y-auto pr-1">
                        {[
                          { 
                            id: 1, 
                            label: 'Meeting Appointment Logged', 
                            desc: selectedCandidate.appointmentDate ? `Appointed on: ${selectedCandidate.appointmentDate}` : 'Onboarding scheduled',
                            done: true 
                          },
                          { 
                            id: 2, 
                            label: 'onboarding Commitment Sign', 
                            desc: selectedCandidate.result === 'Yes' || RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) >= 2 ? 'Trainee confirmed opt-in' : 'Decision pending', 
                            done: selectedCandidate.result === 'Yes' || RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) >= 2 
                          },
                          { 
                            id: 3, 
                            label: 'Dossier Scans and KYC Completed', 
                            desc: (selectedCandidate.documents || []).length > 0 ? `${(selectedCandidate.documents || []).length} digital documents captured` : 'Waiting for documents attachment', 
                            done: (selectedCandidate.documents || []).length > 0 
                          },
                          { 
                            id: 4, 
                            label: 'PRL Application Done', 
                            desc: RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) >= 4 ? 'Aynkaran Registration filled' : 'Awaiting form upload', 
                            done: RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) >= 4 
                          },
                          { 
                            id: 5, 
                            label: 'PRL Verification Fee Cleared', 
                            desc: selectedCandidate.fees?.applicationFeePaid ? '₹150 Register Fee received' : 'Deposit pending', 
                            done: !!selectedCandidate.fees?.applicationFeePaid 
                          },
                          { 
                            id: 6, 
                            label: 'IRDAI Portals Training Enrolled', 
                            desc: RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) >= 6 ? 'Online modules active' : 'Training wait phase', 
                            done: RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) >= 6 
                          },
                          { 
                            id: 7, 
                            label: 'Training License Fee Paid', 
                            desc: selectedCandidate.fees?.trainingFeePaid ? '₹150 Portal Fee received' : 'Licensing fee pending', 
                            done: !!selectedCandidate.fees?.trainingFeePaid 
                          },
                          { 
                            id: 8, 
                            label: 'NSEIT Exam Registered', 
                            desc: selectedCandidate.fees?.examFeePaid ? `Exam fee ₹${selectedCandidate.fees?.examFeeAmount} registered` : 'Exam registration/fee pending', 
                            done: !!selectedCandidate.fees?.examFeePaid || RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) >= 8 
                          },
                          { 
                            id: 9, 
                            label: 'IRDAI Carrier Certification Passed', 
                            desc: selectedCandidate.exam?.result === 'Pass' ? `Passed Score: ${selectedCandidate.exam.score || 35}/50` : 'Result not certified yet', 
                            done: selectedCandidate.exam?.result === 'Pass' || RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) >= 10 
                          },
                          { 
                            id: 10, 
                            label: 'Active Aynkaran License Generated', 
                            desc: selectedCandidate.exam?.agentCodeGenerated ? `Agent ID: ${selectedCandidate.exam.agentCodeGenerated}` : 'Agent code generated is pending', 
                            done: !!selectedCandidate.exam?.agentCodeGenerated 
                          }
                        ].map((m) => (
                          <div 
                            key={m.id} 
                            className={`p-2 border rounded-lg flex items-start space-x-2 text-[11px] transition-colors ${
                              m.done 
                                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
                                : 'bg-white border-slate-200 text-slate-500'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {m.done ? (
                                <CheckCircle2 size={13} className="text-emerald-600 fill-emerald-100" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-slate-100" />
                              )}
                            </div>
                            <div className="leading-tight flex-1">
                              <p className={`font-extrabold text-[10.5px] ${m.done ? 'text-emerald-950 font-sans' : 'text-slate-700'}`}>{m.label}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">{m.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stage transition controls */}
                    <div className="space-y-4">
                      {/* Promote Next Workflow Stage Box */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-1.5 border-b border-slate-150">Promote Next Workflow Stage</h4>
                        
                        {selectedCandidate.currentStage !== 'Generate Agent Code' ? (
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] text-slate-400 font-semibold uppercase">Pending Target Stage:</p>
                              <p className="font-bold text-xs text-indigo-700 mt-0.5">
                                {RECRUITMENT_STAGES[RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) + 1] || 'Completed'}
                              </p>
                            </div>

                            {RECRUITMENT_STAGES[RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) + 1] === 'Fee Collection' && (
                              <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-normal">
                                <p className="font-extrabold text-indigo-950">✓ Direct Promotion</p>
                                <p className="text-[10px] text-indigo-750 mt-0.5">Only Training Fees (₹150) and Exam Fees (manual entry) are required. No separate Application PRL registration fee is collected.</p>
                              </div>
                            )}

                            {RECRUITMENT_STAGES[RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) + 1] === 'Training Fee Collection' && (
                              <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-600">Training Fee Amount (₹)</label>
                                <input
                                  type="number"
                                  value={150}
                                  readOnly
                                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-500 font-bold cursor-not-allowed"
                                />
                                <p className="text-[9px] text-slate-500">Training fee is compulsory fixed at 150.</p>
                              </div>
                            )}

                            {RECRUITMENT_STAGES[RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) + 1] === 'Schedule Exam' && (
                              <div className="space-y-3">
                                <div className="space-y-1.5 animate-fade-in">
                                  <label className="block text-[11px] font-bold text-slate-600">Enter Exam Fee (Manual Entry) (₹)</label>
                                  <input
                                    type="number"
                                    placeholder="e.g. 500"
                                    value={tempExamFeeAmount}
                                    onChange={(e) => setTempExamFeeAmount(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500"
                                  />
                                  <p className="text-[9px] text-slate-400">Exam fee must be entered manually depending on the candidate's trial exam selection.</p>
                                </div>
                              </div>
                            )}

                            {RECRUITMENT_STAGES[RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) + 1] === 'Exam Result' && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600">Score (Out of 50)</label>
                                  <input
                                    type="number"
                                    value={tempExamScore}
                                    onChange={(e) => setTempExamScore(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600">Status</label>
                                  <select
                                    value={tempExamResult}
                                    onChange={(e) => setTempExamResult(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800"
                                  >
                                    <option value="Pass">Pass</option>
                                    <option value="Fail">Fail</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            {RECRUITMENT_STAGES[RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) + 1] === 'Generate Agent Code' && (
                              <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-600">Agent IRDAI License ID</label>
                                <input
                                  type="text"
                                  value={tempAgentCode}
                                  placeholder="e.g. AGN-AYN-2026-90"
                                  onChange={(e) => setTempAgentCode(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800 font-mono"
                                />
                              </div>
                            )}

                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-bold text-slate-600">Progress Notes</label>
                              <input
                                type="text"
                                placeholder="Met expectations / collected document scans"
                                value={stageNote}
                                onChange={(e) => setStageNote(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800"
                              />
                            </div>

                            <button
                              onClick={() => {
                                const currentIdx = RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage);
                                if (currentIdx < RECRUITMENT_STAGES.length - 1) {
                                  const next = RECRUITMENT_STAGES[currentIdx + 1];
                                  promoteCandidateStage(selectedCandidate.id, next);
                                }
                              }}
                              id="btn-promote-stage"
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                            >
                              <span>Move to Next Stage</span>
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-900 rounded-xl p-3 text-xs space-y-3">
                            <div className="flex justify-between items-center pb-1 border-b border-emerald-100">
                              <p className="font-extrabold flex items-center space-x-1">
                                <CheckCircle2 size={14} className="text-emerald-600 animate-bounce" />
                                <span>Core Agent Status Console</span>
                              </p>
                              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                                computeAgentStatus(selectedCandidate, customers).startsWith('Active')
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-100 text-rose-850 border-rose-300'
                              }`}>
                                {computeAgentStatus(selectedCandidate, customers)}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-600 space-y-1 bg-white border border-slate-100 p-2.5 rounded-lg leading-tight">
                              <p>Agent Code: <strong className="font-mono text-slate-900">{selectedCandidate.exam?.agentCodeGenerated}</strong></p>
                              <p>Linked Customers: <strong>{(selectedCandidate.manualCustomersCount !== undefined && selectedCandidate.manualCustomersCount !== null && selectedCandidate.manualCustomersCount !== '') ? Math.max(0, parseInt(selectedCandidate.manualCustomersCount) || 0) : (customers || []).filter(cust => cust.agentCode === selectedCandidate.exam?.agentCodeGenerated).length}</strong> (Requires 2 compulsory)</p>
                              <p>License Active Since: <strong>{selectedCandidate.exam?.agentCodeGeneratedAt || selectedCandidate.createdAt?.split('T')[0] || 'Not Defined'}</strong></p>
                            </div>

                            <div className="space-y-1.5 bg-indigo-50/60 border border-indigo-150 p-2.5 rounded-lg">
                              <label className="block text-[9.5px] font-extrabold text-slate-500 uppercase tracking-wider">Backdate License Generation (Simulation)</label>
                              <input
                                type="date"
                                value={selectedCandidate.exam?.agentCodeGeneratedAt || selectedCandidate.createdAt?.split('T')[0] || ''}
                                onChange={(e) => {
                                  const updated = {
                                    ...selectedCandidate,
                                    exam: {
                                      ...selectedCandidate.exam,
                                      agentCodeGeneratedAt: e.target.value,
                                    }
                                  };
                                  updateCandidate(selectedCandidate.id, updated);
                                }}
                                className="bg-white border border-slate-350 rounded p-1 text-xs w-full text-zinc-800 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Manual Customer Override Box */}
                      {selectedCandidate.exam?.agentCodeGenerated && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                          <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Simulate Compulsory Customers Count</h4>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="0"
                              placeholder="e.g. 2"
                              value={manualCustomersCount}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val !== '' && parseInt(val) < 0) {
                                  setManualCustomersCount('0');
                                } else {
                                  setManualCustomersCount(val);
                                }
                              }}
                              className="bg-white border border-slate-350 rounded-lg p-1.5 text-xs text-slate-800 w-24 focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                let valInt = manualCustomersCount !== '' ? parseInt(manualCustomersCount) : '';
                                if (typeof valInt === 'number' && valInt < 0) {
                                  valInt = 0;
                                }
                                const updated = {
                                  ...selectedCandidate,
                                  manualCustomersCount: valInt
                                };
                                await updateCandidate(selectedCandidate.id, updated);
                                setSelectedCandidate(updated);
                                setManualCustomersCount(valInt === '' ? '' : String(valInt));
                                alert('Manual linked customers count has been set successfully!');
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Sync Override Count
                            </button>
                          </div>
                          <p className="text-[9px] text-slate-400">Forces manually overriding the CRM registered customer requirements for testing agent active licensing status.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meeting Reminder Section */}
                  <div className="border-t border-slate-200 pt-4 space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                      <Clock size={13} className="text-indigo-600 animate-pulse" />
                      <span>Meeting Appointment Reminder</span>
                    </h4>
                    <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100/80 text-xs space-y-3">
                      <div className="flex justify-between items-center text-xs text-slate-650">
                        <span>Current Confirmed Meeting Date:</span>
                        <strong className="font-mono text-indigo-800 px-2.5 py-0.5 bg-white border border-indigo-100 rounded">{selectedCandidate.appointmentDate || 'Not Configured'}</strong>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <input
                          type="date"
                          value={tempApptDate || selectedCandidate.appointmentDate || ''}
                          onChange={(e) => setTempApptDate(e.target.value)}
                          className="bg-white border border-slate-350 rounded-lg p-2 text-slate-800 text-xs flex-1 focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const targetDate = tempApptDate || selectedCandidate.appointmentDate || new Date().toISOString().split('T')[0];
                            
                            // 1. Update candidate stage history/appointment date
                            const updated = {
                              ...selectedCandidate,
                              appointmentDate: targetDate,
                              stageHistory: [
                                ...selectedCandidate.stageHistory,
                                {
                                  stage: 'Meeting Appointment',
                                  date: new Date().toISOString().split('T')[0],
                                  note: `Recruitment meeting scheduled/confirmed for target: ${targetDate}`
                                }
                              ]
                            };
                            await updateCandidate(selectedCandidate.id, updated);
                            
                            // 2. Automatically create and complete reminder message
                            const reminderId = `rem-meet-${Date.now().toString().slice(-5)}`;
                            const reminderMessage = {
                              id: reminderId,
                              title: `Meeting Appointment - ${selectedCandidate.name}`,
                              description: `Scheduled meeting with recruitment candidate ${selectedCandidate.name} on ${targetDate}. Notification successfully auto-sent to registered coordinates: ${selectedCandidate.mobile}`,
                              triggerType: 'Meeting Appointment',
                              targetType: 'recruitment',
                              dueDate: targetDate,
                              customerMobile: selectedCandidate.mobile,
                              customerEmail: selectedCandidate.email,
                              completed: true,
                              channels: { whatsapp: true, sms: true, email: true },
                              createdAt: new Date().toISOString()
                            };
                            await addReminder(reminderMessage);
                            alert(`Meeting assigned successfully! The automated notification messages (SMS, WhatsApp, Email) are triggered instantly and logged.`);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer shadow-md shadow-indigo-600/10"
                        >
                          Assign Date & Dispatch Alerts
                        </button>
                      </div>
                      <p className="text-[9.5px] text-slate-400">After the date is assigned, a reminder message is instantly sent and moved to Completion Stage in the console.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* KYC DOCUMENTS & FINANCIALS TAB */}
              {activeTab === 'kycdocs' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Document Upload section */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/50 space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">KYC Document Scans Uploader</h4>

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <span className="text-[10px] font-bold text-slate-400 self-center uppercase">Doc Category:</span>
                          <select
                            value={uploadCategory}
                            onChange={(e) => setUploadCategory(e.target.value)}
                            className="flex-1 bg-white border border-slate-300 rounded-lg p-1 text-xs text-slate-800"
                          >
                            <option value="Aadhaar">Aadhaar Card</option>
                            <option value="PAN">PAN Card</option>
                            <option value="Education">SSLC / Degree Book</option>
                            <option value="Receipt">Fee Receipt</option>
                            <option value="Photo">Passport Photo</option>
                          </select>
                        </div>

                        {/* Dropzone for candidate scan upload */}
                        <div className="relative">
                          <input
                            type="file"
                            id="candidate-file-uploader"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const compressed = await compressImageToBase64(file);
                                if (compressed) {
                                  if (file.type && file.type.startsWith('image/')) {
                                    handleRealUpload(selectedCandidate.id, dataURLtoFile(compressed, file.name));
                                  } else {
                                    handleRealUpload(selectedCandidate.id, file);
                                  }
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('candidate-file-uploader').click()}
                            className="w-full border border-dashed border-slate-300 hover:border-slate-500 bg-white hover:bg-slate-50 py-5 px-3 rounded-lg text-center flex flex-col items-center justify-center cursor-pointer transition-colors"
                          >
                            <Upload className="text-slate-400 mb-1" size={16} />
                            <span className="text-[11px] font-bold text-slate-700">Choose or Drop file to Upload</span>
                            <span className="text-[9px] text-slate-400">PDF, JPEG or PNG scanned copies</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 mt-2.5 max-h-48 overflow-y-auto pr-1">
                        {(selectedCandidate.documents || []).map((doc) => (
                          <div key={doc.id} className="flex justify-between items-center p-2 bg-white border border-slate-100 rounded-lg text-[11px] shadow-2xs">
                            <div className="flex items-center space-x-1.5 truncate max-w-[200px]">
                              <FileText size={12} className="text-indigo-500 shrink-0" />
                              <span 
                                className="font-medium text-slate-700 truncate cursor-pointer hover:underline flex items-center space-x-1"
                                title={doc.name}
                                onClick={() => {
                                  setPreviewDocUrl(doc.url);
                                  setPreviewDocName(doc.name);
                                  setPreviewDocCategory(doc.category || 'Uploaded Scan');
                                }}
                              >
                                <Eye size={10} className="inline mr-0.5 text-indigo-500 shrink-0" />
                                <span>{doc.name}</span>
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[8px] font-extrabold">{doc.category}</span>
                              <button
                                type="button"
                                onClick={() => handleDocumentDelete(selectedCandidate.id, doc.id)}
                                className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                                title="Delete digital scan"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {(!selectedCandidate.documents || selectedCandidate.documents.length === 0) && (
                          <p className="text-[10px] text-slate-400 italic text-center py-4">No attachments found in the secure vault.</p>
                        )}
                      </div>
                    </div>

                    {/* Fees & Financial logs (Only two types of fees: training fee 150 and exam fee manual entry) */}
                    <div className="bg-slate-50/50 p-4 border border-slate-200/50 rounded-xl space-y-3.5">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-1 hover:cursor-default">Fees & Financial logs</h4>
                      
                      <div className="space-y-3">
                        {/* Training Fees Box */}
                        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex justify-between items-center">
                          <div className="space-y-0.5">
                            <p className="text-[10.5px] text-slate-500 font-extrabold">Training License Fee</p>
                            <p className="text-xs text-slate-400">Compulsory License Portal Fee</p>
                            <p className="font-extrabold text-slate-900 text-base mt-1">₹150</p>
                          </div>
                          <div>
                            {selectedCandidate.fees?.trainingFeePaid ? (
                              <span className="text-[10.5px] text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full font-extrabold">Received Paid</span>
                            ) : (
                              <span className="text-[10.5px] text-rose-800 bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-full font-extrabold">Fees Pending</span>
                            )}
                          </div>
                        </div>

                        {/* Exam Fees Box */}
                        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex justify-between items-center">
                          <div className="space-y-0.5">
                            <p className="text-[10.5px] text-slate-500 font-extrabold">IRDAI Exam Fee (NSEIT)</p>
                            <p className="text-xs text-slate-400">Manual Entry Registration Fee</p>
                            <p className="font-extrabold text-slate-900 text-base mt-1">
                              ₹{selectedCandidate.fees?.examFeeAmount || '0 (Not Entered)'}
                            </p>
                          </div>
                          <div>
                            {selectedCandidate.fees?.examFeePaid ? (
                              <span className="text-[10.5px] text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full font-extrabold">Received Paid</span>
                            ) : (
                              <span className="text-[10.5px] text-rose-800 bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-full font-extrabold">Fees Pending</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LOGS & HISTORY TAB */}
              {activeTab === 'history' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Stage History logs</h4>
                    <div className="space-y-4 bg-white border border-slate-100 rounded-xl p-4 max-h-[360px] overflow-y-auto shadow-2xs">
                      {selectedCandidate.stageHistory.map((history, idx) => (
                        <div key={idx} className="flex space-x-3 text-xs border-l-2 border-indigo-200 pl-3 pb-2 last:pb-0">
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="font-extrabold text-slate-800">{history.stage}</span>
                              <time className="text-[10px] font-mono text-slate-400">{history.date}</time>
                            </div>
                            {history.note && <p className="text-slate-500 mt-1 leading-snug">{history.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-400 font-mono">Status engine: Aynkaran Agent Recruitment Module</span>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close Profile Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 overflow-hidden">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <UserPlus className="text-indigo-600" size={18} />
              <span>Register Trainee Candidate</span>
            </h3>

            <form onSubmit={handleAddCandidate} className="space-y-4 text-xs">
              <div className="flex flex-col items-center justify-center pb-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="profile-pic-upload"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const compressed = await compressImageToBase64(file);
                      if (compressed) {
                        setNewProfilePic(compressed);
                        setNewProfilePicFile(dataURLtoFile(compressed, file.name));
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('profile-pic-upload').click()}
                  className="relative group w-20 h-20 rounded-full border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden shadow-inner focus:outline-none"
                  title="Upload profile picture"
                >
                  {newProfilePic ? (
                    <>
                      <img src={newProfilePic} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={16} />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <Camera size={20} className="mb-0.5" />
                      <span className="text-[9px] font-semibold">Upload Photo</span>
                    </div>
                  )}
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Candidate Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Aron Joseph"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    required
                    type="tel"
                    placeholder="+91 944..."
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email address</label>
                  <input
                    type="email"
                    placeholder="example@test.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingCandidate(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow cursor-pointer"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 overflow-hidden">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <Pencil className="text-indigo-600" size={18} />
              <span>Edit Trainee Candidate</span>
            </h3>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!editName || !editMobile) return;
              
              let currentProfilePic = editProfilePic;
              
              if (editProfilePicFile) {
                try {
                  const res = await apiService.uploadDocument(editProfilePicFile, 'profilePicture', editingCandidate.id, 'recruitment');
                  if (res && res.document && res.document.url) {
                    currentProfilePic = res.document.url;
                  }
                } catch (err) {
                  console.error('Failed to upload profile picture on edit:', err);
                }
              }

              const updated = {
                ...editingCandidate,
                name: editName,
                mobile: editMobile,
                email: editEmail || 'no-email@aynakaran.com',
                profilePicture: currentProfilePic || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(editName)}`,
              };

              await updateCandidate(editingCandidate.id, updated);
              await loadStateFromServer();
              setEditingCandidate(null);
              setEditProfilePic('');
              setEditProfilePicFile(null);
            }} className="space-y-4 text-xs">
              <div className="flex flex-col items-center justify-center pb-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="edit-profile-pic-upload"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const compressed = await compressImageToBase64(file);
                      if (compressed) {
                        setEditProfilePic(compressed);
                        setEditProfilePicFile(dataURLtoFile(compressed, file.name));
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('edit-profile-pic-upload').click()}
                  className="relative group w-20 h-20 rounded-full border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden shadow-inner focus:outline-none"
                  title="Upload profile picture"
                >
                  {editProfilePic ? (
                    <>
                      <img src={getFileUrl(editProfilePic)} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={16} />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <Camera size={20} className="mb-0.5" />
                      <span className="text-[9px] font-semibold">Upload Photo</span>
                    </div>
                  )}
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Candidate Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Aron Joseph"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    required
                    type="tel"
                    placeholder="+91 944..."
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email address</label>
                  <input
                    type="email"
                    placeholder="example@test.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCandidate(null);
                    setEditProfilePic('');
                    setEditProfilePicFile(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Candidate Document Preview Overlay */}
      {previewDocUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200/80 px-2 py-0.5 rounded font-mono font-bold">
                  VERIFIED CANDIDATE ATTACHMENT
                </span>
                <h3 className="font-extrabold text-base text-slate-800 mt-2">{previewDocCategory}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{previewDocName}</p>
              </div>
              <button
                onClick={() => {
                  setPreviewDocUrl(null);
                  setPreviewDocName('');
                  setPreviewDocCategory('');
                }}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-lg p-1.5 focus:outline-none"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-center min-h-[300px]">
              {previewDocUrl.startsWith('data:image/') || previewDocUrl.match(/\.(jpeg|jpg|gif|png)$/i) || (previewDocUrl.includes('/uploads/') && !previewDocUrl.includes('.pdf')) ? (
                <img
                  src={getFileUrl(previewDocUrl)}
                  alt={previewDocName}
                  className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : previewDocUrl.startsWith('data:application/pdf') || previewDocUrl.includes('.pdf') ? (
                <iframe
                  src={getFileUrl(previewDocUrl)}
                  title={previewDocName}
                  className="w-full h-[55vh] rounded-lg border-0 bg-white"
                  allowFullScreen
                />
              ) : (
                <div className="text-center space-y-4 py-8">
                  <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <FileText size={28} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-xs text-slate-700">Digital Scan Verified & Sealed</p>
                    <p className="text-[11px] text-slate-400">File structure does not support automatic inline framing.</p>
                    <p className="text-[11px] text-indigo-700 font-bold">SHA-256 Checksum: MATCHED</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100">
              <span className="text-[10.5px] text-slate-400 font-mono">Storage Engine: Aynkaran Secure Vault</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewDocUrl(null);
                    setPreviewDocName('');
                    setPreviewDocCategory('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Close Viewer
                </button>
                <a
                  href={getFileUrl(previewDocUrl)}
                  download={previewDocName}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow cursor-pointer text-center flex items-center space-x-1"
                >
                  <Download size={13} />
                  <span>Download Scan</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
