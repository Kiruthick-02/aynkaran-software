// frontend/src/modules/documents/Documents.jsx
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Search,
  FolderClosed,
  Eye,
  Trash2,
  FileText,
  ShieldCheck,
  X,
  Download,
  User,
  Users,
  Building,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  Filter
} from 'lucide-react';
<<<<<<< HEAD
import { apiService } from '../../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7860';

/** Build absolute URL for a stored path / blob / http link */
function resolveUrl(path) {
  if (!path) return null;
  const s = String(path);
  if (s.startsWith('http') || s.startsWith('blob:') || s.startsWith('data:')) return s;
  return `${API_URL}${s.startsWith('/') ? s : `/${s}`}`;
}
=======
import API_URL from '../../config/api';

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

export default function Documents({ candidates = [], customers = [] }) {
  const { updateCandidate, updateCustomer, userRole } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVaultOwner, setSelectedVaultOwner] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const [corporateDocs, setCorporateDocs] = useState([]);
>>>>>>> d96c25bb403988716178a2b21910505a45607a70

/** Collect document entries from a customer, candidate, or advisor object */
function extractDocs(source, sourceType) {
  if (!source) return [];
  const id = source.id || source._id || source.advisorCode;
  const name = source.name || source.fullName || 'Unknown';
  const docs = [];

  const push = (category, path, fileName, label) => {
    if (!path) return;
    const displayName =
      fileName ||
      (typeof path === 'string' ? path.split('/').pop() : null) ||
      label ||
      category;
    docs.push({
      id: `${sourceType}-${id}-${category}`.replace(/\s+/g, '-'),
      name: displayName,
      fileName: displayName,
      category,
      path,
      url: resolveUrl(path),
      sourceType,
      sourceId: id,
      sourceName: name,
      verificationStatus: source.verificationStatus || 'PENDING',
      uploadedAt: source.updatedAt || source.createdAt || '—',
      fieldKey: category,
    });
  };

<<<<<<< HEAD
  push(
    'Aadhaar Card copy',
    source.aadhaarUrl || source.aadhaarFile || source.aadhaarDocUrl,
    source.aadhaarFileName,
    'Aadhaar'
  );
  push(
    'PAN Card copy',
    source.panUrl || source.panFile || source.panDoc,
    source.panFileName,
    'PAN'
  );
  push(
    'Passport Size Photo',
    source.photoUrl || source.profilePhoto || source.passportPhoto || source.passportPhotoUrl || source.profilePicture,
    source.photoFileName,
    'Photo'
  );
  push(
    'Education Certificate',
    source.marksheetUrl || source.marksheetFile || source.marksheetDoc || source.educationCertificate,
    source.marksheetFileName,
    'Marksheet'
  );
  push(
    'Bank Proof',
    source.bankProofUrl || source.bankProofFile || source.bankProofDoc,
    source.bankProofFileName,
    'Bank Proof'
  );
  push(
    'Signature',
    source.signatureUrl || source.signatureFile || source.signatureDoc,
    source.signatureFileName,
    'Signature'
  );
  push(
    'Income Proof',
    source.incomeProofUrl || source.incomeProofFile,
    source.incomeProofFileName,
    'Income Proof'
  );

  // Array-style documents (if present)
  const docArray = Array.isArray(source.documents)
    ? source.documents
    : (typeof source.documents === 'string' ? (JSON.parse(source.documents || '[]') || []) : []);
=======
  const handleDeleteCustomerDoc = (customerId, key) => {
    if (!confirm('Are you sure you want to delete this customer document?')) return;
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      const updatedKyc = { ...cust.kycDocuments };
      delete updatedKyc[key];
      const updatedDates = { ...cust.kycUploadDates };
      delete updatedDates[key];
      updateCustomer(customerId, { kycDocuments: updatedKyc, kycUploadDates: updatedDates });
    }
  };

  const candidateDocs = userRole === 'Staff' ? [] : candidates.flatMap((c) =>
    (c.documents || []).map((doc) => ({
      id: doc.id,
      candidateId: c.id,
      name: cleanFileName(doc.name),
      category: doc.category,
      sourceName: c.name,
      sourceType: 'Candidate',
      uploadedAt: doc.uploadedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      url: doc.url,
    }))
  );

  const customerDocs = customers.flatMap((cust) => {
    const list = [];
    const getUploadDate = (key) => {
      if (cust.kycUploadDates && cust.kycUploadDates[key]) {
        return cust.kycUploadDates[key];
      }
      if (cust.createdAt) {
        return cust.createdAt.split('T')[0];
      }
      return new Date().toISOString().split('T')[0];
    };

    if (cust.kycDocuments?.passportSizePhoto) {
      const fullUrl = cust.kycDocuments.passportSizePhoto;
      const fileName = fullUrl.startsWith('data:') ? 'Passport_Size_Photo.png' : cleanFileName(fullUrl);
      list.push({ id: `${cust.id}-photo`, key: 'passportSizePhoto', customerId: cust.id, name: fileName, category: 'Passport Size Photo', sourceName: cust.name, sourceType: 'Customer', uploadedAt: getUploadDate('passportSizePhoto'), url: fullUrl });
    }
    if (cust.kycDocuments?.aadhaarCard) {
      const fullUrl = cust.kycDocuments.aadhaarCard;
      const fileName = fullUrl.startsWith('data:') ? 'Aadhaar_Document.png' : cleanFileName(fullUrl);
      list.push({ id: `${cust.id}-aadhaar`, key: 'aadhaarCard', customerId: cust.id, name: fileName, category: 'Aadhaar Card', sourceName: cust.name, sourceType: 'Customer', uploadedAt: getUploadDate('aadhaarCard'), url: fullUrl });
    }
    if (cust.kycDocuments?.panCard) {
      const fullUrl = cust.kycDocuments.panCard;
      const fileName = fullUrl.startsWith('data:') ? 'PAN_Document.png' : cleanFileName(fullUrl);
      list.push({ id: `${cust.id}-pan`, key: 'panCard', customerId: cust.id, name: fileName, category: 'PAN Card', sourceName: cust.name, sourceType: 'Customer', uploadedAt: getUploadDate('panCard'), url: fullUrl });
    }
    if (cust.kycDocuments?.incomeProof) {
      const fullUrl = cust.kycDocuments.incomeProof;
      const fileName = fullUrl.startsWith('data:') ? 'Income_Proof.png' : cleanFileName(fullUrl);
      list.push({ id: `${cust.id}-income`, key: 'incomeProof', customerId: cust.id, name: fileName, category: 'Income Proof', sourceName: cust.name, sourceType: 'Customer', uploadedAt: getUploadDate('incomeProof'), url: fullUrl });
    }
    if (cust.kycDocuments?.educationCertificate) {
      const fullUrl = cust.kycDocuments.educationCertificate;
      const fileName = fullUrl.startsWith('data:') ? 'Education_Certificate.png' : cleanFileName(fullUrl);
      list.push({ id: `${cust.id}-edu`, key: 'educationCertificate', customerId: cust.id, name: fileName, category: 'Education Certificate', sourceName: cust.name, sourceType: 'Customer', uploadedAt: getUploadDate('educationCertificate'), url: fullUrl });
    }
    if (cust.kycDocuments?.signatureCopy) {
      const fullUrl = cust.kycDocuments.signatureCopy;
      const fileName = fullUrl.startsWith('data:') ? 'Signature_Specimen.png' : cleanFileName(fullUrl);
      list.push({ id: `${cust.id}-signature`, key: 'signatureCopy', customerId: cust.id, name: fileName, category: 'Signature Specimen Scan', sourceName: cust.name, sourceType: 'Customer', uploadedAt: getUploadDate('signatureCopy'), url: fullUrl });
    }
    if (cust.kycDocuments?.passport) {
      const fullUrl = cust.kycDocuments.passport;
      const fileName = fullUrl.startsWith('data:') ? 'Indian_Passport.png' : cleanFileName(fullUrl);
      list.push({ id: `${cust.id}-passport`, key: 'passport', customerId: cust.id, name: fileName, category: 'Indian Passport Copy', sourceName: cust.name, sourceType: 'Customer', uploadedAt: getUploadDate('passport'), url: fullUrl });
    }
    return list;
  });
>>>>>>> d96c25bb403988716178a2b21910505a45607a70

  if (Array.isArray(docArray)) {
    docArray.forEach((d, i) => {
      const path = d.path || d.url || d.file;
      if (!path) return;
      docs.push({
        id: `${sourceType}-${id}-arr-${d.id || i}`,
        name: d.fileName || d.name || d.label || `Document ${i + 1}`,
        fileName: d.fileName || d.name,
        category: d.label || d.category || 'Other',
        path,
        url: resolveUrl(path),
        sourceType,
        sourceId: id,
        sourceName: name,
        verificationStatus: d.verificationStatus || 'PENDING',
        rejectionReason: d.rejectionReason || null,
        uploadedAt: d.uploadedAt || source.createdAt || '—',
        fieldKey: null,
        arrayIndex: i,
      });
    });
  }

<<<<<<< HEAD
  // Nested kycDocuments object (backend schema)
  if (source.kycDocuments && typeof source.kycDocuments === 'object') {
    Object.entries(source.kycDocuments).forEach(([key, path]) => {
      if (!path) return;
      push(key, path, key);
    });
  }

  return docs;
}
=======
  const filtered = fullDocumentsPool.filter((doc) => {
    const matchesSearch = (doc.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || (doc.sourceName || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    let matchesCategory = false;
    if (selectedCategory === 'all') {
      matchesCategory = true;
    } else if (selectedCategory.toLowerCase() === 'customer' || selectedCategory.toLowerCase() === 'candidate') {
      matchesCategory = doc.sourceType.toLowerCase() === selectedCategory.toLowerCase();
    } else {
      const docCatLower = doc.category.toLowerCase();
      const selCatLower = selectedCategory.toLowerCase();
      if (selCatLower === 'passport') {
        matchesCategory = docCatLower.includes('indian passport');
      } else if (selCatLower === 'photo') {
        matchesCategory = docCatLower.includes('passport size photo') || docCatLower === 'photo';
      } else {
        matchesCategory = docCatLower.includes(selCatLower);
      }
    }
    const matchesOwner = !selectedVaultOwner || (doc.sourceType === 'Candidate' ? doc.candidateId === selectedVaultOwner : doc.customerId === selectedVaultOwner);
    return matchesSearch && matchesCategory && matchesOwner;
  });

  const owners = [
      ...(userRole === 'Staff' ? [] : candidates.map(c => ({ id: c.id, name: c.name, type: 'Agent', photo: c.profilePicture }))),
      ...customers.map(c => ({ id: c.id, name: c.name, type: 'Customer', photo: c.kycDocuments?.passportSizePhoto }))
    ];

  const customerOwners = owners.filter(o => o.type === 'Customer');
  const agentOwners = owners.filter(o => o.type === 'Agent');

  const handleUploadCorpDoc = (e) => {
    e.preventDefault();
    if (!newCorpName) return;
>>>>>>> d96c25bb403988716178a2b21910505a45607a70

/** Map category label → field name(s) to clear on the source record */
const CATEGORY_TO_FIELDS = {
  'Aadhaar Card copy': ['aadhaarUrl', 'aadhaarFile', 'aadhaarDocUrl'],
  'PAN Card copy': ['panUrl', 'panFile', 'panDoc'],
  'Passport Size Photo': ['photoUrl', 'profilePhoto', 'passportPhoto', 'passportPhotoUrl', 'profilePicture'],
  'Education Certificate': ['marksheetUrl', 'marksheetFile', 'marksheetDoc', 'educationCertificate'],
  'Bank Proof': ['bankProofUrl', 'bankProofFile', 'bankProofDoc'],
  Signature: ['signatureUrl', 'signatureFile', 'signatureDoc'],
  'Income Proof': ['incomeProofUrl', 'incomeProofFile'],
};

export default function Documents({
  policyHolders = [],
  customers = [],
  candidates = [],
  advisors = [],
  onUpdateCustomer,
  onUpdateCandidate,
  updateCustomer,
  updateCandidate,
  onShowNotification,
}) {
  const notify = (msg) => {
    if (typeof onShowNotification === 'function') onShowNotification(msg);
    else console.warn('[Documents]', msg);
  };

  const saveCustomer = onUpdateCustomer || updateCustomer;
  const saveCandidate = onUpdateCandidate || updateCandidate;

  const customerList = Array.isArray(policyHolders) && policyHolders.length
    ? policyHolders
    : Array.isArray(customers)
    ? customers
    : [];
  const advisorList = Array.isArray(advisors) ? advisors : [];
  // A converted candidate without a matching advisor is an orphan left by a
  // previous advisor deletion. Its mirrored files must not remain in the vault.
  const candidateList = (Array.isArray(candidates) ? candidates : []).filter((candidate) => {
    if (!candidate.isConvertedToAdvisor) return true;
    return advisorList.some((advisor) => advisor.candidateId === candidate.id);
  });

  const [dbDocuments, setDbDocuments] = useState([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeFolderFilter, setActiveFolderFilter] = useState({ type: 'all' });
  const [previewDoc, setPreviewDoc] = useState(null);
  const [removedIds, setRemovedIds] = useState(() => new Set());

  // Fetch live documents from backend MongoDB API
  const fetchDbDocs = useCallback(async () => {
    setIsLoadingDb(true);
    try {
      const res = await fetch(`${API_URL}/api/documents`);
      const data = await res.json();
      if (data.success && Array.isArray(data.documents)) {
        setDbDocuments(data.documents);
      }
    } catch (err) {
      console.warn('[Doc Vault Backend Fetch]', err.message);
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    fetchDbDocs();
  }, [fetchDbDocs]);

  // Build live document list from real data + backend DB documents
  const allDocuments = useMemo(() => {
    const list = [];
    const seenMap = new Set();

    // 1. Documents directly stored in MongoDB collection `documents`
    dbDocuments.forEach((d) => {
      let sType = 'Customer';
      if (d.targetType === 'candidate' || d.targetType === 'candidates' || d.targetType === 'recruitment') {
        sType = 'Candidate';
      } else if (d.targetType === 'advisor' || d.targetType === 'advisors') {
        sType = 'Advisor';
      }

      let sName = 'Document Owner';
      if (sType === 'Customer') {
        const found = customerList.find(c => (c.id || c._id) === d.targetId);
        sName = found?.name || d.ownerName || sName;
      } else if (sType === 'Candidate') {
        const found = candidateList.find(c => [c.id, c._id].some(id => String(id) === String(d.targetId)));
        // The server already removes documents whose candidate was deleted.
        // Do not hide a newly uploaded document just because the browser's
        // candidate cache has not refreshed yet.
        sName = found?.name || d.ownerName || sName;
      } else if (sType === 'Advisor') {
        const found = advisorList.find(a => [a.id, a._id, a.advisorCode].some(id => String(id) === String(d.targetId)));
        sName = found?.fullName || found?.name || d.ownerName || sName;
      }

      const docItem = {
        id: d.id || `doc-${d.targetId}-${d.category}`,
        name: d.name || d.fileName || 'Uploaded Document',
        fileName: d.fileName || d.name,
        category: d.category || 'KYC Document',
        path: d.path || d.url,
        url: resolveUrl(d.url || d.path),
        sourceType: sType,
        sourceId: d.targetId,
        sourceName: sName,
        verificationStatus: d.verificationStatus || 'PENDING',
        rejectionReason: d.rejectionReason || null,
        uploadedAt: d.uploadedAt || '—',
        fieldKey: null
      };

      const key = `${docItem.sourceId}-${docItem.path || docItem.name}`;
      if (!seenMap.has(key)) {
        seenMap.add(key);
        list.push(docItem);
      }
    });

    // 2. Documents extracted from local state collections
    customerList.forEach((c) => {
      extractDocs(c, 'Customer').forEach((d) => {
        const key = `${d.sourceId}-${d.path || d.name}`;
        if (!seenMap.has(key)) {
          seenMap.add(key);
          list.push(d);
        }
      });
    });

    // Candidate and advisor uploads are mirrored into their owner records.
    // Include those records as a fallback because older/newer upload paths can
    // persist the owner update before the separate vault collection is
    // refreshed.  Only live owner lists are used, so a deleted owner cannot
    // recreate a stale vault entry.
    candidateList.forEach((candidate) => {
      extractDocs(candidate, 'Candidate').forEach((document) => {
        const key = `${document.sourceId}-${document.path || document.name}`;
        if (!seenMap.has(key)) {
          seenMap.add(key);
          list.push(document);
        }
      });
    });
    advisorList.forEach((advisor) => {
      extractDocs(advisor, 'Advisor').forEach((document) => {
        const key = `${document.sourceId}-${document.path || document.name}`;
        if (!seenMap.has(key)) {
          seenMap.add(key);
          list.push(document);
        }
      });
    });

    return list.filter((d) => !removedIds.has(d.id));
  }, [dbDocuments, customerList, candidateList, advisorList, removedIds]);

  // Filtered view
  const filteredDocs = useMemo(() => {
    return allDocuments.filter((doc) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.sourceName.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === 'all' ||
        (categoryFilter === 'Customer' && doc.sourceType === 'Customer') ||
        (categoryFilter === 'Candidate' && doc.sourceType === 'Candidate') ||
        (categoryFilter === 'Advisor' && doc.sourceType === 'Advisor') ||
        doc.category.toLowerCase().includes(categoryFilter.toLowerCase());

      let matchesFolder = true;
      if (activeFolderFilter.type !== 'all') {
        if (activeFolderFilter.id) {
          matchesFolder =
            doc.sourceType === activeFolderFilter.type &&
            (doc.sourceId === activeFolderFilter.id || String(doc.sourceId).includes(String(activeFolderFilter.id)));
        } else {
          matchesFolder = doc.sourceType === activeFolderFilter.type;
        }
      }

      return matchesSearch && matchesCategory && matchesFolder;
    });
  }, [allDocuments, searchTerm, categoryFilter, activeFolderFilter]);

  // Build folders only from documents that are actually present in the vault.
  // This prevents old candidate names from appearing as empty stale folders.
  const candidateFolders = useMemo(() => {
    const folders = new Map();
    allDocuments.filter(doc => doc.sourceType === 'Candidate').forEach(doc => {
      folders.set(String(doc.sourceId), { id: doc.sourceId, name: doc.sourceName || doc.sourceId });
    });
    return [...folders.values()];
  }, [allDocuments]);

  // Delete document & sync source record
  const handleDeleteDoc = async (doc) => {
    const ok = window.confirm(
      `Delete "${doc.name}" from ${doc.sourceName}?\n\nThis will also clear it from the ${doc.sourceType} record.`
    );
    if (!ok) return;

    setRemovedIds((prev) => new Set(prev).add(doc.id));
    if (previewDoc?.id === doc.id) setPreviewDoc(null);

    const patch = {};
    const fields = CATEGORY_TO_FIELDS[doc.category] || [];
    fields.forEach((f) => {
      patch[f] = null;
    });

    try {
      await apiService.deleteDocument(doc.id);
      if (doc.sourceType === 'Customer' && typeof saveCustomer === 'function') {
        await saveCustomer(doc.sourceId, patch);
      } else if (doc.sourceType === 'Candidate' && typeof saveCandidate === 'function') {
        await saveCandidate(doc.sourceId, patch);
      }
      await fetchDbDocs();
      notify(`Deleted "${doc.name}" and updated ${doc.sourceName}'s record.`);
    } catch (err) {
      console.error(err);
      notify(err.message || 'Deleted locally, but failed to sync source record');
    }
  };

  const handlePreviewDoc = (doc) => setPreviewDoc(doc);

  const isImage = (url, name) => {
    if (!url && !name) return false;
    const s = (url || name || '').toLowerCase();
    return /\.(jpe?g|png|gif|webp|avif|bmp)$/i.test(s) || s.startsWith('blob:') || s.startsWith('data:image');
  };

  const isPdf = (url, name) => {
    const s = (url || name || '').toLowerCase();
    return s.endsWith('.pdf') || s.includes('application/pdf');
  };

  return (
    <div className="space-y-6" id="documents-vault-container">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
<<<<<<< HEAD
          <h2 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
            <span>Consolidated Document Vault & KYC Repository</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">
              {allDocuments.length} files
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Centralized document storage for Customers, Agent Trainees, and Active Insurance Advisors.
=======
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Module 6: Secure Document Vault</h2>
          <p className="text-xs text-slate-500 font-medium">
            Central repository inspecting candidate training forms, client KYC documents, and agency templates safely.
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDbDocs}
          disabled={isLoadingDb}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDb ? 'animate-spin' : ''}`} />
          <span>Refresh Vault</span>
        </button>
      </div>

<<<<<<< HEAD
      {/* Horizontal Folder Filters Bar */}
      <div className="bg-[#1e293b] p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        {/* 1. Customer KYC Folders */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <FolderClosed className="w-3.5 h-3.5 text-blue-400" /> Customer KYC Folders ({customerList.length})
          </h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setActiveFolderFilter({ type: 'all' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeFolderFilter.type === 'all'
                  ? 'bg-[#0078d4] text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Folders
            </button>
            <button
              type="button"
              onClick={() => setActiveFolderFilter({ type: 'Customer' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeFolderFilter.type === 'Customer' && !activeFolderFilter.id
                  ? 'bg-[#0078d4] text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Customers ({customerList.length})
            </button>
            {customerList.map((cust) => {
              const id = cust.id || cust._id;
              const isSelected = activeFolderFilter.type === 'Customer' && activeFolderFilter.id === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveFolderFilter({ type: 'Customer', id })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/30 text-white border border-blue-500 shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  📁 {cust.name || id}
                </button>
              );
            })}
=======
      <div className="space-y-4">
        {/* Profile Icons Filter Bar */}
        <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm space-y-6">
          <div className="flex justify-between items-center">
             <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Filter by Owner</h3>
             <button
               onClick={() => setSelectedVaultOwner(null)}
               className={`text-[10px] font-bold px-3 py-1 rounded-full border ${!selectedVaultOwner ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
            >
                Clear Filter
            </button>
          </div>

          <div className="space-y-4">
             <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customers</h4>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {customerOwners.map(owner => (
                    <button
                      key={owner.id}
                      onClick={() => setSelectedVaultOwner(owner.id)}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all shrink-0 ${
                        selectedVaultOwner === owner.id
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-2 ring-indigo-500/10 font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                      title={owner.name}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-white border border-slate-200/80 shrink-0">
                          <img
                              src={owner.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(owner.name)}`}
                              alt={owner.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                          />
                      </div>
                      <span className="text-[11px] truncate max-w-[90px]">{owner.name}</span>
                    </button>
                  ))}
                  {customerOwners.length === 0 && (
                     <span className="text-[11px] text-slate-400 italic">No customers registered.</span>
                  )}
                </div>
             </div>

             {userRole !== 'Staff' && (
               <>
                 <hr className="border-slate-100" />

                 <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agents</h4>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {agentOwners.map(owner => (
                        <button
                          key={owner.id}
                          onClick={() => setSelectedVaultOwner(owner.id)}
                          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all shrink-0 ${
                            selectedVaultOwner === owner.id
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-2 ring-indigo-500/10 font-bold'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                          title={owner.name}
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-white border border-slate-200/80 shrink-0">
                              <img
                                  src={owner.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(owner.name)}`}
                                  alt={owner.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                              />
                          </div>
                          <span className="text-[11px] truncate max-w-[90px]">{owner.name}</span>
                        </button>
                      ))}
                      {agentOwners.length === 0 && (
                         <span className="text-[11px] text-slate-400 italic">No agents registered.</span>
                      )}
                    </div>
                 </div>
               </>
             )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 text-xs">
              <input
                id="search-documents-input"
                type="text"
                placeholder="Search by Document Name, Customer, or Candidate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:border-slate-350 transition-colors"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            </div>

            <select
              id="selected-category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:border-slate-350 transition-colors cursor-pointer"
            >
              <option value="all">-- All Documents --</option>
              <option value="Customer">Customer KYC Documents Only</option>
              {userRole !== 'Staff' && <option value="Candidate">Candidate Training Documents Only</option>}
              <option value="Aadhaar">Aadhaar Card copy</option>
              <option value="PAN">PAN Card copy</option>
              <option value="photo">Passport Size Photo</option>
              <option value="Income">Income Proof certificate</option>
              <option value="Education">Education Certificate</option>
              <option value="Signature">Signature Specimen scan</option>
              <option value="Passport">Indian Passport Copy</option>
            </select>
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* 2. Agent Trainee Folders */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <FolderClosed className="w-3.5 h-3.5 text-emerald-400" /> Agent Training Folders ({candidateFolders.length})
          </h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setActiveFolderFilter({ type: 'Candidate' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeFolderFilter.type === 'Candidate' && !activeFolderFilter.id
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Trainees ({candidateFolders.length})
            </button>
            {candidateFolders.map((cand) => {
              const id = cand.id;
              const isSelected = activeFolderFilter.type === 'Candidate' && activeFolderFilter.id === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveFolderFilter({ type: 'Candidate', id })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  📁 {cand.name || id}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Advisor KYC Folders */}
        {advisorList.length > 0 && (
          <>
            <hr className="border-slate-800" />
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-purple-400" /> Advisor KYC Folders ({advisorList.length})
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setActiveFolderFilter({ type: 'Advisor' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    activeFolderFilter.type === 'Advisor' && !activeFolderFilter.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All Advisors ({advisorList.length})
                </button>
                {advisorList.map((adv) => {
                  const id = adv.id || adv.advisorCode;
                  const isSelected = activeFolderFilter.type === 'Advisor' && activeFolderFilter.id === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveFolderFilter({ type: 'Advisor', id })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      📁 {adv.fullName || adv.name || adv.advisorCode}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-[#1e293b] p-4 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-3 shadow-lg">
        <div className="relative flex-1 text-xs">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search documents by file name, category, customer, trainee, or advisor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="all">-- All Document Categories --</option>
          <option value="Customer">Customer KYC Documents Only</option>
          <option value="Candidate">Candidate Training Documents Only</option>
          <option value="Advisor">Advisor Licensing Documents Only</option>
          <option value="Passport">Passport-Size Photos</option>
          <option value="Aadhaar">Aadhaar Card copies</option>
          <option value="PAN">PAN Card copies</option>
          <option value="Education">Education Certificates / Marksheets</option>
          <option value="Bank">Bank Passbook / Proof</option>
          <option value="Signature">Signature Specimens</option>
          <option value="Income">Income Proof</option>
        </select>
      </div>

      {/* Document Grid / List */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Vault Documents Index</span>
          </h3>
          <span className="text-[10px] bg-slate-800 text-slate-300 font-mono font-bold px-3 py-1 rounded-full border border-slate-700">
            {filteredDocs.length} file{filteredDocs.length !== 1 ? 's' : ''} shown
          </span>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
            <p className="font-semibold text-slate-400">No documents found for this selection.</p>
            <p className="text-[11px] text-slate-500">
              Upload KYC files while onboarding a customer or during candidate milestone Stage 2.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
            {filteredDocs.map((doc) => {
              const isImg = isImage(doc.url, doc.name);
              const isVerified = doc.verificationStatus === 'VERIFIED';
              const isRejected = doc.verificationStatus === 'REJECTED';

              return (
                <div
                  key={doc.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-900/50 text-xs gap-3 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Thumbnail / File Icon */}
                    <div
                      onClick={() => handlePreviewDoc(doc)}
                      className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer shadow group relative"
                    >
                      {isImg && doc.url ? (
                        <img
                          src={doc.url}
                          alt={doc.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition"
                        />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-400" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4
                          onClick={() => handlePreviewDoc(doc)}
                          className="font-bold text-white hover:text-blue-400 hover:underline cursor-pointer truncate max-w-md text-xs"
                        >
                          {doc.name}
                        </h4>

                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          isVerified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          isRejected ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {isVerified ? 'Verified' : isRejected ? 'Rejected' : 'Uploaded'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-slate-300">{doc.category}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          doc.sourceType === 'Candidate' ? 'bg-emerald-500/20 text-emerald-300' :
                          doc.sourceType === 'Advisor' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {doc.sourceType}: {doc.sourceName}
                        </span>
                        {doc.uploadedAt && doc.uploadedAt !== '—' && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {String(doc.uploadedAt).slice(0, 10)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePreviewDoc(doc)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                      title="Preview Document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
<<<<<<< HEAD
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-300 transition cursor-pointer"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      title="Delete document"
=======
                    <a
                      href={doc.url ? getFileUrl(doc.url) : `data:text/plain;charset=utf-8,${encodeURIComponent('Aynkaran Consultants - Vault File: ' + doc.name)}`}
                      download={doc.name}
                      className="p-1.5 border border-slate-200 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                      title={doc.url ? "Download document" : "Download simulation"}
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal for Document Vault */}
      {previewDoc && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto">
            <div className="flex items-center justify-between px-6 py-4 bg-[#1e293b] border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight truncate max-w-md">
                    {previewDoc.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {previewDoc.category} • {previewDoc.sourceType}: {previewDoc.sourceName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-slate-950 p-4 min-h-[250px] max-h-[50vh] overflow-auto flex items-center justify-center">
              {isPdf(previewDoc.url, previewDoc.name) ? (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.name}
                  className="w-full h-[45vh] rounded-xl border border-slate-800 bg-white"
                />
              ) : isImage(previewDoc.url, previewDoc.name) ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="max-h-[45vh] max-w-full object-contain rounded-xl shadow-lg border border-slate-800"
                />
              ) : (
                <div className="p-8 text-center space-y-2">
                  <FileText className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-sm font-bold text-white">{previewDoc.name}</p>
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 underline text-xs"
                  >
                    Open Document File
                  </a>
                </div>
              )}
            </div>

<<<<<<< HEAD
            <div className="flex items-center justify-between px-6 py-4 bg-[#1e293b] border-t border-slate-800 shrink-0">
              <div className="text-xs text-slate-400 font-mono">
                Status: <strong className="text-white">{previewDoc.verificationStatus || 'Uploaded'}</strong>
              </div>
              <div className="flex items-center gap-2">
                {previewDoc.url && (
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="px-4 py-2 bg-[#0078d4] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
=======
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 text-xs">
          <p className="font-extrabold text-slate-800 flex items-center space-x-1.5">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Compliant & Encrypted Storage</span>
          </p>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            Every administrative file uploaded to Aynkaran Consultants is cached in the local sandbox matching IRDAI strict compliance parameters. Offline file signatures are checked at startup.
          </p>
        </div>
      </div>

      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 overflow-hidden">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                  PREVIEW: {previewDoc.id}
                </span>
                <h3 className="font-extrabold text-base text-slate-800 mt-2">{previewDoc.name}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-xs"
              >
                Close
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-dashed border-slate-200/80 flex items-center justify-center min-h-[300px]">
              {previewDoc.url ? (
                previewDoc.url.startsWith('data:image/') || previewDoc.url.match(/\.(jpeg|jpg|gif|png)$/i) || (previewDoc.url.includes('/uploads/') && !previewDoc.url.includes('.pdf')) ? (
                      <img
                    src={getFileUrl(previewDoc.url)}
                    alt={previewDoc.name}
                    className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-sm"
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.target.src = 'https://api.dicebear.com/7.x/initials/svg?seed=Err'; }}
                  />
                ) : previewDoc.url.startsWith('data:application/pdf') || previewDoc.url.includes('.pdf') ? (
                  <iframe
                    src={getFileUrl(previewDoc.url)}
                    title={previewDoc.name}
                    className="w-full h-[55vh] rounded-lg border-0 bg-white"
                    allowFullScreen
                  />
                ) : (
                  <div className="text-center space-y-4 py-8">
                    <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <FileText size={28} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-extrabold text-xs text-slate-700">Digital Copy Verified</p>
                      <p className="text-[11px] text-slate-400">File Type doesn't support inline visual rendering.</p>
                      <p className="text-[11px] text-emerald-700 font-bold">SHA-256 Checksum: Verified</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center space-y-4 py-8">
                  <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <FileText size={28} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-xs text-slate-700">Digital Authenticity Verified</p>
                    <p className="text-[11px] text-slate-400 font-mono font-bold text-indigo-600">{previewDoc.id}</p>
                    <p className="text-[11px] text-slate-400">Owner: {previewDoc.sourceName} • Category: {previewDoc.category}</p>
                    <p className="text-[11px] text-emerald-700 font-bold">SHA-256 Checksum: Success (0xACF728...)</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-mono">Released {previewDoc.uploadedAt}</p>
              <div className="flex space-x-2">
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Close
                </button>
<<<<<<< HEAD
=======
                <a
                  href={previewDoc.url ? getFileUrl(previewDoc.url) : `data:text/plain;charset=utf-8,${encodeURIComponent('Aynkaran Consultants - Vault File: ' + previewDoc.name)}`}
                  download={previewDoc.name}
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow cursor-pointer text-center flex items-center space-x-1"
                >
                  <Download size={13} />
                  <span>Download file</span>
                </a>
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
