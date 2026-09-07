// src/modules/customers/Customers.jsx
import React, { useEffect, useMemo, useState } from 'react';
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
  FileText,
  Save,
  CheckCircle2,
  Circle,
  Trash2,
} from 'lucide-react';
import apiService from '../../services/api';

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
    </div>
  );
}

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
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Website Enquiry
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
    </div>
  );
}

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
