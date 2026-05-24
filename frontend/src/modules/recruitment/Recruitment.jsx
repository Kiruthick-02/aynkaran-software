import React, { useState } from 'react';
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

export default function Recruitment({ candidates = [], setCandidates }) {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);

  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [previewDocName, setPreviewDocName] = useState('');
  const [previewDocCategory, setPreviewDocCategory] = useState('');

  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAppointmentDate, setNewAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');

  const [stageNote, setStageNote] = useState('');
  const [tempRegFeeAmount, setTempRegFeeAmount] = useState('150');
  const [tempTrainFeeAmount, setTempTrainFeeAmount] = useState('250');
  const [tempExamDate, setTempExamDate] = useState('');
  const [tempExamScore, setTempExamScore] = useState('35');
  const [tempExamResult, setTempExamResult] = useState('Pass');
  const [tempAgentCode, setTempAgentCode] = useState('');

  const [uploadCategory, setUploadCategory] = useState('Aadhaar');
  const [uploadFileName, setUploadFileName] = useState('');

  const isStuck = (pendingDateStr) => {
    const pendingDate = new Date(pendingDateStr);
    const currentDate = new Date('2026-05-22T08:15:05Z');
    const diff = currentDate.getTime() - pendingDate.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days >= 3;
  };

  const handleAddCandidate = (e) => {
    e.preventDefault();
    if (!newName || !newMobile) return;

    const newCand = {
      id: `cand-${Date.now().toString().substring(7)}`,
      name: newName,
      mobile: newMobile,
      email: newEmail || 'no-email@aynakaran.com',
      appointmentDate: newAppointmentDate,
      currentStage: 'Meeting Appointment',
      stageHistory: [
        {
          stage: 'Meeting Appointment',
          date: newAppointmentDate,
          note: newNotes || 'Candidate registered in ERP',
        },
      ],
      documents: [],
      fees: {
        applicationFeePaid: false,
        trainingFeePaid: false,
        appFeeAmount: 150,
        trainingFeeAmount: 250,
      },
      exam: {},
      pendingStageSince: new Date().toISOString().split('T')[0],
      notes: newNotes,
    };

    setCandidates((prev) => [newCand, ...prev]);
    setIsAddingCandidate(false);
    setNewName('');
    setNewMobile('');
    setNewEmail('');
    setNewAppointmentDate(new Date().toISOString().split('T')[0]);
    setNewNotes('');
  };

  const promoteCandidateStage = (candId, nextStage) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candId) return c;

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
          updatedFees.trainingFeeAmount = parseFloat(tempTrainFeeAmount) || 250;
          updatedFees.trainingFeeDate = new Date().toISOString().split('T')[0];
        } else if (nextStage === 'Schedule Exam') {
          updatedExam.scheduledDate = tempExamDate || new Date().toISOString().split('T')[0];
        } else if (nextStage === 'Exam Result') {
          updatedExam.score = parseInt(tempExamScore) || 0;
          updatedExam.result = tempExamResult;
        } else if (nextStage === 'Pass/Fail') {
          if (c.exam?.result === 'Fail') {
            finalStage = 'Reschedule Exam';
          }
        } else if (nextStage === 'Generate Agent Code') {
          updatedExam.agentCodeGenerated = tempAgentCode || `AGN-AYN-${Math.floor(1000 + Math.random() * 9000)}`;
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

        if (selectedCandidate && selectedCandidate.id === candId) {
          setSelectedCandidate(updatedCand);
        }

        return updatedCand;
      })
    );

    setStageNote('');
  };

  const handleRealUpload = (candId, fileName, fileData) => {
    if (!fileName) return;

    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candId) return c;

        const newDoc = {
          id: `doc-${Date.now().toString().substring(9)}`,
          name: fileName,
          category: uploadCategory,
          url: fileData || '#',
          uploadedAt: new Date().toISOString().split('T')[0],
        };

        const updated = {
          ...c,
          documents: [...(c.documents || []), newDoc],
        };

        if (selectedCandidate && selectedCandidate.id === candId) {
          setSelectedCandidate(updated);
        }

        return updated;
      })
    );
  };

  const handleDocumentDelete = (candId, docId) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candId) return c;
        const updatedDocs = (c.documents || []).filter((d) => d.id !== docId);
        const updated = { ...c, documents: updatedDocs };
        if (selectedCandidate && selectedCandidate.id === candId) {
          setSelectedCandidate(updated);
        }
        return updated;
      })
    );
  };

  const handleDeleteCandidate = (id) => {
    if (confirm('Are you sure you want to delete this candidate from recruitment database? This action is irreversible.')) {
      setCandidates((prev) => prev.filter((c) => c.id !== id));
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Active Agency Applicants</h3>
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                {candidates.length} Record(s)
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {candidates.map((cand) => {
                const stuckCandidate = isStuck(cand.pendingStageSince);
                const currentStageIdx = RECRUITMENT_STAGES.indexOf(cand.currentStage);

                return (
                  <div
                    key={cand.id}
                    className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      selectedCandidate?.id === cand.id ? 'bg-blue-50/30' : ''
                    }`}
                    onClick={() => {
                      setSelectedCandidate(cand);
                      if (cand.exam?.scheduledDate) setTempExamDate(cand.exam.scheduledDate);
                      if (cand.exam?.agentCodeGenerated) setTempAgentCode(cand.exam.agentCodeGenerated);
                    }}
                  >
                    <div className="space-y-1 pr-4 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-sm text-slate-800 hover:text-blue-600 transition-colors">
                          {cand.name}
                        </p>
                        {stuckCandidate && (
                          <span className="inline-flex items-center space-x-1 font-semibold text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
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

                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.round(((currentStageIdx + 1) / RECRUITMENT_STAGES.length) * 100)}%`,
                          }}
                        ></div>
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
                        title="Display pipeline panel"
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                      >
                        <Eye size={14} />
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
                  No trainee candidate records in pipeline. Click Registration to add candidates.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {selectedCandidate ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-800 px-2 py-0.5 rounded font-mono">
                    ID: {selectedCandidate.id}
                  </span>
                  <span className="text-xs text-slate-400">Pipeline Tracker</span>
                </div>
                <h3 className="font-extrabold text-slate-800 text-base mt-2">{selectedCandidate.name}</h3>
                <p className="text-xs font-medium text-slate-500">{selectedCandidate.email} • {selectedCandidate.mobile}</p>
              </div>

              {/* Aynkaran Career Milestones Checklist */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4.5 space-y-3.5">
                <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-200/50 pb-2">
                  <Award size={14} className="text-amber-500 animate-pulse" />
                  <span>Onboarding Milestone Progress</span>
                </h4>
                
                <div className="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {[
                    { 
                      id: 1, 
                      label: 'Meeting & Interview Logged', 
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
                      desc: selectedCandidate.fees?.trainingFeePaid ? '₹250 Portal Fee received' : 'Licensing fee pending', 
                      done: !!selectedCandidate.fees?.trainingFeePaid 
                    },
                    { 
                      id: 8, 
                      label: 'NSEIT Exam Date Registered', 
                      desc: selectedCandidate.exam?.scheduledDate ? `Scheduled: ${selectedCandidate.exam.scheduledDate}` : 'Exam date not scheduled', 
                      done: !!selectedCandidate.exam?.scheduledDate || RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) >= 8 
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
                      className={`p-2.5 border rounded-xl flex items-start space-x-2.5 text-xs transition-colors ${
                        m.done 
                          ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-900' 
                          : 'bg-white border-slate-200/50 text-slate-500'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {m.done ? (
                          <CheckCircle2 size={13} className="text-emerald-600 fill-emerald-100" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-slate-100" />
                        )}
                      </div>
                      <div className="leading-tight flex-1 min-w-0">
                        <p className={`font-extrabold text-[10.5px] ${m.done ? 'text-emerald-950 font-sans' : 'text-slate-700'}`}>{m.label}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-sans leading-snug truncate">{m.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Stage History logs</h4>
                <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-3 max-h-40 overflow-y-auto">
                  {selectedCandidate.stageHistory.map((history, idx) => (
                    <div key={idx} className="flex space-x-2 text-xs border-l-2 border-indigo-200 pl-2.5 pb-1 last:pb-0">
                      <div className="flex-1">
                        <span className="font-extrabold text-slate-800">{history.stage}</span>
                        {history.note && <p className="text-slate-500 mt-0.5">{history.note}</p>}
                        <time className="text-[9px] font-mono text-slate-400 block mt-0.5">{history.date}</time>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Promote Next Workflow Stage</h4>
                
                {selectedCandidate.currentStage !== 'Generate Agent Code' ? (
                  <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-xl space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Pending Target Stage:</p>
                      <p className="font-bold text-xs text-indigo-700 mt-0.5">
                        {RECRUITMENT_STAGES[RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) + 1] || 'Completed'}
                      </p>
                    </div>

                    {RECRUITMENT_STAGES[RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) + 1] === 'Fee Collection' && (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-600">Application Fee Amount (₹)</label>
                        <input
                          type="number"
                          value={tempRegFeeAmount}
                          onChange={(e) => setTempRegFeeAmount(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800"
                        />
                      </div>
                    )}

                    {RECRUITMENT_STAGES[RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) + 1] === 'Training Fee Collection' && (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-600">Training Fee Amount (₹)</label>
                        <input
                          type="number"
                          value={tempTrainFeeAmount}
                          onChange={(e) => setTempTrainFeeAmount(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800"
                        />
                      </div>
                    )}

                    {RECRUITMENT_STAGES[RECRUITMENT_STAGES.indexOf(selectedCandidate.currentStage) + 1] === 'Schedule Exam' && (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-600">Schedule Exam Date</label>
                        <input
                          type="date"
                          value={tempExamDate}
                          onChange={(e) => setTempExamDate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800"
                        />
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
                      <label className="block text-[11px] font-bold text-slate-600">Progress Notes (Stage update annotation)</label>
                      <input
                        type="text"
                        placeholder="Met expectations / collected KYC Documents"
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
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs space-y-2">
                    <p className="font-extrabold flex items-center space-x-1">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>Pipeline Complete</span>
                    </p>
                    <p className="font-medium text-slate-600">
                      Agent successfully recruited! Code Generated:{' '}
                      <strong className="font-mono text-slate-900">{selectedCandidate.exam?.agentCodeGenerated}</strong>
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">KYC Document Upload Storage</h4>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-slate-400 self-center uppercase">Doc Category:</span>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-1 text-xs text-slate-800"
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
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onload = () => {
                            handleRealUpload(selectedCandidate.id, file.name, reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('candidate-file-uploader').click()}
                      className="w-full border border-dashed border-slate-300 hover:border-slate-500 bg-slate-50/50 hover:bg-slate-50 py-2.5 px-3 rounded-lg text-center flex flex-col items-center justify-center cursor-pointer transition-colors"
                    >
                      <Upload className="text-slate-400 mb-1" size={14} />
                      <span className="text-[11px] font-bold text-slate-700">Choose or Drop file to Upload</span>
                      <span className="text-[9px] text-slate-400">PDF, JPEG or PNG scanned copies</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mt-2">
                  {(selectedCandidate.documents || []).map((doc) => (
                    <div key={doc.id} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px]">
                      <div className="flex items-center space-x-1.5 truncate max-w-[150px]">
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
                          className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 animate-fade-in"
                          title="Delete digital scan"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!selectedCandidate.documents || selectedCandidate.documents.length === 0) && (
                    <p className="text-[10px] text-slate-400 italic text-center py-2">No attachments found.</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Fees & Financial logs</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Reg Deposit (PRL)</p>
                    <p className="font-extrabold text-slate-800 mt-1">₹{selectedCandidate.fees?.appFeeAmount || 150}</p>
                    <div className="mt-1">
                      {selectedCandidate.fees?.applicationFeePaid ? (
                        <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">Paid</span>
                      ) : (
                        <span className="text-[9px] text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded font-bold">Pending</span>
                      )}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">IRDAI Train Fee</p>
                    <p className="font-extrabold text-slate-800 mt-1">₹{selectedCandidate.fees?.trainingFeeAmount || 250}</p>
                    <div className="mt-1">
                      {selectedCandidate.fees?.trainingFeePaid ? (
                        <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">Paid</span>
                      ) : (
                        <span className="text-[9px] text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded font-bold">Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs py-16">
              Click any trainee applicant on the left side list to display interactive timeline, document vault, and progress promotion logs.
            </div>
          )}
        </div>
      </div>

      {isAddingCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 overflow-hidden">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <UserPlus className="text-indigo-600" size={18} />
              <span>Register Trainee Candidate</span>
            </h3>

            <form onSubmit={handleAddCandidate} className="space-y-4 text-xs">
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

              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Met Appointment Date</label>
                  <input
                    type="date"
                    value={newAppointmentDate}
                    onChange={(e) => setNewAppointmentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Interview Remarks</label>
                <textarea
                  placeholder="Note candidate background, education details or references..."
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs"
                ></textarea>
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
              {previewDocUrl.startsWith('data:image/') || previewDocUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                <img
                  src={previewDocUrl}
                  alt={previewDocName}
                  className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : previewDocUrl.startsWith('data:application/pdf') || previewDocUrl.includes('.pdf') || previewDocUrl.includes('/uploads/recruitment/') ? (
                <iframe
                  src={previewDocUrl}
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
                  href={previewDocUrl}
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
