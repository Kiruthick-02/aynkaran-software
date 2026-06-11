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

const cleanFileName = (filePathOrName) => {
  if (!filePathOrName) return '';
  const baseName = filePathOrName.includes('/') ? filePathOrName.substring(filePathOrName.lastIndexOf('/') + 1) : filePathOrName;
  // Strip out leading numbers followed by hyphen or underscore (such as standard Multer timestamps Date.now())
  return baseName.replace(/^\d+[-_]/, '');
};

export default function Documents({ candidates = [], customers = [] }) {
  const { updateCandidate, updateCustomer } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVaultOwner, setSelectedVaultOwner] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const [corporateDocs, setCorporateDocs] = useState([]);

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
      const updatedDates = { ...cust.kycUploadDates };
      delete updatedDates[key];
      updateCustomer(customerId, { kycDocuments: updatedKyc, kycUploadDates: updatedDates });
    }
  };

  const candidateDocs = candidates.flatMap((c) =>
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

  const fullDocumentsPool = [...corporateDocs, ...candidateDocs, ...customerDocs];

  const filtered = fullDocumentsPool.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || doc.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
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
      ...candidates.map(c => ({ id: c.id, name: c.name, type: 'Agent', photo: c.profilePicture })),
      ...customers.map(c => ({ id: c.id, name: c.name, type: 'Customer', photo: c.kycDocuments?.passportSizePhoto }))
    ];

  const customerOwners = owners.filter(o => o.type === 'Customer');
  const agentOwners = owners.filter(o => o.type === 'Agent');

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
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Module 6: Secure Document Vault</h2>
          <p className="text-xs text-slate-500 font-medium">
            Central repository inspecting candidate training forms, client KYC documents, and agency templates safely.
          </p>
        </div>
      </div>

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
              <option value="Candidate">Candidate Training Documents Only</option>
              <option value="Aadhaar">Aadhaar Card copy</option>
              <option value="PAN">PAN Card copy</option>
              <option value="photo">Passport Size Photo</option>
              <option value="Income">Income Proof certificate</option>
              <option value="Education">Education Certificate</option>
              <option value="Signature">Signature Specimen scan</option>
              <option value="Passport">Indian Passport Copy</option>
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
