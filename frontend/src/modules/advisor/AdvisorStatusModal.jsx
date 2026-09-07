import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, ShieldAlert, Check, AlertCircle } from 'lucide-react';
import { advisorApi } from '../../services/advisorApi';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', desc: 'Fully licensed and authorized to solicit insurance business' },
  { value: 'INACTIVE', label: 'Inactive', desc: 'Temporarily dormant; not actively soliciting policies' },
  { value: 'SUSPENDED', label: 'Suspended', desc: 'Compliance or disciplinary suspension of licensing' },
  { value: 'RESIGNED', label: 'Resigned', desc: 'Voluntarily resigned from advisor network' },
  { value: 'TERMINATED', label: 'Terminated', desc: 'Terminated for compliance breach or performance failure' },
  { value: 'EXPIRED', label: 'Expired', desc: 'IRDA license validity period has expired' },
  { value: 'TRANSFERRED', label: 'Transferred', desc: 'Transferred to another branch or carrier division' },
  { value: 'ARCHIVED', label: 'Archived', desc: 'Archived historical advisor dossier' }
];

export default function AdvisorStatusModal({
  isOpen,
  advisor,
  onClose,
  onSuccess,
  onShowNotification
}) {
  const [selectedStatus, setSelectedStatus] = useState(advisor?.status || 'ACTIVE');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen || !advisor) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('A specific reason is mandatory for logging status transitions.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await advisorApi.changeAdvisorStatus(advisor.id, selectedStatus, reason.trim());
      if (onShowNotification) {
        onShowNotification(`Advisor ${advisor.fullName} status updated to ${selectedStatus}.`);
      }
      if (onSuccess) {
        onSuccess({ ...advisor, status: selectedStatus });
      }
      onClose();
    } catch (err) {
      console.error('[Status Change Error]', err);
      setErrorMsg(err.message || 'Failed to update advisor status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative flex flex-col w-full max-w-lg bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
        <div className="flex items-center justify-between px-6 py-4 bg-[#1e293b] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Update Advisor Status
              </h3>
              <p className="text-xs text-slate-400">
                {advisor.fullName} ({advisor.advisorCode})
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-semibold text-slate-300">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              Current Status: <span className="text-white font-mono">{advisor.status}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(opt => {
                const isSelected = selectedStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedStatus(opt.value)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs">{opt.label}</span>
                    <span className="text-[9px] text-slate-500 mt-1 leading-tight">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              Reason for Status Transition *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Provide required compliance explanation (e.g., voluntary resignation, compliance disciplinary review, license renewal)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-5 py-2 bg-[#0078d4] hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Commit Status Transition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : modalContent;
}
