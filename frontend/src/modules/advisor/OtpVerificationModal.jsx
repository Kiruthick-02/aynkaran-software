import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Key, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { advisorApi } from '../../services/advisorApi';

export default function OtpVerificationModal({
  isOpen,
  actionTitle = 'Sensitive Operation Authorization',
  actionType = 'SENSITIVE_OPERATION',
  targetDetails = '',
  onClose,
  onVerifySuccess,
  onShowNotification
}) {
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [resendCountdown, setResendCountdown] = useState(60);

  const handleRequestOtp = async () => {
    setIsRequestingOtp(true);
    setErrorMsg(null);
    try {
      await advisorApi.requestOtp('admin', actionType, targetDetails);
      if (onShowNotification) {
        onShowNotification('Security authorization OTP dispatched to Owner email (kiruthickrn@gmail.com).');
      }
      setResendCountdown(60);
    } catch (err) {
      console.error('[Request OTP Error]', err);
      setErrorMsg(err.message || 'Failed to dispatch security OTP.');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setErrorMsg(null);
      handleRequestOtp();
    }
  }, [isOpen]);

  useEffect(() => {
    if (resendCountdown > 0 && isOpen) {
      const timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown, isOpen]);

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      setErrorMsg('Please enter the complete 6-digit verification OTP.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await advisorApi.verifyOtp('admin', actionType, otp.trim());
      if (res.success) {
        if (onShowNotification) {
          onShowNotification('Owner security authorization verified successfully.');
        }
        if (onVerifySuccess) {
          onVerifySuccess(otp.trim());
        }
        onClose();
      } else {
        setErrorMsg('OTP verification failed. Incorrect or expired code.');
      }
    } catch (err) {
      console.error('[Verify OTP Error]', err);
      setErrorMsg(err.message || 'OTP verification failed. The operation was not completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative flex flex-col w-full max-w-md bg-[#0f172a] border border-blue-500/40 rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
        <div className="flex items-center justify-between px-6 py-5 bg-[#1e293b] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Owner Authorization Required
              </h3>
              <p className="text-[11px] text-slate-400">
                {actionTitle}
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

        <form onSubmit={handleVerify} className="p-6 space-y-5 text-xs font-semibold text-slate-300">
          <div className="p-3.5 bg-blue-950/30 border border-blue-500/30 rounded-2xl text-slate-300 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security Checkpoint
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              A 6-digit One-Time Password (OTP) has been dispatched to the Business Owner's registered email: <strong className="text-white font-mono">kiruthickrn@gmail.com</strong>.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-2 text-center">
            <label className="text-[11px] uppercase tracking-widest text-slate-400 font-bold block">
              Enter 6-Digit OTP Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              autoFocus
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="• • • • • •"
              className="w-full text-center tracking-[0.6em] text-2xl font-mono font-black bg-slate-900 border-2 border-blue-500/50 rounded-2xl py-3.5 text-white focus:outline-none focus:border-blue-400 shadow-inner"
            />
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px]">
            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={resendCountdown > 0 || isRequestingOtp}
              className="text-blue-400 hover:text-blue-300 font-bold disabled:text-slate-600 cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className={'w-3.5 h-3.5 ' + (isRequestingOtp ? 'animate-spin' : '')} />
              {resendCountdown > 0 ? ('Resend OTP in ' + resendCountdown + 's') : 'Resend OTP to Owner'}
            </button>
            <span className="text-slate-500 font-mono">Valid for 10m</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
              disabled={isSubmitting || otp.length < 6}
              className="px-6 py-2.5 bg-[#0078d4] hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Verifying...' : 'Authorize Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : modalContent;
}