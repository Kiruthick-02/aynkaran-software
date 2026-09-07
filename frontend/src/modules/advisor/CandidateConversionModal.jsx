import React, { useState, useEffect } from 'react';
import { X, Check, ShieldCheck, AlertCircle, Building, Award, UserCheck, AlertTriangle } from 'lucide-react';
import { advisorApi } from '../../services/advisorApi';
import { apiService } from '../../services/api';

export default function CandidateConversionModal({
  isOpen,
  candidate,
  hierarchyOptions = { abps: [], level1Managers: [] },
  onClose,
  onSuccess,
  onShowNotification
}) {
  const [advisorCode, setAdvisorCode] = useState('');
  const [company, setCompany] = useState('SBI Life Insurance');
  const [companyId, setCompanyId] = useState('comp-sbi');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAbp, setSelectedAbp] = useState('');
  const [selectedL1, setSelectedL1] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);

  useEffect(() => {
    if (candidate) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setAdvisorCode('ADV-' + randomSuffix);
      setLicenseNumber('IRDA/AG/' + new Date().getFullYear() + '/' + randomSuffix);
      setCompany(candidate.insuranceCompany || 'SBI Life Insurance');
      setRemarks('Converted from recruitment candidate pipeline (' + candidate.id + ').');
      setErrorBanner(null);

      const d = new Date();
      d.setFullYear(d.getFullYear() + 3);
      setExpiryDate(d.toISOString().split('T')[0]);
    }
  }, [candidate]);

  if (!isOpen || !candidate) return null;

  const isTrainingComplete = candidate.trainingStatus === 'Completed' ||
    (candidate.stageHistory && candidate.stageHistory.some(h => h.stage === 'Training Completed' || h.stage === 'Training'));
  const isExamPassed = candidate.examStatus === 'Passed' || candidate.result === 'Pass' || candidate.result === 'Passed' || candidate.exam?.result === 'Pass';
  const isAlreadyConverted = candidate.isConvertedToAdvisor === true;

  const filteredL1s = hierarchyOptions.level1Managers.filter(l1 => {
    if (!selectedAbp) return true;
    return l1.abpId === selectedAbp || l1.abpCode === selectedAbp;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorBanner(null);

    if (!advisorCode.trim()) {
      setErrorBanner('Advisor Code is mandatory.');
      return;
    }

    const selectedAbpObj = hierarchyOptions.abps.find(a => a.id === selectedAbp || a.code === selectedAbp);
    const selectedL1Obj = hierarchyOptions.level1Managers.find(l => l.id === selectedL1 || l.code === selectedL1);

    const payload = {
      advisorCode: advisorCode.trim(),
      licenseNumber: licenseNumber.trim(),
      licenseIssueDate: issueDate,
      licenseExpiryDate: expiryDate,
      joiningDate,
      insuranceCompanyId: companyId,
      insuranceCompanyName: company,
      remarks: remarks.trim(),
      convertedBy: 'admin'
    };
    const canConfirmEligibility = isTrainingComplete && isExamPassed;
    const candidateForConversion = canConfirmEligibility
      ? {
          ...candidate,
          trainingStatus: 'Completed',
          examStatus: 'Passed',
          result: 'Pass',
          eligibility: 'Eligible',
          eligibilityDate: candidate.eligibilityDate || new Date().toISOString().split('T')[0]
        }
      : candidate;

    setIsSubmitting(true);
    try {
      if (canConfirmEligibility) {
        await apiService.updateCandidate(candidate.id, {
          trainingStatus: 'Completed',
          examStatus: 'Passed',
          result: 'Pass',
          eligibility: 'Eligible',
          eligibilityDate: candidateForConversion.eligibilityDate
        });
      }

      let response;
      try {
        response = await advisorApi.convertCandidateToAdvisor(candidate.id, payload);
      } catch (conversionError) {
        if (conversionError.status !== 404) throw conversionError;

        // Advisor candidates created by the legacy local registry may not yet
        // exist in the backend recruitment collection. Migrate that record once
        // and retry the same conversion request.
        await apiService.createCandidate({
          ...candidateForConversion,
          documents: Array.isArray(candidateForConversion.documents) ? candidateForConversion.documents : [],
          stageHistory: Array.isArray(candidateForConversion.stageHistory) ? candidateForConversion.stageHistory : [],
          fees: candidateForConversion.fees || {},
          exam: candidateForConversion.exam || {}
        });
        response = await advisorApi.convertCandidateToAdvisor(candidate.id, payload);
      }
      if (onShowNotification) {
        onShowNotification('Candidate ' + candidate.name + ' successfully converted to Advisor (' + advisorCode + ')!');
      }
      if (onSuccess) {
        onSuccess(response.advisor);
      }
      onClose();
    } catch (err) {
      console.error('[Conversion Modal Error]', err);
      setErrorBanner(err.message || 'Failed to convert candidate to advisor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[200] flex min-h-[calc(100vh-7rem)] items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[calc(100vh-7rem)] bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#1e293b] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Convert Candidate to Insurance Advisor
              </h3>
              <p className="text-xs text-slate-400">
                Final onboarding step: create the advisor record.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] font-mono text-slate-500 uppercase">Origin Candidate ID: {candidate.id}</p>
              <h4 className="text-sm font-bold text-white mt-0.5">{candidate.name}</h4>
              <p className="text-slate-400">{candidate.mobile} • {candidate.email || 'No email'}</p>
            </div>
            <div className="text-right space-y-1">
              <span className={'px-2.5 py-0.5 rounded text-[10px] font-black uppercase ' + (
                isExamPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              )}>
                Exam: {candidate.examStatus || candidate.result || 'Pending'}
              </span>
              <p className="text-[10px] text-slate-400">Training: {candidate.trainingStatus || 'Not Started'}</p>
            </div>
          </div>

          {(!isTrainingComplete || !isExamPassed) && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-200">Prerequisite Warning:</span>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  Candidate has not formally recorded both Training Completion and an Exam PASS result. Backend validation will strictly evaluate eligibility upon submission.
                </p>
              </div>
            </div>
          )}

          {isAlreadyConverted && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-200">Duplicate Conversion Blocked:</span>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  This candidate has already been converted to an active advisor. Duplicate creation is prohibited.
                </p>
              </div>
            </div>
          )}

          {errorBanner && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {errorBanner}
            </div>
          )}

          <form id="convert-advisor-form" onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                  Advisor Code *
                </label>
                <input
                  type="text"
                  required
                  value={advisorCode}
                  onChange={e => setAdvisorCode(e.target.value)}
                  placeholder="e.g. ADV-8042"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                />
              </div>

            </div>
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#1e293b] border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="convert-advisor-form"
            disabled={isSubmitting || isAlreadyConverted}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying & Converting...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Authorize & Create Advisor</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
