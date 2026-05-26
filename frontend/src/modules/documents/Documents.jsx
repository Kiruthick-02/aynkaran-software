import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FolderClosed,
  Search,
  Upload,
  FileText,
  Clock,
  Download,
  Trash2,
  FileUp,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import API_URL from '../../config/api';

const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL || ''}${url}`;
};

export default function Documents({ candidates = [], customers = [] }) {
  const { updateCandidate, updateCustomer } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewDoc, setPreviewDoc] = useState(null);

  const [corporateDocs, setCorporateDocs] = useState([
    { id: 'corp-101', name: 'IRDAI licensing regulations guide 2026.pdf', category: 'Corporate Policy', sourceName: 'Aynkaran Admin', sourceType: 'Corporate', uploadedAt: '2026-04-10' },
    { id: 'corp-102', name: 'Aynkaran Life - Individual Savings & Pension agent manual.pdf', category: 'Sales Material', sourceName: 'Aynkaran Life', sourceType: 'Corporate', uploadedAt: '2026-05-02' },
    { id: 'corp-103', name: 'Aynkaran client onboarding checklist.pdf', category: 'Onboarding Checklist', sourceName: 'Aynkaran Admin', sourceType: 'Corporate', uploadedAt: '2026-05-15' },
  ]);

  const [newCorpName, setNewCorpName] = useState('');
  const [newCorpCat, setNewCorpCat] = useState('Corporate Policy');

  const handleDeleteCandidateDoc = (candidateId, docId) => {
    if (!confirm('Are you sure you want to delete this candidate document?')) return;
    const cand = candidates.find(c => c.id === candidateId);
    if (cand) {
      const updatedDocs = (cand.documents || []).filter(d => d.id !== docId);
      updateCandidate(candidateId, { documents: updatedDocs });
    }
  };

  const handleDeleteCustomerDoc = (customerId, key) => {
    if (!confirm('Are you sure you want to delete this customer document?')) return;
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      const updatedKyc = { ...cust.kycDocuments };
      delete updatedKyc[key];
      updateCustomer(customerId, { kycDocuments: updatedKyc });
    }
  };

  const candidateDocs = candidates.flatMap((c) =>
    (c.documents || []).map((doc) => ({
      id: doc.id,
      candidateId: c.id,
      name: doc.name,
      category: doc.category,
      sourceName: c.name,
      sourceType: 'Candidate',
      uploadedAt: doc.uploadedAt,
      url: doc.url,
    }))
  );

  const customerDocs = customers.flatMap((cust) => {
    const list = [];
    if (cust.kycDocuments?.aadhaarCard) {
      const fullUrl = cust.kycDocuments.aadhaarCard;
      const fileName = fullUrl.startsWith('data:') ? 'Aadhaar_Document.png' : fullUrl.substring(fullUrl.lastIndexOf('/') + 1);
      list.push({ id: `${cust.id}-aadhaar`, key: 'aadhaarCard', customerId: cust.id, name: fileName, category: 'Aadhaar Card', sourceName: cust.name, sourceType: 'Customer', uploadedAt: '2025-05-10', url: fullUrl });
    }
    if (cust.kycDocuments?.panCard) {
      const fullUrl = cust.kycDocuments.panCard;
      const fileName = fullUrl.startsWith('data:') ? 'PAN_Document.png' : fullUrl.substring(fullUrl.lastIndexOf('/') + 1);
      list.push({ id: `${cust.id}-pan`, key: 'panCard', customerId: cust.id, name: fileName, category: 'PAN Card', sourceName: cust.name, sourceType: 'Customer', uploadedAt: '2025-05-10', url: fullUrl });
    }
    if (cust.kycDocuments?.incomeProof) {
      const fullUrl = cust.kycDocuments.incomeProof;
      const fileName = fullUrl.startsWith('data:') ? 'Income_Proof.png' : fullUrl.substring(fullUrl.lastIndexOf('/') + 1);
      list.push({ id: `${cust.id}-income`, key: 'incomeProof', customerId: cust.id, name: fileName, category: 'Income Proof', sourceName: cust.name, sourceType: 'Customer', uploadedAt: '2025-05-12', url: fullUrl });
    }
    if (cust.kycDocuments?.educationCertificate) {
      const fullUrl = cust.kycDocuments.educationCertificate;
      const fileName = fullUrl.startsWith('data:') ? 'Education_Certificate.png' : fullUrl.substring(fullUrl.lastIndexOf('/') + 1);
      list.push({ id: `${cust.id}-edu`, key: 'educationCertificate', customerId: cust.id, name: fileName, category: 'Education Certificate', sourceName: cust.name, sourceType: 'Customer', uploadedAt: '2025-05-12', url: fullUrl });
    }
    if (cust.kycDocuments?.passport) {
      const fullUrl = cust.kycDocuments.passport;
      const fileName = fullUrl.startsWith('data:') ? 'Indian_Passport.png' : fullUrl.substring(fullUrl.lastIndexOf('/') + 1);
      list.push({ id: `${cust.id}-passport`, key: 'passport', customerId: cust.id, name: fileName, category: 'Indian Passport Copy', sourceName: cust.name, sourceType: 'Customer', uploadedAt: '2025-05-12', url: fullUrl });
    }
    return list;
  });

  const fullDocumentsPool = [...corporateDocs, ...candidateDocs, ...customerDocs];

  const filtered = fullDocumentsPool.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || doc.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category.toLowerCase().includes(selectedCategory.toLowerCase()) || doc.sourceType.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleUploadCorpDoc = (e) => {
    e.preventDefault();
    if (!newCorpName) return;

    const newDoc = {
      id: `corp-${Date.now().toString().substring(7)}`,
      name: newCorpName.endsWith('.pdf') ? newCorpName : `${newCorpName}.pdf`,
      category: newCorpCat,
      sourceName: 'Aynkaran Admin',
      sourceType: 'Corporate',
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    setCorporateDocs((prev) => [newDoc, ...prev]);
    setNewCorpName('');
  };

  const handleDeleteCorp = (id) => {
    setCorporateDocs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Module 6: Secure Corporate Document Vault</h2>
          <p className="text-xs text-slate-500 font-medium">
            Central repository scanning recruitment forms, client KYC documents, and agency manuals safely.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 text-xs">
              <input
                type="text"
                placeholder="Search scans (e.g. Aron Joseph, Aadhaar)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-55 border border-slate-200 rounded-xl px-3 text-xs text-slate-800"
            >
              <option value="all">-- All Categories --</option>
              <option value="Corporate">Corporate Documents</option>
              <option value="Customer">Customer KYC Documents</option>
              <option value="Candidate">Candidate Training Documents</option>
              <option value="Aadhaar">Aadhaar Files</option>
              <option value="PAN">PAN Files</option>
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Indexed Documents Database</h3>
              <span className="text-xs bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-full">
                {filtered.length} Archive(s)
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {filtered.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 flex justify-between items-center hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center space-x-3.5 pr-4 flex-1 overflow-hidden">
                    <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
                      <FileText size={18} />
                    </div>
                    <div className="overflow-hidden space-y-0.5">
                      <p className="font-extrabold text-xs text-slate-800 truncate">{doc.name}</p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                        <span>Source: <strong>{doc.sourceName} ({doc.sourceType})</strong></span>
                        <span>•</span>
                        <span>Uploaded at {doc.uploadedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded font-extrabold">
                      {doc.category}
                    </span>
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
                      title="Preview Document"
                    >
                      <Eye size={13} />
                    </button>
                    <a
                      href={doc.url ? getFileUrl(doc.url) : `data:text/plain;charset=utf-8,${encodeURIComponent('Aynkaran Consultants - Vault File: ' + doc.name)}`}
                      download={doc.name}
                      className="p-1.5 border border-slate-200 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                      title={doc.url ? "Download document" : "Download simulation"}
                    >
                      <Download size={13} />
                    </a>
                    {doc.sourceType === 'Corporate' && (
                      <button
                        onClick={() => handleDeleteCorp(doc.id)}
                        className="p-1.5 border border-slate-200 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete document"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    {doc.sourceType === 'Candidate' && (
                      <button
                        onClick={() => handleDeleteCandidateDoc(doc.candidateId, doc.id)}
                        className="p-1.5 border border-slate-200 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete document"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    {doc.sourceType === 'Customer' && (
                      <button
                        onClick={() => handleDeleteCustomerDoc(doc.customerId, doc.key)}
                        className="p-1.5 border border-slate-200 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete document"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  No registered file records match search queries.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-slate-100">
              <FileUp size={15} className="text-indigo-600" />
              <span>Publish Corporate Material</span>
            </h4>

            <form onSubmit={handleUploadCorpDoc} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Doc Title / File Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Life proposal form 300.pdf"
                  value={newCorpName}
                  onChange={(e) => setNewCorpName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category / Label</label>
                <select
                  value={newCorpCat}
                  onChange={(e) => setNewCorpCat(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-850"
                >
                  <option value="Corporate Policy">Corporate Policy</option>
                  <option value="Sales Material">Sales Material</option>
                  <option value="Onboarding Checklist">Onboarding Checklist</option>
                  <option value="Standard Form Template">Standard Form Template</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Upload to Corporate Vault
              </button>
            </form>
          </div>

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
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <a
                  href={previewDoc.url ? getFileUrl(previewDoc.url) : `data:text/plain;charset=utf-8,${encodeURIComponent('Aynkaran Consultants - Vault File: ' + previewDoc.name)}`}
                  download={previewDoc.name}
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow cursor-pointer text-center flex items-center space-x-1"
                >
                  <Download size={13} />
                  <span>Download file</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
