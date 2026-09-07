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
import { apiService } from '../../services/api';
import API_URL, { resolveApiUrl } from '../../config/api';

/** Build absolute URL for a stored path / blob / http link */
function resolveUrl(path) {
  if (!path) return null;
  return resolveApiUrl(path);
}

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

  // Nested kycDocuments object (backend schema)
  if (source.kycDocuments && typeof source.kycDocuments === 'object') {
    Object.entries(source.kycDocuments).forEach(([key, path]) => {
      if (!path) return;
      push(key, path, key);
    });
  }

  return docs;
}

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
          <h2 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
            <span>Consolidated Document Vault & KYC Repository</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">
              {allDocuments.length} files
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Centralized document storage for Customers, Agent Trainees, and Active Insurance Advisors.
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
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
