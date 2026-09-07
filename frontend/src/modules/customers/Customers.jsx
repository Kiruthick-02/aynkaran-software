<<<<<<< HEAD
// src/modules/customers/Customers.jsx
import React, { useEffect, useMemo, useState } from 'react';
=======
import React, { useState, useRef, useEffect } from 'react';
import { compressImageToBase64, dataURLtoFile } from '../../utils/imageCompressor';
import API_URL from '../../config/api';
import { apiService } from '../../services/api';
import { useApp } from '../../context/AppContext';
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
import {
  Users,
  Inbox,
  Search,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building2,
  Shield,
  User,
  RefreshCw,
  X,
  Edit,
  Download,
<<<<<<< HEAD
  FileText,
  Save,
  CheckCircle2,
  Circle,
  Trash2,
=======
  Eye,
  Lock,
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
} from 'lucide-react';
import apiService from '../../services/api';

<<<<<<< HEAD
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7860';

import { createPortal } from 'react-dom';

// keep resolveCustomerDoc + DocumentPreviewModal (same as above) in this file

function CustomerDocZone({
  label,
  file,
  setFile,
  existingPath,
  existingName,
  onClearExisting,
}) {
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [viewOpen, setViewOpen] = useState(false);

  const hasExisting = !!(existingPath && !file);
  const displayName =
    existingName || (existingPath ? String(existingPath).split('/').pop() : null);

  const href =
    existingPath &&
    (String(existingPath).startsWith('http') ||
    String(existingPath).startsWith('blob:')
      ? existingPath
      : `${API_URL}${existingPath.startsWith('/') ? existingPath : `/${existingPath}`}`);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const confirmUpload = () => {
    if (!previewFile) return;
    setFile(previewFile);
    setPreviewFile(null);
  };

  const cancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl('');
  };

  const isImage = previewFile && /^image\//.test(previewFile.type);
  const isPdf = previewFile && previewFile.type === 'application/pdf';

  const confirmModal =
    previewFile &&
    createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        onClick={cancelPreview}
      >
        <div
          className="bg-[#1e293b] border border-slate-700 rounded-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center">
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">Confirm {label}</p>
              <p className="text-[11px] text-slate-400 truncate">{previewFile.name}</p>
            </div>
            <button type="button" onClick={cancelPreview} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[220px] bg-slate-950/50">
            {isImage && (
              <img src={previewUrl} alt="" className="max-w-full max-h-[50vh] object-contain rounded-lg" />
            )}
            {isPdf && (
              <iframe src={previewUrl} title="preview" className="w-full h-[50vh] rounded-lg bg-white" />
            )}
            {!isImage && !isPdf && (
              <p className="text-xs text-slate-400">Preview not available — you can still confirm.</p>
            )}
          </div>
          <div className="px-4 py-3 border-t border-slate-700 flex justify-end gap-2">
            <button type="button" onClick={cancelPreview} className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 text-slate-300">
              Cancel
            </button>
            <button type="button" onClick={confirmUpload} className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0078d4] text-white">
              Confirm & use file
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase text-slate-400 font-bold">{label}</label>

      {hasExisting ? (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 flex items-center justify-between gap-2 min-h-[72px]">
          <div className="min-w-0">
            <p className="text-[10px] text-emerald-400 font-bold uppercase">Uploaded</p>
            <p className="text-[11px] text-white truncate">{displayName}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {href && (
              <button
                type="button"
                onClick={() => setViewOpen(true)}
                className="px-2 py-1 rounded text-[10px] font-bold bg-slate-800 text-blue-300 border border-slate-600"
              >
                View
              </button>
            )}
            <button
              type="button"
              onClick={onClearExisting}
              className="px-2 py-1 rounded text-[10px] font-bold bg-rose-600/20 text-rose-300 border border-rose-500/30"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-600 bg-slate-900/50 px-3 py-6 cursor-pointer hover:border-blue-500/50 min-h-[72px]">
          <span className="text-slate-500 text-lg">↑</span>
          <span className="text-[11px] text-slate-400 text-center">
            {file ? file.name : 'Click to choose file'}
          </span>
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={onPick} />
          {file && (
            <button
              type="button"
              className="text-[10px] text-rose-400 mt-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setFile(null);
              }}
            >
              Clear selection
            </button>
          )}
        </label>
      )}

      {confirmModal}
      <DocumentPreviewModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={label}
        href={href}
        fileName={displayName}
      />
=======
/**
 * Hybrid Date Input component allowing both manual typing and native calendar selection
 */
/**
 * Hybrid Date Input component allowing both manual typing and highly convenient, instant dropdown picker
 */
function DualDateInput({ value, onChange, placeholder = "DD/MM/YYYY", required = false }) {
  const [showPopup, setShowPopup] = useState(false);
  const containerRef = useRef(null);

  // Parse DD/MM/YYYY
  const parts = (value || "").split('/');
  const currentDay = parts[0] || "";
  const currentMonth = parts[1] || "";
  const currentYear = parts[2] || "";

  // Days list
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  // Months list
  const months = [
    { val: '01', label: 'Jan (01)' },
    { val: '02', label: 'Feb (02)' },
    { val: '03', label: 'Mar (03)' },
    { val: '04', label: 'Apr (04)' },
    { val: '05', label: 'May (05)' },
    { val: '06', label: 'Jun (06)' },
    { val: '07', label: 'Jul (07)' },
    { val: '08', label: 'Aug (08)' },
    { val: '09', label: 'Sep (09)' },
    { val: '10', label: 'Oct (10)' },
    { val: '11', label: 'Nov (11)' },
    { val: '12', label: 'Dec (12)' },
  ];

  // Year list: current year down to 1910
  const endYear = new Date().getFullYear();
  const startYear = 1910;
  const years = [];
  for (let y = endYear; y >= startYear; y--) {
    years.push(String(y));
  }

  // Handle outside clicks to close the popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTextChange = (e) => {
    // Only allow numbers and slashes
    const cleaned = e.target.value.replace(/[^0-9/]/g, '');
    onChange(cleaned);
  };

  const handleSelectChange = (field, val) => {
    let d = currentDay;
    let m = currentMonth;
    let y = currentYear;

    if (field === 'day') d = val;
    if (field === 'month') m = val;
    if (field === 'year') y = val;

    // Default to '01' if empty and we set another field
    if (!d) d = '01';
    if (!m) m = '01';
    if (!y) y = String(new Date().getFullYear() - 25); // reasonable default for DOB if empty

    onChange(`${d}/${m}/${y}`);
  };

  return (
    <div ref={containerRef} className="relative flex gap-2 items-center w-full">
      <input
        required={required}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleTextChange}
        maxLength={10}
        className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
        title="Type manually (format: DD/MM/YYYY)"
      />

      <button
        type="button"
        onClick={() => setShowPopup(!showPopup)}
        className="p-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-sm"
        title="Open Convenient DOB Selector"
      >
        <Calendar size={14} />
      </button>

      {showPopup && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-40 w-72 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Quick DOB Selector
          </div>

          <div className="grid grid-cols-3 gap-1.5 font-sans">
            <div>
              <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1 text-center">Year</label>
              <select
                value={currentYear}
                onChange={(e) => handleSelectChange('year', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 h-9"
              >
                <option value="">Year</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1 text-center">Month</label>
              <select
                value={currentMonth}
                onChange={(e) => handleSelectChange('month', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 h-9"
              >
                <option value="">Month</option>
                {months.map(m => (
                  <option key={m.val} value={m.val}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1 text-center">Day</label>
              <select
                value={currentDay}
                onChange={(e) => handleSelectChange('day', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 h-9"
              >
                <option value="">Day</option>
                {days.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className="text-slate-500 font-medium">Selected Date:</span>
            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              {value || '--/--/----'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowPopup(false)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-1.5 text-xs font-bold transition cursor-pointer text-center block"
          >
            Apply & Close
          </button>
        </div>
      )}
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
    </div>
  );
}

<<<<<<< HEAD
function DocumentPreviewModal({ open, onClose, title, href, fileName }) {
  if (!open || !href) return null;

  const lower = String(fileName || href).toLowerCase();
  const isImage = /\.(png|jpe?g|gif|webp|avif|bmp)$/i.test(lower) || href.startsWith('blob:');
  const isPdf = /\.pdf$/i.test(lower) || href.includes('application/pdf');

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#1e293b] border border-slate-700 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">{title || 'Document'}</p>
            <p className="text-[11px] text-slate-400 truncate">{fileName}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={href}
              download={fileName || true}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-800 text-blue-300 border border-slate-600"
            >
              Download
            </a>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-slate-950/50 flex items-center justify-center min-h-[280px]">
          {isImage && (
            <img src={href} alt="" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
          )}
          {isPdf && (
            <iframe src={href} title="doc" className="w-full h-[70vh] rounded-lg bg-white" />
          )}
          {!isImage && !isPdf && (
            <p className="text-xs text-slate-400 text-center">
              Preview not available for this type.
              <br />
              Use Download to open the file.
            </p>
=======
const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL || ''}${url}`;
};

const cleanFileName = (filePathOrName) => {
  if (!filePathOrName) return '';
  const baseName = filePathOrName.includes('/') ? filePathOrName.substring(filePathOrName.lastIndexOf('/') + 1) : filePathOrName;
  // Strip out leading numbers followed by hyphen or underscore (such as standard Multer timestamps Date.now())
  return baseName.replace(/^\d+[-_]/, '');
};

export default function Customers({ customers = [], addCustomer, updateCustomer, deleteCustomer, policies = [] }) {
  const { loadStateFromServer, candidates, userRole, adminUser } = useApp();
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dob, setDob] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailId, setEmailId] = useState('');
  const [address, setAddress] = useState('');
  const [spouseName, setSpouseName] = useState('');
  const [agentCodeField, setAgentCodeField] = useState('');

  const [incomeProof, setIncomeProof] = useState('');
  const [educationCertificate, setEducationCertificate] = useState('');
  const [aadhaarCard, setAadhaarCard] = useState('');
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panCard, setPanCard] = useState('');
  const [passportSizePhoto, setPassportSizePhoto] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [signatureCopy, setSignatureCopy] = useState('');
  const [passport, setPassport] = useState('');

  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [previewDocName, setPreviewDocName] = useState('');
  const [previewDocCategory, setPreviewDocCategory] = useState('');

  const [nomineeName, setNomineeName] = useState('');
  const [nomineeDob, setNomineeDob] = useState('');
  const [nomineeRelationship, setNomineeRelationship] = useState('');

  const [annualIncome, setAnnualIncome] = useState('');
  const [occupation, setOccupation] = useState('');

  const [docFileVal, setDocFileVal] = useState('');
  const [isEditingCustDetails, setIsEditingCustDetails] = useState(false);
  const [editCustName, setEditCustName] = useState('');
  const [editCustMobile, setEditCustMobile] = useState('');
  const [editCustEmail, setEditCustEmail] = useState('');
  const [editCustDob, setEditCustDob] = useState('');
  const [isAadhaarDragging, setIsAadhaarDragging] = useState(false);
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);

  // File Upload Handlers for Aadhaar & Passport Photo dropzones
  const handleAadhaarDrop = async (e) => {
    e.preventDefault();
    setIsAadhaarDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const compressed = await compressImageToBase64(file);
      if (compressed) {
        setAadhaarCard(compressed);
        if (file.type && file.type.startsWith('image/')) {
          setAadhaarFile(dataURLtoFile(compressed, file.name));
        } else {
          setAadhaarFile(file);
        }
      }
    }
  };

  const handleAadhaarSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const compressed = await compressImageToBase64(file);
      if (compressed) {
        setAadhaarCard(compressed);
        if (file.type && file.type.startsWith('image/')) {
          setAadhaarFile(dataURLtoFile(compressed, file.name));
        } else {
          setAadhaarFile(file);
        }
      }
    }
  };

  const handlePhotoDrop = async (e) => {
    e.preventDefault();
    setIsPhotoDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const compressed = await compressImageToBase64(file);
      if (compressed) {
        setPassportSizePhoto(compressed);
        if (file.type && file.type.startsWith('image/')) {
          setPhotoFile(dataURLtoFile(compressed, file.name));
        } else {
          setPhotoFile(file);
        }
      }
    }
  };

  const handlePhotoSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const compressed = await compressImageToBase64(file);
      if (compressed) {
        setPassportSizePhoto(compressed);
        if (file.type && file.type.startsWith('image/')) {
          setPhotoFile(dataURLtoFile(compressed, file.name));
        } else {
          setPhotoFile(file);
        }
      }
    }
  };

  // Direct KYC modification helper for document slots
  const handleAddDirectKYC = (category, dataUrl) => {
    if (!selectedCustomerId) return;
    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (cust) {
      const updatedKyc = { ...cust.kycDocuments, [category]: dataUrl || undefined };
      const updatedDates = { ...cust.kycUploadDates };
      if (dataUrl) {
        updatedDates[category] = new Date().toISOString().split('T')[0];
      } else {
        delete updatedDates[category];
      }
      updateCustomer(selectedCustomerId, { 
        kycDocuments: updatedKyc, 
        kycUploadDates: updatedDates 
      });
    }
  };

  const handleAddDirectKYCFile = async (category, file) => {
    if (!selectedCustomerId || !file) return;
    try {
      await apiService.uploadDocument(file, category, selectedCustomerId, 'customers');
      await loadStateFromServer();
    } catch (err) {
      console.error('[Direct KYC Multi-part Upload Error]', err);
    }
  };

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId) || null;
  const customerPolicies = activeCustomer ? policies.filter((p) => p.customerId === activeCustomer.id) : [];

  const filteredCustomers = customers.filter(
    (c) =>
      (c.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (c.mobileNumber || '').includes(searchQuery || '') ||
      (c.emailId || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (c.id || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!name || !dob || !mobileNumber) return;

    const finalPhoto =
      passportSizePhoto ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const newCust = {
      id: `cust-${Date.now().toString().substring(7)}`,
      name,
      fatherName,
      motherName,
      dob,
      mobileNumber,
      emailId,
      address,
      spouseName,
      agentCode: agentCodeField,
      kycDocuments: {
        passportSizePhoto: finalPhoto.startsWith('data:') ? undefined : finalPhoto
      },
      nominee: {
        name: nomineeName,
        dob: nomineeDob,
        relationship: nomineeRelationship,
      },
      work: {
        annualIncome: parseFloat(annualIncome) || 0,
        occupation,
      },
      createdAt: new Date().toISOString(),
    };

    addCustomer(newCust).then(async (savedCustomer) => {
      const actualId = savedCustomer?.id || newCust.id;

      if (aadhaarFile) {
        try {
          await apiService.uploadDocument(aadhaarFile, 'aadhaarCard', actualId, 'customers');
        } catch (err) {
          console.error('Failed to upload Aadhaar document on register:', err);
        }
      }

      if (photoFile) {
        try {
          await apiService.uploadDocument(photoFile, 'passportSizePhoto', actualId, 'customers');
        } catch (err) {
          console.error('Failed to upload passport photo on register:', err);
        }
      }

      await loadStateFromServer();
    });

    setSelectedCustomerId(newCust.id);
    setIsAddingCustomer(false);

    setName('');
    setFatherName('');
    setMotherName('');
    setDob('');
    setMobileNumber('');
    setEmailId('');
    setAddress('');
    setSpouseName('');
    setIncomeProof('');
    setEducationCertificate('');
    setAadhaarCard('');
    setAadhaarFile(null);
    setPanCard('');
    setPassportSizePhoto('');
    setPhotoFile(null);
    setSignatureCopy('');
    setPassport('');
    setNomineeName('');
    setNomineeDob('');
    setNomineeRelationship('');
    setAnnualIncome('');
    setOccupation('');
    setAgentCodeField('');
  };

  const handleAddKYCDocument = (category) => {
    if (!selectedCustomerId || !docFileVal) return;

    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (cust) {
      const updatedKyc = { ...cust.kycDocuments };
      updatedKyc[category] = docFileVal;
      const updatedDates = { ...cust.kycUploadDates };
      updatedDates[category] = new Date().toISOString().split('T')[0];
      updateCustomer(selectedCustomerId, { 
        kycDocuments: updatedKyc, 
        kycUploadDates: updatedDates 
      });
    }

    setDocFileVal('');
  };

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTargetId, setOtpTargetId] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const handleDeleteCustomer = (id) => {
    const cust = customers.find(c => c.id === id);
    const cName = cust ? cust.name : 'Unknown Customer';
    
    if (userRole === 'Staff') {
      if (confirm('Authorization Secure Protocol: Staff accounts are prevented from unilateral deletes. Verify deletion with Superadmin OTP?')) {
        setOtpTargetId(id);
        setShowOtpModal(true);
        setEnteredOtp('');
        setOtpError('');
        setOtpLoading(true);
        
        apiService.requestDeleteOTP(adminUser, id, 'Customer', cName)
          .then(res => {
            if (res && res.success) {
              // Successfully sent OTP
            } else {
              setOtpError(res.error || 'Failed to trigger secure OTP.');
            }
          })
          .catch(err => setOtpError(err.message || 'Error executing OTP request.'))
          .finally(() => setOtpLoading(false));
      }
    } else {
      if (confirm('Are you sure you want to permanently delete this customer profile? Linked sales history will lose CRM anchors.')) {
        deleteCustomer(id);
        if (selectedCustomerId === id) {
          const remaining = customers.filter(c => c.id !== id);
          setSelectedCustomerId(remaining[0]?.id || null);
        }
      }
    }
  };

  const handleVerifyOtpDelete = async () => {
    if (!enteredOtp.trim()) {
      setOtpError('Please input verification passcode.');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const response = await deleteCustomer(otpTargetId, enteredOtp);
      if (response && response.success) {
        setShowOtpModal(false);
        setEnteredOtp('');
        if (selectedCustomerId === otpTargetId) {
          const remaining = customers.filter(c => c.id !== otpTargetId);
          setSelectedCustomerId(remaining[0]?.id || null);
        }
        alert('Operation Verified! Customer profile has been deleted safely.');
      } else {
        setOtpError(response.error || 'Incorrect passcode! Operation forbidden by Superadmin.');
      }
    } catch (err) {
      setOtpError(err.message || 'Error occurred during deletion lock validation.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Module 3: Customer CRM Profile System</h2>
          <p className="text-xs text-slate-500 font-medium">
            Search customer records, audit comprehensive KYC document packs, review nominees, and audit active insurance policy bindings.
          </p>
        </div>
        <button
          onClick={() => setIsAddingCustomer(true)}
          id="btn-add-customer"
          className="mt-3 sm:mt-0 inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/10 cursor-pointer"
        >
          <Plus size={15} />
          <span>New Customer Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Search CRM Directory</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Name, Phone, Email, Tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[500px]">
            <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between">
              <span>Customer File Index</span>
              <span>{filteredCustomers.length} Profile(s)</span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {filteredCustomers.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(cust.id)}
                  className={`p-3 flex items-center space-x-3 hover:bg-slate-50/80 cursor-pointer transition-colors ${
                    selectedCustomerId === cust.id ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <img
                    referrerPolicy="no-referrer"
                    src={cust.kycDocuments?.passportSizePhoto ? getFileUrl(cust.kycDocuments.passportSizePhoto) : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cust.name)}`}
                    alt={cust.name}
                    className="w-10 h-10 rounded-full border border-slate-200 object-cover bg-slate-100 shrink-0"
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 truncate">{cust.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{cust.mobileNumber}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomer(cust.id);
                    }}
                    title="Delete customer record"
                    className="p-1 px-1.5 hover:bg-rose-100 hover:text-rose-700 text-slate-300 rounded transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {filteredCustomers.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  No matching files registered.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {activeCustomer ? (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-5">
                  <div
                    className={`relative ${activeCustomer.kycDocuments?.passportSizePhoto ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (activeCustomer.kycDocuments?.passportSizePhoto) {
                        setPreviewDocUrl(activeCustomer.kycDocuments.passportSizePhoto);
                        setPreviewDocName('passportSizePhoto.png');
                        setPreviewDocCategory('Passport Size Photo');
                      }
                    }}
                    title={activeCustomer.kycDocuments?.passportSizePhoto ? "Click to preview full photo" : ""}
                  >
                    <img
                      referrerPolicy="no-referrer"
                      src={activeCustomer.kycDocuments?.passportSizePhoto ? getFileUrl(activeCustomer.kycDocuments.passportSizePhoto) : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeCustomer.name)}`}
                      className={`w-20 h-20 rounded-2xl object-cover bg-slate-50 border-2 border-indigo-600/30 shadow-md transition-transform ${activeCustomer.kycDocuments?.passportSizePhoto ? 'hover:scale-105' : ''}`}
                      alt={activeCustomer.name}
                    />
                    <span className="absolute -bottom-1.5 -right-1.5 bg-indigo-600 text-[9px] text-white px-1.5 py-0.5 rounded font-bold uppercase shadow-sm">
                      ID Photo
                    </span>
                  </div>

                  {isEditingCustDetails ? (
                    <div className="flex-1 bg-slate-50 p-3.5 border border-slate-200 rounded-xl space-y-3">
                      <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Update Customer Profile Info</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Full Name</label>
                          <input
                            type="text"
                            value={editCustName}
                            onChange={(e) => setEditCustName(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded p-1 text-xs text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Mobile Number</label>
                          <input
                            type="tel"
                            value={editCustMobile}
                            onChange={(e) => setEditCustMobile(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded p-1 text-xs text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">DOB Date</label>
                          <DualDateInput
                            value={editCustDob}
                            onChange={(val) => setEditCustDob(val)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Email ID Address</label>
                          <input
                            type="email"
                            value={editCustEmail}
                            onChange={(e) => setEditCustEmail(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded p-1 text-xs text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsEditingCustDetails(false)}
                          className="px-2.5 py-1 text-[11px] bg-slate-100 font-semibold rounded text-slate-600 hover:bg-slate-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!editCustName || !editCustMobile) return;
                            await updateCustomer(activeCustomer.id, {
                              name: editCustName,
                              mobileNumber: editCustMobile,
                              dob: editCustDob,
                              emailId: editCustEmail,
                            });
                            setIsEditingCustDetails(false);
                          }}
                          className="px-2.5 py-1 text-[11px] bg-indigo-600 font-extrabold rounded text-white hover:bg-indigo-700 cursor-pointer"
                        >
                          Save Profile
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2.5">
                        <h3 className="font-extrabold text-lg text-slate-900 leading-tight">{activeCustomer.name}</h3>
                        <button
                          type="button"
                          onClick={() => {
                            setEditCustName(activeCustomer.name || '');
                            setEditCustMobile(activeCustomer.mobileNumber || '');
                            setEditCustDob(activeCustomer.dob || '');
                            setEditCustEmail(activeCustomer.emailId || '');
                            setIsEditingCustDetails(true);
                          }}
                          className="px-2 py-0.5 text-[9.5px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          Edit Profile
                        </button>
                      </div>
                      <p className="w-fit inline-block font-mono text-[9px] bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded font-semibold mt-1">
                        ID: {activeCustomer.id}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                        <p>DOB: <strong>{activeCustomer.dob}</strong></p>
                        <p>Mobile: <strong>{activeCustomer.mobileNumber}</strong></p>
                        <p>Email: <strong>{activeCustomer.emailId || activeCustomer.email || 'N/A'}</strong></p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 mt-5 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Father’s Name</span>
                    <span className="font-semibold text-slate-800">{activeCustomer.fatherName || 'Not Entered'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Mother’s Name</span>
                    <span className="font-semibold text-slate-800">{activeCustomer.motherName || 'Not Entered'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Spouse’s Name</span>
                    <span className="font-semibold text-slate-800">{activeCustomer.spouseName || 'Not Entered'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Registered Address</span>
                  <p className="text-slate-800 font-medium leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3">
                    {activeCustomer.address}
                  </p>
                </div>

                {userRole !== 'Staff' && (
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5">Assigned Agent Coordinator of Record</span>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 leading-snug">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Assigned Agent ID Code</span>
                        <p className="font-extrabold text-slate-800 text-xs mt-0.5">
                          {activeCustomer.agentCode ? (
                            <span className="font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                              {activeCustomer.agentCode}
                            </span>
                          ) : 'No Agent Linked (Direct Office Customer)'}
                        </p>
                      </div>
                      <div>
                        <select
                          value={activeCustomer.agentCode || ''}
                          onChange={(e) => {
                            console.log('[DEBUG] Assigning customer', activeCustomer.id, 'to agentCode', e.target.value);
                            updateCustomer(activeCustomer.id, { agentCode: e.target.value });
                          }}
                          className="bg-white border border-slate-350 rounded-lg px-2.5 py-1.5 text-slate-705 text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
                        >
                          <option value="">-- Direct Sale (No Agent) --</option>
                          {(candidates || [])
                            .filter(c => c.exam?.agentCodeGenerated)
                            .map(c => (
                              <option key={c.id} value={c.exam.agentCodeGenerated}>
                                {c.name} ({c.exam.agentCodeGenerated})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-slate-100">
                    <Building size={14} className="text-slate-400" />
                    <span>Occupational & Financial details</span>
                  </h4>

                  <div className="grid grid-cols-1 gap-3.5 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Occupation / Place of Work</span>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">
                        {activeCustomer.work?.occupation || 'Self Employed / Retai'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Self-Declared Annual Income</span>
                      <p className="font-extrabold text-indigo-700 text-sm mt-0.5">
                        ₹{activeCustomer.work?.annualIncome ? activeCustomer.work.annualIncome.toLocaleString('en-IN') : 0} /annum
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-slate-100">
                    <UserCheck size={14} className="text-slate-400" />
                    <span>Nominee Details Bindings</span>
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center bg-slate-50 p-2 border border-slate-100 rounded-lg">
                      <span className="text-slate-400 font-bold text-[9px] uppercase">Nominee Name</span>
                      <span className="font-extrabold text-slate-800">{activeCustomer.nominee?.name || 'Not logged'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-2 border border-slate-100 rounded-lg">
                      <span className="text-slate-400 font-bold text-[9px] uppercase">Relationship</span>
                      <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                        {activeCustomer.nominee?.relationship || 'Spouse'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-2 border border-slate-100 rounded-lg">
                      <span className="text-slate-400 font-bold text-[9px] uppercase">Date of Birth</span>
                      <span className="font-extrabold text-slate-800">{activeCustomer.nominee?.dob || 'Not logged'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <Wallet size={14} className="text-slate-400" />
                  <span>Administrative KYC & Verification Vault</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Passport Size Photo', key: 'passportSizePhoto', desc: 'Applicant profile picture' },
                    { label: 'Aadhaar Card copy', key: 'aadhaarCard', desc: 'UIDAI Address proof' },
                    { label: 'PAN Card copy', key: 'panCard', desc: 'Income tax card ID' },
                    { label: 'Income Proof certificate', key: 'incomeProof', desc: 'Salary slip or Form 16' },
                    { label: 'Education Certificate', key: 'educationCertificate', desc: '10th SSLC / Degree book' },
                    { label: 'Signature Specimen Scan', key: 'signatureCopy', desc: 'Signed on white paper' },
                    { label: 'Indian Passport Copy', key: 'passport', desc: 'International travel (if provided)' },
                  ].map((slot) => {
                    const value = activeCustomer.kycDocuments?.[slot.key];
                    return (
                      <div
                        key={slot.key}
                        className={`p-3 border rounded-xl flex flex-col justify-between space-y-2 text-xs transition-colors ${
                          value
                            ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-900'
                            : 'bg-slate-50 border-slate-200/60 text-slate-600'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-[11px] leading-snug">{slot.label}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{slot.desc}</p>
                        </div>

                        {value ? (
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-emerald-100">
                            <span
                              className="text-[10px] text-emerald-800 font-extrabold truncate max-w-[110px] hover:underline cursor-pointer flex items-center space-x-1"
                              onClick={() => {
                                setPreviewDocUrl(value);
                                setPreviewDocName(slot.key === 'passportSizePhoto' ? 'Photo.png' : value.startsWith('data:') ? 'Attachment.pdf' : cleanFileName(value));
                                setPreviewDocCategory(slot.label);
                              }}
                              title="Click to preview document inline"
                            >
                              <Eye size={10} className="inline mr-0.5 text-emerald-600" />
                              <span>{value.startsWith('data:') ? (slot.key === 'passportSizePhoto' ? 'Photo.png' : 'Attachment.pdf') : cleanFileName(value)}</span>
                            </span>
                            <div className="flex items-center space-x-1">
                              <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-extrabold">Verified</span>
                              <button
                                type="button"
                                onClick={() => handleAddDirectKYC(slot.key, null)}
                                className="p-0.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded transition-colors"
                                title="Delete document"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5 mt-2">
                            <input
                              type="file"
                              id={`file-vault-${slot.key}`}
                              accept={slot.key === 'passportSizePhoto' ? 'image/*' : 'image/*,application/pdf'}
                              className="hidden"
                              onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const compressed = await compressImageToBase64(file);
                                  if (compressed) {
                                    if (file.type && file.type.startsWith('image/')) {
                                      handleAddDirectKYCFile(slot.key, dataURLtoFile(compressed, file.name));
                                    } else {
                                      handleAddDirectKYCFile(slot.key, file);
                                    }
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById(`file-vault-${slot.key}`).click()}
                              className="w-full inline-flex items-center justify-center space-x-1 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded border border-indigo-200 text-[10px] transition-colors cursor-pointer"
                            >
                              <Upload size={10} />
                              <span>Select File</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-slate-100">
                  <Activity size={14} className="text-slate-400" />
                  <span>Associated Insurance Policies & claims status</span>
                </h4>

                <div className="space-y-2.5">
                  {customerPolicies.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">{p.policyType}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Policy ID: {p.issuedPolicyNumber || `${p.id} (Proposal stage)`}
                        </p>
                      </div>
                      <div className="text-right mt-2 sm:mt-0">
                        <span className="inline-block text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                          {p.currentStage}
                        </span>
                        {p.renewalDate && (
                          <p className="text-[10px] text-slate-400 mt-1 font-medium font-sans">
                            Renewal scheduled: <strong>{p.renewalDate}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {customerPolicies.length === 0 && (
                    <div className="py-6 text-center text-slate-400 italic text-xs bg-slate-50 border border-dashed rounded-xl">
                      No policy agreements currently bound to this applicant footprint.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs py-16">
              Establish a new profile, or select a CRM client row on the list to exhibit the bento dossier index.
            </div>
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function resolveCustomerDoc(customer, keys) {
  // keys: { path: string[], name?: string[], match?: string[] }
  if (!customer) return { path: null, fileName: null };

  let path = null;
  for (const k of keys.path || []) {
    if (customer[k]) {
      path = customer[k];
      break;
    }
  }

  // fallback: documents[] array from API
  if (!path && Array.isArray(customer.documents)) {
    for (const d of customer.documents) {
      const label = String(d.label || d.category || d.name || '').toLowerCase();
      if (keys.match && keys.match.some((m) => label.includes(m))) {
        path = d.path || d.url || d.file || null;
        return {
          path,
          fileName:
            d.fileName ||
            d.name ||
            (path ? String(path).split('/').pop() : null),
        };
      }
    }
  }

  let fileName = null;
  for (const k of keys.name || []) {
    if (customer[k]) {
      fileName = customer[k];
      break;
    }
  }
  if (!fileName && path) {
    fileName = String(path).split('/').pop();
  }

  return { path: path || null, fileName };
}

export default function Customers({
  customers = [],
  updateCustomer,
  onUpdateCustomer,
  deleteCustomer,
  onShowNotification,
  policies = [],
  initialEnquiry = null,
}) {
  const notify = (msg) => {
    if (typeof onShowNotification === 'function') onShowNotification(msg);
    else console.warn('[Customers]', msg);
  };

  const saveCustomerPatch = onUpdateCustomer || updateCustomer;

  const [activeTab, setActiveTab] = useState('customers');
  const [search, setSearch] = useState('');
  const [enquirySearch, setEnquirySearch] = useState('');
  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [renewalDraft, setRenewalDraft] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Edit form extras
  const [editNominee, setEditNominee] = useState({
    name: '',
    dob: '',
    relationship: '',
    mobile: '',
    mobile2: '',
    email: '',
  });

  // If other parts of the app requested a specific subtab, honour it once
  useEffect(() => {
    try {
      const requested = localStorage.getItem('aynkaran_customers_tab');
      if (requested) {
        if (requested === 'enquiries') setActiveTab('enquiries');
        // remove the flag so it doesn't persist
        localStorage.removeItem('aynkaran_customers_tab');
      }
    } catch (_) {}
    // run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialEnquiry) {
      setActiveTab('enquiries');
      setSelectedEnquiry(initialEnquiry);
    }
  }, [initialEnquiry]);
  const [editAadhaarFile, setEditAadhaarFile] = useState(null);
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPanFile, setEditPanFile] = useState(null);
  const [editMarksheetFile, setEditMarksheetFile] = useState(null);
  const [editBankProofFile, setEditBankProofFile] = useState(null);
  const [editSignatureFile, setEditSignatureFile] = useState(null);
  const [editIncomeProofFile, setEditIncomeProofFile] = useState(null);

 const [clearedDocs, setClearedDocs] = useState({
  aadhaar: false,
  photo: false,
  pan: false,
  marksheet: false,
  bankProof: false,
  signature: false,
  incomeProof: false,
});


  // ---------- Load / persist enquiries ----------
  const loadEnquiries = async () => {
    try {
      setLoadingEnquiries(true);
      const res = await fetch(`${API_URL}/api/enquiries?type=customer`);
      if (!res.ok) throw new Error('Failed to load enquiries');
      const data = await res.json();
      let list = Array.isArray(data) ? data : data.enquiries || [];

      // Merge local read/deleted flags if any
      try {
        const local = JSON.parse(localStorage.getItem('sec_enquiries_meta') || '{}');
        list = list.map((e) => {
          const id = e.id || e._id || e.timestamp;
          return {
            ...e,
            isRead: local[id]?.isRead ?? e.isRead ?? false,
          };
        });
      } catch (_) {}

      setEnquiries(list);
    } catch (err) {
      console.error(err);
      try {
        const raw = localStorage.getItem('sec_enquiries');
        if (raw) {
          const list = JSON.parse(raw);
          setEnquiries(Array.isArray(list) ? list : []);
        } else {
          setEnquiries([]);
        }
      } catch (_) {
        setEnquiries([]);
      }
    } finally {
      setLoadingEnquiries(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'enquiries') loadEnquiries();
  }, [activeTab]);

  // Persist read flags locally
  const persistMeta = (list) => {
    try {
      const meta = {};
      list.forEach((e) => {
        const id = e.id || e._id || e.timestamp;
        if (id) meta[id] = { isRead: !!e.isRead };
      });
      localStorage.setItem('sec_enquiries_meta', JSON.stringify(meta));
      localStorage.setItem('sec_enquiries', JSON.stringify(list));
    } catch (_) {}
  };

  // ---------- Mark as Read / Unread ----------
  const toggleRead = async (enquiry) => {
    const id = enquiry.id || enquiry._id || enquiry.timestamp;
    const nextRead = !enquiry.isRead;

    // Optimistic update
    setEnquiries((prev) => {
      const updated = prev.map((e) =>
        (e.id || e._id || e.timestamp) === id ? { ...e, isRead: nextRead } : e
      );
      persistMeta(updated);
      return updated;
    });

    // Optional backend call (ignore if route doesn't exist yet)
    try {
      await fetch(`${API_URL}/api/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: nextRead }),
      });
    } catch (_) {}

    notify(nextRead ? 'Marked as read' : 'Marked as unread');
  };

  // ---------- Delete enquiry ----------
  const deleteEnquiry = async (enquiry) => {
    const id = enquiry.id || enquiry._id || enquiry.timestamp;
    const ok = window.confirm(
      `Delete enquiry from "${enquiry.name}"?\n\nThis cannot be undone.`
    );
    if (!ok) return;

    // Optimistic remove
    setEnquiries((prev) => {
      const updated = prev.filter(
        (e) => (e.id || e._id || e.timestamp) !== id
      );
      persistMeta(updated);
      return updated;
    });

    if (selectedEnquiry && (selectedEnquiry.id || selectedEnquiry._id || selectedEnquiry.timestamp) === id) {
      setSelectedEnquiry(null);
    }

    // Optional backend call
    try {
      await fetch(`${API_URL}/api/enquiries/${id}`, { method: 'DELETE' });
    } catch (_) {}

    notify('Enquiry deleted');
  };

  // ---------- Unread count for badge ----------
  const unreadCount = useMemo(
    () => enquiries.filter((e) => !e.isRead).length,
    [enquiries]
  );

  // ---------- Customers filtering ----------
  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const blob = [
        c.name,
        c.mobile,
        c.email,
        c.insuranceCompany,
        c.policyType,
        c.advisor,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [customers, search]);

  const filteredEnquiries = useMemo(() => {
    const q = enquirySearch.trim().toLowerCase();
    if (!q) return enquiries;
    return enquiries.filter((e) => {
      const blob = [
        e.name,
        e.mobile,
        e.whatsApp,
        e.email,
        e.city,
        e.message,
        e.gender,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [enquiries, enquirySearch]);

  // ---------- Helpers ----------
  const photoUrl = (c) => {
    const path = c.photoUrl || c.profilePhoto || c.passportPhoto || null;
    if (!path) return null;
    if (String(path).startsWith('http') || String(path).startsWith('blob:')) {
      return path;
    }
    return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const fileUrl = (path) => {
    if (!path) return null;
    if (String(path).startsWith('http') || String(path).startsWith('blob:')) {
      return path;
    }
    return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const getDocuments = (c) => {
  if (!c) return [];

  if (Array.isArray(c.documents) && c.documents.length) {
    return c.documents
      .filter((d) => d.path || d.url || d.file)
      .map((d) => ({
        label: d.label || d.name || d.category || 'Document',
        path: d.path || d.url || d.file,
        name: d.fileName || d.name || d.label || 'file',
      }));
  }

  const pairs = [
    ['Aadhaar', c.aadhaarUrl || c.aadhaarFile, c.aadhaarFileName],
    ['PAN', c.panUrl || c.panFile, c.panFileName],
    ['Photo', c.photoUrl || c.profilePhoto || c.passportPhoto, c.photoFileName],
    ['Marksheet', c.marksheetUrl || c.marksheetFile, c.marksheetFileName],
    ['Bank Proof', c.bankProofUrl || c.bankProofFile, c.bankProofFileName],
    ['Signature', c.signatureUrl || c.signatureFile, c.signatureFileName],
    ['Income Proof', c.incomeProofUrl || c.incomeProofFile, c.incomeProofFileName],
  ];

  return pairs
    .filter(([, path]) => path)
    .map(([label, path, fileName]) => ({
      label,
      path,
      // Prefer original upload name; fall back to path basename
      name:
        fileName ||
        (typeof path === 'string' ? path.split('/').pop() : label),
    }));
};

  // ---------- Open customer ----------
  const openCustomer = (c) => {
    setSelectedCustomer(c);
    setIsEditing(false);
    setRenewalDraft(c.renewalDate || c.policyRenewalDate || '');

    setEditForm({
      name: c.name || '',
      mobile: c.mobile || '',
      mobile2: c.mobile2 || '',
      email: c.email === 'N/A' ? '' : c.email || '',
      address: c.address || '',
      insuranceCompany: c.insuranceCompany || '',
      policyType: c.policyType || '',
      advisor: c.advisor || '',
      gender: c.gender || '',
      dateOfBirth: c.dateOfBirth || c.dob || '',
      bloodGroup: c.bloodGroup || '',
      occupation: c.occupation || '',
      annualIncome: c.annualIncome || '',
      fatherName: c.fatherName || '',
      motherName: c.motherName || '',
      spouseName: c.spouseName || '',
    });

    const nom = c.nominee || {};
    setEditNominee({
      name: nom.name || '',
      dob: nom.dob || '',
      relationship: nom.relationship || '',
      mobile: nom.mobile || '',
      mobile2: nom.mobile2 || '',
      email: nom.email || '',
    });

    setEditAadhaarFile(null);
    setEditPhotoFile(null);
    setEditPanFile(null);
    setEditMarksheetFile(null);
    setEditBankProofFile(null);
    setEditSignatureFile(null);
    setEditIncomeProofFile(null);
  };

  const saveRenewalDate = () => {
    if (!selectedCustomer) return;
    if (!renewalDraft) {
      notify('Please select a renewal date');
      return;
    }
    const id = selectedCustomer.id || selectedCustomer._id;
    const patch = { renewalDate: renewalDraft };
    if (typeof saveCustomerPatch === 'function') {
      saveCustomerPatch(id, patch);
    } else {
      notify('updateCustomer is not connected');
      return;
    }
    setSelectedCustomer((prev) => (prev ? { ...prev, ...patch } : prev));
    notify(`Renewal date set for ${selectedCustomer.name}`);
  };

  const saveCustomerEdits = async () => {
  if (!selectedCustomer) return;
  const id = selectedCustomer.id || selectedCustomer._id;

  if (!editForm.name?.trim()) {
    notify('Name is required');
    return;
  }
  if (!editForm.mobile || String(editForm.mobile).replace(/\D/g, '').length < 10) {
    notify('Valid mobile is required');
    return;
  }

  const patch = {
    name: editForm.name.trim(),
    mobile: String(editForm.mobile || '').replace(/\D/g, ''),
    mobile2: String(editForm.mobile2 || '').replace(/\D/g, '') || undefined,
    email: editForm.email.trim() || 'N/A',
    address: editForm.address.trim(),
    insuranceCompany: editForm.insuranceCompany.trim(),
    policyType: editForm.policyType.trim(),
    advisor: editForm.advisor.trim(),
    gender: editForm.gender,
    dateOfBirth: editForm.dateOfBirth,
    bloodGroup: editForm.bloodGroup,
    occupation: editForm.occupation.trim(),
    annualIncome: editForm.annualIncome,
    fatherName: editForm.fatherName.trim(),
    motherName: editForm.motherName.trim(),
    spouseName: editForm.spouseName.trim(),
    nominee: {
      name: editNominee.name.trim(),
      dob: editNominee.dob,
      relationship: editNominee.relationship.trim(),
      mobile: String(editNominee.mobile || '').replace(/\D/g, ''),
      mobile2: String(editNominee.mobile2 || '').replace(/\D/g, '') || undefined,
      email: editNominee.email.trim() || undefined,
    },
  };

  // Upload helper (same API as Companies & Policies)
  const uploadOne = async (file, category) => {
    if (!file) return null;
    try {
      const result = await apiService.uploadDocument(
        file,
        category,
        id,
        'customer'
      );
      const path =
        result?.path ||
        result?.url ||
        result?.filePath ||
        result?.data?.path ||
        result?.data?.url ||
        null;
      return {
        path,
        fileName: result?.fileName || result?.name || file.name,
      };
    } catch (err) {
      console.error(`Upload failed (${category}):`, err);
      notify(`Upload failed for ${category}: ${err.message}`);
      return null;
    }
  };

  const [
    aadhaarUp,
    photoUp,
    panUp,
    marksheetUp,
    bankUp,
    signatureUp,
    incomeUp,
  ] = await Promise.all([
    uploadOne(editAadhaarFile, 'aadhaar'),
    uploadOne(editPhotoFile, 'photo'),
    uploadOne(editPanFile, 'pan'),
    uploadOne(editMarksheetFile, 'marksheet'),
    uploadOne(editBankProofFile, 'bankProof'),
    uploadOne(editSignatureFile, 'signature'),
    uploadOne(editIncomeProofFile, 'incomeProof'),
  ]);

  const applyDoc = (uploaded, cleared, currentPath, currentName, urlField, nameField) => {
    if (uploaded?.path) {
      patch[urlField] = uploaded.path;
      patch[nameField] = uploaded.fileName;
      return;
    }
    if (cleared) {
      patch[urlField] = null;
      patch[nameField] = null;
      return;
    }
    if (currentPath) {
      patch[urlField] = currentPath;
      patch[nameField] = currentName || undefined;
    }
  };

  applyDoc(
    aadhaarUp,
    clearedDocs.aadhaar,
    selectedCustomer?.aadhaarUrl || selectedCustomer?.aadhaarFile,
    selectedCustomer?.aadhaarFileName,
    'aadhaarUrl',
    'aadhaarFileName'
  );
  applyDoc(
    photoUp,
    clearedDocs.photo,
    selectedCustomer?.photoUrl ||
      selectedCustomer?.profilePhoto ||
      selectedCustomer?.passportPhoto,
    selectedCustomer?.photoFileName,
    'photoUrl',
    'photoFileName'
  );
  applyDoc(
    panUp,
    clearedDocs.pan,
    selectedCustomer?.panUrl || selectedCustomer?.panFile,
    selectedCustomer?.panFileName,
    'panUrl',
    'panFileName'
  );
  applyDoc(
    marksheetUp,
    clearedDocs.marksheet,
    selectedCustomer?.marksheetUrl || selectedCustomer?.marksheetFile,
    selectedCustomer?.marksheetFileName,
    'marksheetUrl',
    'marksheetFileName'
  );
  applyDoc(
    bankUp,
    clearedDocs.bankProof,
    selectedCustomer?.bankProofUrl || selectedCustomer?.bankProofFile,
    selectedCustomer?.bankProofFileName,
    'bankProofUrl',
    'bankProofFileName'
  );
  applyDoc(
    signatureUp,
    clearedDocs.signature,
    selectedCustomer?.signatureUrl || selectedCustomer?.signatureFile,
    selectedCustomer?.signatureFileName,
    'signatureUrl',
    'signatureFileName'
  );
  applyDoc(
    incomeUp,
    clearedDocs.incomeProof,
    selectedCustomer?.incomeProofUrl || selectedCustomer?.incomeProofFile,
    selectedCustomer?.incomeProofFileName,
    'incomeProofUrl',
    'incomeProofFileName'
  );

  if (typeof saveCustomerPatch === 'function') {
    await saveCustomerPatch(id, patch);
  } else {
    notify('updateCustomer is not connected');
    return;
  }

  setSelectedCustomer((prev) => (prev ? { ...prev, ...patch } : prev));
  {!isEditing && (
  <button
    type="button"
    onClick={() => {
      setClearedDocs({
        aadhaar: false,
        photo: false,
        pan: false,
        marksheet: false,
        bankProof: false,
        signature: false,
        incomeProof: false,
      });
      setEditAadhaarFile(null);
      setEditPhotoFile(null);
      setEditPanFile(null);
      setEditMarksheetFile(null);
      setEditBankProofFile(null);
      setEditSignatureFile(null);
      setEditIncomeProofFile(null);
      setIsEditing(true);
    }}
    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 flex items-center gap-1.5"
  >
    <Edit className="w-3.5 h-3.5" />
    Edit
  </button>
)}}

  return (
    <div className="space-y-5" id="customers-module">
      {/* Header + tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Customer Registry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Policy customers and website enquiries in one place
          </p>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'customers'
                ? 'bg-[#0078d4] text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Customers
            <span className="ml-1 text-[10px] opacity-80">({customers.length})</span>
          </button>
          <button
  type="button"
  onClick={() => setActiveTab('enquiries')}
  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
    activeTab === 'enquiries'
      ? 'bg-[#0078d4] text-white shadow'
      : 'text-slate-400 hover:text-white'
  }`}
>
  <Inbox className="w-3.5 h-3.5" />
  Enquiries
  {unreadCount > 0 && (
    <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">
      {unreadCount}
    </span>
  )}
</button>
        </div>
      </div>

      {/* ========== CUSTOMERS TAB ========== */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, mobile, policy, company..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white outline-none focus:border-blue-500"
            />
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-12 text-center">
              <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-semibold">No customers yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Create a customer from Companies & Policies → Select policy → Create Customer
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCustomers.map((c) => {
                const id = c.id || c._id;
                const src = photoUrl(c);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => openCustomer(c)}
                    className="text-left rounded-xl border border-slate-700 bg-slate-800/60 hover:border-blue-500/50 hover:bg-slate-800 p-4 transition shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 border border-slate-600 flex-shrink-0 flex items-center justify-center">
                        {src ? (
                          <img src={src} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-slate-300">
                            {(c.name || '?').slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white truncate">{c.name}</h3>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {c.mobile || '—'}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          {c.insuranceCompany || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-700/80 grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <p className="text-slate-500 uppercase font-bold tracking-wider">Policy</p>
                        <p className="text-slate-200 font-semibold truncate mt-0.5">
                          {c.policyType || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase font-bold tracking-wider">Renewal</p>
                        <p
                          className={`font-semibold mt-0.5 ${
                            c.renewalDate || c.policyRenewalDate
                              ? 'text-emerald-300'
                              : 'text-amber-300'
                          }`}
                        >
                          {c.renewalDate || c.policyRenewalDate || 'Not set'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========== ENQUIRIES TAB ========== */}
      {activeTab === 'enquiries' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={enquirySearch}
                onChange={(e) => setEnquirySearch(e.target.value)}
                placeholder="Search enquiries..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={loadEnquiries}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 border border-slate-700 text-slate-200 hover:border-blue-500 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingEnquiries ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loadingEnquiries && enquiries.length === 0 ? (
            <p className="text-xs text-slate-400 p-6 text-center">Loading enquiries...</p>
          ) : filteredEnquiries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-12 text-center">
              <Inbox className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-semibold">No enquiries yet</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold">Name</th>
                      <th className="px-4 py-3 font-bold">Mobile</th>
                      <th className="px-4 py-3 font-bold">Email</th>
                      <th className="px-4 py-3 font-bold">City</th>
                      <th className="px-4 py-3 font-bold">Message</th>
                      <th className="px-4 py-3 font-bold">Received</th>
                      <th className="px-4 py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-800/40">
                    {filteredEnquiries.map((e) => {
  const id = e.id || e._id || e.timestamp;
  const isRead = !!e.isRead;
  return (
    <tr
      key={id}
      onClick={() => setSelectedEnquiry(e)}
      className={`hover:bg-slate-800/80 cursor-pointer ${
        isRead ? 'opacity-70' : 'bg-blue-500/5'
      }`}
    >
      <td className="px-4 py-3">
        {isRead ? (
          <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Read
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-400 text-[10px] font-bold">
            <Circle className="w-3.5 h-3.5" /> New
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-white font-semibold whitespace-nowrap">
        {e.name}
      </td>
      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
        {e.mobile || e.whatsApp || '—'}
      </td>
      <td className="px-4 py-3 text-slate-300 max-w-[160px] truncate">
        {e.email || '—'}
      </td>
      <td className="px-4 py-3 text-slate-300">{e.city || '—'}</td>
      <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">
        {e.message || e.notes || '—'}
      </td>
      <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-[10px]">
        {e.timestamp || e.createdAt || '—'}
      </td>
      <td
        className="px-4 py-3"
        onClick={(ev) => ev.stopPropagation()}  /* don't open popup when clicking actions */
      >
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            title={isRead ? 'Mark as unread' : 'Mark as read'}
            onClick={() => toggleRead(e)}
            className={`p-1.5 rounded-lg border transition ${
              isRead
                ? 'bg-slate-700/50 text-slate-400 border-slate-600 hover:text-white'
                : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/30'
            }`}
          >
            {isRead ? (
              <Circle className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            title="Delete enquiry"
            onClick={() => deleteEnquiry(e)}
            className="p-1.5 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
})}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== ENQUIRY DETAIL POPUP ========== */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-[99] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#1e293b] shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedEnquiry(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 space-y-4">
              <div>
<<<<<<< HEAD
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Website Enquiry
=======
                <p className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider mb-2">1. Core Personal details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Priyamvada Raman"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Spouse Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Venkatesh Prasad"
                      value={spouseName}
                      onChange={(e) => setSpouseName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800"
                    />
                  </div>
                </div>

                {userRole !== 'Staff' && (
                  <div className="mt-3">
                    <label className="block font-bold text-slate-700 mb-1">Assigned Agent (Advisor Code)</label>
                    <select
                      value={agentCodeField}
                      onChange={(e) => setAgentCodeField(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs"
                    >
                      <option value="">-- No Agent / Direct Sale --</option>
                      {(candidates || [])
                        .filter(c => c.exam?.agentCodeGenerated)
                        .map(c => (
                          <option key={c.id} value={c.exam.agentCodeGenerated}>
                            {c.name} ({c.exam.agentCodeGenerated})
                          </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">Select the recruiter/advisor who introduced this customer profile.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Father’s Full Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="Father's Name"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mother’s Full Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="Mother's Name"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Date of Birth *</label>
                    <DualDateInput
                      required
                      value={dob}
                      onChange={setDob}
                      placeholder="YYYY-MM-DD or DD-MM-YYYY"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mobile Contact Phone *</label>
                    <input
                      required
                      type="tel"
                      placeholder="+91 98450..."
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email ID</label>
                    <div className="flex bg-slate-50 border border-slate-300 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                      <input
                        type="text"
                        placeholder="e.g. user"
                        value={emailId ? (emailId.endsWith('@gmail.com') ? emailId.substring(0, emailId.indexOf('@gmail.com')) : emailId) : ''}
                        onChange={(e) => {
                          const prefix = e.target.value.replace(/[^a-zA-Z0-9._-]/g, '');
                          setEmailId(prefix ? `${prefix}@gmail.com` : '');
                        }}
                        className="flex-1 bg-transparent px-3 py-2 text-slate-800 text-xs focus:outline-none"
                      />
                      <span className="bg-slate-300/60 text-slate-600 px-3 py-2 text-xs font-semibold flex items-center select-none border-l border-slate-200">
                        @gmail.com
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block font-bold text-slate-700 mb-1">Postal Address</label>
                  <textarea
                    required
                    placeholder="Provide full permanent / billing address of insurance applicant..."
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800"
                  ></textarea>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider mb-2">2. Nominee particulars</p>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nominee Full Name"
                        value={nomineeName}
                        onChange={(e) => setNomineeName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-1.5 text-slate-800"
                      />
                      <DualDateInput
                        value={nomineeDob}
                        onChange={setNomineeDob}
                        placeholder="Nominee Date of Birth"
                      />
                      <input
                        type="text"
                        placeholder="Relationship with Applicant (Spouse, Son)"
                        value={nomineeRelationship}
                        onChange={(e) => setNomineeRelationship(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-1.5 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider mb-2">3. Work particulars</p>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Estimated Annual Income (₹)"
                        value={annualIncome}
                        onChange={(e) => setAnnualIncome(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-1.5 text-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Occupation / Place of employment"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-1.5 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider mb-2">
                  4. Initial KYC Document Uploads (Special: Passport photo sets Profile Picture)
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
                </p>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedEnquiry.name}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Info icon={User} label="Gender" value={selectedEnquiry.gender} />
                <Info
                  icon={Calendar}
                  label="Date of Birth"
                  value={selectedEnquiry.dateOfBirth || selectedEnquiry.dob}
                />
                <Info icon={Phone} label="Mobile" value={selectedEnquiry.mobile} />
                <Info
                  icon={Phone}
                  label="WhatsApp"
                  value={selectedEnquiry.whatsApp || selectedEnquiry.mobile}
                />
                <Info icon={Mail} label="Email" value={selectedEnquiry.email} />
                <Info icon={MapPin} label="City" value={selectedEnquiry.city} />
              </div>
              <div className="rounded-xl bg-slate-900/50 border border-slate-700 p-3">
                <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                  Message
                </p>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed whitespace-pre-wrap">
                  {selectedEnquiry.message || selectedEnquiry.notes || '—'}
                </p>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Received: {selectedEnquiry.timestamp || selectedEnquiry.createdAt || '—'}
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    toggleRead(selectedEnquiry);
                    setSelectedEnquiry((prev) =>
                      prev ? { ...prev, isRead: !prev.isRead } : prev
                    );
                  }}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30"
                >
                  {selectedEnquiry.isRead ? 'Mark Unread' : 'Mark as Read'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteEnquiry(selectedEnquiry)}
                  className="px-3 py-2 rounded-lg text-xs font-bold bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== CUSTOMER DETAIL / EDIT POPUP ========== */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[99] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#1e293b] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setSelectedCustomer(null);
                setIsEditing(false);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>

<<<<<<< HEAD
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pr-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-700 border border-slate-600 flex items-center justify-center">
                    {photoUrl(selectedCustomer) ? (
                      <img
                        src={photoUrl(selectedCustomer)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-slate-300">
                        {(selectedCustomer.name || '?').slice(0, 1)}
                      </span>
                    )}
=======
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
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {isEditing ? 'Edit Customer' : selectedCustomer.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedCustomer.policyType || 'Policy customer'}
                    </p>
                  </div>
                </div>
<<<<<<< HEAD
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
=======
              )}
            </div>

            <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-mono">Status: Secure Sandbox Encrypted</span>
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
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
              </div>

              {/* View mode */}
              {!isEditing && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <Info icon={Phone} label="Mobile" value={selectedCustomer.mobile} />
                    <Info icon={Mail} label="Email" value={selectedCustomer.email} />
                    <Info
                      icon={Building2}
                      label="Insurer"
                      value={selectedCustomer.insuranceCompany}
                    />
                    <Info
                      icon={Shield}
                      label="Policy Scheme"
                      value={selectedCustomer.policyType}
                    />
                    <Info icon={User} label="Advisor" value={selectedCustomer.advisor} />
                    <Info icon={MapPin} label="Address" value={selectedCustomer.address} />
                    <Info icon={User} label="Gender" value={selectedCustomer.gender} />
                    <Info
                      icon={Calendar}
                      label="DOB"
                      value={selectedCustomer.dateOfBirth || selectedCustomer.dob}
                    />
                  </div>

                  {/* Documents */}
                  <div className="rounded-xl border border-slate-600 bg-slate-900/50 p-4 space-y-3">
                    <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      KYC Documents
                    </p>
                    {getDocuments(selectedCustomer).length === 0 ? (
                      <p className="text-[11px] text-slate-500">
                        No documents attached yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {getDocuments(selectedCustomer).map((doc) => {
                          const href = fileUrl(doc.path);
                          return (
                            <div
                              key={doc.label}
                              className="flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">
                                  {doc.label}
                                </p>
                                <p className="text-[11px] text-slate-200 truncate">
                                  {doc.name || 'file'}
                                </p>
                              </div>
                              {href && (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className="p-1.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30"
                                  title="Download / open"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Renewal */}
                  <div className="rounded-xl border border-slate-600 bg-slate-900/50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <p className="text-xs font-bold text-white uppercase tracking-wider">
                        Policy Renewal Date
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="date"
                        value={renewalDraft}
                        onChange={(e) => setRenewalDraft(e.target.value)}
                        onClick={(e) => {
                          try {
                            e.currentTarget.showPicker?.();
                          } catch (_) {}
                        }}
                        className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={saveRenewalDate}
                        className="px-4 py-2 bg-[#0078d4] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition"
                      >
                        Save Renewal Date
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ========== FULL EDIT FORM ========== */}
              {isEditing && (
                <div className="space-y-5 text-xs">
                  {/* Personal Details */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                      Personal Details
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'name', label: 'Full Name *' },
                        { key: 'mobile', label: 'Mobile *' },
                        { key: 'mobile2', label: 'Alternate Mobile' },
                        { key: 'email', label: 'Email' },
                        { key: 'gender', label: 'Gender' },
                        { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
                        { key: 'bloodGroup', label: 'Blood Group' },
                        { key: 'occupation', label: 'Occupation' },
                        { key: 'annualIncome', label: 'Annual Income' },
                        { key: 'fatherName', label: "Father's Name" },
                        { key: 'motherName', label: "Mother's Name" },
                        { key: 'spouseName', label: 'Spouse Name' },
                        { key: 'insuranceCompany', label: 'Insurer' },
                        { key: 'policyType', label: 'Policy Scheme' },
                        { key: 'advisor', label: 'Advisor' },
                      ].map((f) => (
                        <div key={f.key} className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-400 font-bold">
                            {f.label}
                          </label>
                          <input
                            type={f.type || 'text'}
                            value={editForm[f.key] || ''}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                [f.key]:
                                  f.key === 'mobile' || f.key === 'mobile2'
                                    ? e.target.value.replace(/\D/g, '')
                                    : e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white outline-none focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 space-y-1">
                      <label className="text-[10px] uppercase text-slate-400 font-bold">
                        Address
                      </label>
                      <textarea
                        rows={2}
                        value={editForm.address || ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, address: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Nominee Details */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                      Nominee Details
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'name', label: 'Nominee Name' },
                        { key: 'relationship', label: 'Relationship' },
                        { key: 'dob', label: 'Nominee DOB', type: 'date' },
                        { key: 'mobile', label: 'Nominee Mobile' },
                        { key: 'mobile2', label: 'Nominee Alt. Mobile' },
                        { key: 'email', label: 'Nominee Email' },
                      ].map((f) => (
                        <div key={f.key} className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-400 font-bold">
                            {f.label}
                          </label>
                          <input
                            type={f.type || 'text'}
                            value={editNominee[f.key] || ''}
                            onChange={(e) =>
                              setEditNominee((prev) => ({
                                ...prev,
                                [f.key]:
                                  f.key === 'mobile' || f.key === 'mobile2'
                                    ? e.target.value.replace(/\D/g, '')
                                    : e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white outline-none focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

{/* KYC Documents */}
<div>
  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
    KYC Documents (remove only if you want to replace)
  </p>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {[
      {
        label: 'Aadhaar',
        file: editAadhaarFile,
        setFile: setEditAadhaarFile,
        key: 'aadhaar',
        pathKeys: ['aadhaarUrl', 'aadhaarFile'],
        nameKeys: ['aadhaarFileName'],
        match: ['aadhaar'],
      },
      {
        label: 'Photo',
        file: editPhotoFile,
        setFile: setEditPhotoFile,
        key: 'photo',
        pathKeys: ['photoUrl', 'profilePhoto', 'passportPhoto'],
        nameKeys: ['photoFileName'],
        match: ['photo', 'passport'],
      },
      {
        label: 'PAN',
        file: editPanFile,
        setFile: setEditPanFile,
        key: 'pan',
        pathKeys: ['panUrl', 'panFile'],
        nameKeys: ['panFileName'],
        match: ['pan'],
      },
      {
        label: 'Marksheet',
        file: editMarksheetFile,
        setFile: setEditMarksheetFile,
        key: 'marksheet',
        pathKeys: ['marksheetUrl', 'marksheetFile'],
        nameKeys: ['marksheetFileName'],
        match: ['marksheet', 'education'],
      },
      {
        label: 'Bank Proof',
        file: editBankProofFile,
        setFile: setEditBankProofFile,
        key: 'bankProof',
        pathKeys: ['bankProofUrl', 'bankProofFile'],
        nameKeys: ['bankProofFileName'],
        match: ['bank'],
      },
      {
        label: 'Signature',
        file: editSignatureFile,
        setFile: setEditSignatureFile,
        key: 'signature',
        pathKeys: ['signatureUrl', 'signatureFile'],
        nameKeys: ['signatureFileName'],
        match: ['signature'],
      },
      {
        label: 'Income Proof',
        file: editIncomeProofFile,
        setFile: setEditIncomeProofFile,
        key: 'incomeProof',
        pathKeys: ['incomeProofUrl', 'incomeProofFile'],
        nameKeys: ['incomeProofFileName'],
        match: ['income'],
      },
    ].map((doc) => {
      const resolved = resolveCustomerDoc(selectedCustomer, {
        path: doc.pathKeys,
        name: doc.nameKeys,
        match: doc.match,
      });
      const existingPath = !clearedDocs[doc.key] ? resolved.path : null;
      const existingName = resolved.fileName;

      return (
        <CustomerDocZone
          key={doc.key}
          label={doc.label}
          file={doc.file}
          setFile={doc.setFile}
          existingPath={existingPath}
          existingName={existingName}
          onClearExisting={() => {
            setClearedDocs((p) => ({ ...p, [doc.key]: true }));
            doc.setFile(null);
          }}
        />
      );
    })}
  </div>
</div>

{/* Actions */}
<div className="flex justify-end gap-2 pt-3 border-t border-slate-700">
  <button
    type="button"
    onClick={() => setIsEditing(false)}
    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
  >
    Cancel
  </button>
  <button
    type="button"
    onClick={saveCustomerEdits}
    className="px-4 py-2 bg-[#0078d4] hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
  >
    <Save className="w-3.5 h-3.5" />
    Save Changes
  </button>
</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Superadmin OTP Verification Modal Overlay */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md p-6 rounded-3xl shadow-2xl relative space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">OTP Deletion Lock</h3>
                <p className="text-[11px] text-slate-400">Security Approval Verification</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-3">
              <p>
                Deleting records requires Superadmin authorization context. A one-time verification passcode (OTP) has been queued to Superadmin registered coordinate email: **kiruthickrn@gmail.com**.
              </p>

              {otpLoading && (
                <div className="py-2 flex items-center gap-2 text-indigo-600 text-[11px] font-bold">
                  <span className="w-2.5 h-2.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                  <span>Generating securely...</span>
                </div>
              )}

              {otpError && (
                <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-xl">
                  {otpError}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter 6-digit OTP passcode"
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center py-3 bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold tracking-widest rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpModal(false);
                    setEnteredOtp('');
                    setOtpError('');
                  }}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtpDelete}
                  disabled={otpLoading}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-md shadow-indigo-100"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
<<<<<<< HEAD

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg bg-slate-900/40 border border-slate-700/80 px-3 py-2">
      <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </p>
      <p className="text-slate-200 font-semibold mt-0.5 truncate" title={value || ''}>
        {value || '—'}
      </p>
    </div>
  );
}
=======
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
