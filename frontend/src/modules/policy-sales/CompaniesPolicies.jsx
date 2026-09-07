// frontend/src/modules/policy-sales/CompaniesPolicies.jsx
import React, { useState , useEffect } from 'react';
import { Plus, X, Building2, ShieldCheck, User, MapPin, Sparkles, Check, HelpCircle, Calendar, Upload, Edit, Trash2 } from 'lucide-react';
import { companyApi } from '../../services/companyApi'; 
import { apiService } from '../../services/api';

import { createPortal } from 'react-dom';

function DocumentPreviewModal({ open, onClose, title, href, fileName }) {
  if (!open || !href) return null;
  const lower = String(fileName || href).toLowerCase();
  const isPdf = /\.pdf$/i.test(lower);
  const isImage = /\.(png|jpe?g|gif|webp|avif|bmp)$/i.test(lower);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#1e293b] border border-slate-700 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
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
          {(isPdf || !isImage) && (
            <iframe src={href} title="doc" className="w-full h-[70vh] rounded-lg bg-white" />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function DocUploadZone({
  label,
  hint,
  file,
  setFile,
  existing,
  onClearExisting,
  apiUrl,
}) {
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [viewOpen, setViewOpen] = useState(false);

  const hasExisting = !!(existing?.path && !file);
  const API = apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:7860';
  

  const href =
    existing?.path &&
    (String(existing.path).startsWith('http') ||
    String(existing.path).startsWith('blob:')
      ? existing.path
      : `${API}${existing.path.startsWith('/') ? existing.path : `/${existing.path}`}`);

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
      <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">
        {label}
      </label>

      {hasExisting ? (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-3 flex items-center justify-between gap-2 min-h-[88px]">
          <div className="min-w-0">
            <p className="text-[10px] text-emerald-400 font-bold uppercase">Uploaded</p>
            <p className="text-xs text-white truncate">{existing.fileName || 'Document on file'}</p>
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
        <label className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-600 bg-slate-900/50 px-3 py-6 cursor-pointer hover:border-blue-500/50 min-h-[88px]">
          <span className="text-slate-500 text-lg">↑</span>
          <span className="text-[11px] text-slate-400 text-center">
            {file ? file.name : hint || 'Click to choose file'}
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
        fileName={existing?.fileName}
      />
    </div>
  );
}

function InsuranceTypeChips({ types, selected, onChange }) {
  const toggle = (name) => {
    if (selected.includes(name)) {
      onChange(selected.filter((x) => x !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {(types || []).map((t) => {
        const name = t.name || t;
        const active = selected.includes(name);
        return (
          <button
            key={t._id || name}
            type="button"
            onClick={() => toggle(name)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
              active
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-blue-500/50'
            }`}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}

/** Ordered bullet points: add / remove / move up / down */
function PointsEditor({ label, points, setPoints, placeholder = 'Enter a point…' }) {
  const add = () =>
    setPoints((prev) => [
      ...prev,
      { id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: '' },
    ]);

  const update = (id, text) =>
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, text } : p)));

  const remove = (id) => setPoints((prev) => prev.filter((p) => p.id !== id));

  const move = (index, dir) => {
    setPoints((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  /** Wrap selected text in ** for bold (stored as markdown) */
  const boldSelection = (id, inputEl) => {
    if (!inputEl) return;
    const start = inputEl.selectionStart ?? 0;
    const end = inputEl.selectionEnd ?? 0;
    if (start === end) {
      onShowNotification?.('Select words first, then click Bold');
      return;
    }
    const val = inputEl.value;
    const next = val.slice(0, start) + '**' + val.slice(start, end) + '**' + val.slice(end);
    update(id, next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">
          {label}
        </label>
        <button
          type="button"
          onClick={add}
          className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
        >
          + Add point
        </button>
      </div>
      {points.length === 0 && (
        <p className="text-[11px] text-slate-500">No points yet. Click + Add point.</p>
      )}
      <div className="space-y-2">
        {points.map((p, index) => (
          <div key={p.id} className="flex gap-1.5 items-start">
            <span className="text-[10px] text-slate-500 font-mono w-5 pt-2">{index + 1}.</span>
            <input
              id={`point-input-${p.id}`}
              type="text"
              value={p.text}
              onChange={(e) => update(p.id, e.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
            />
            <button
              type="button"
              title="Bold selected text"
              onClick={() =>
                boldSelection(p.id, document.getElementById(`point-input-${p.id}`))
              }
              className="px-2 py-1.5 rounded bg-slate-800 text-slate-200 text-[10px] font-bold border border-slate-600"
            >
              B
            </button>
            <button
              type="button"
              disabled={index === 0}
              onClick={() => move(index, -1)}
              className="px-1.5 py-1.5 rounded bg-slate-800 text-slate-300 text-[10px] disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={index === points.length - 1}
              onClick={() => move(index, 1)}
              className="px-1.5 py-1.5 rounded bg-slate-800 text-slate-300 text-[10px] disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => remove(p.id)}
              className="px-1.5 py-1.5 rounded bg-rose-600/20 text-rose-300 text-[10px]"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-slate-500">
        Select words → Bold (B). Order here is the order on the website.
      </p>
    </div>
  );
}

/** Render markdown-lite **bold** for website/desktop preview */
export function renderPointText(text) {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-800">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function CompaniesPoliciesModule({
  policies,
  addPolicy,
  updatePolicy,
  deletePolicy,
  customers,
  policyHolders,
  onAddCustomer,
  onUpdateCustomer,
  onShowNotification,
}) 
{
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7860';
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewState, setViewState] = useState('companies');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedPolicyId, setSelectedPolicyId] = useState('');

  // Modals
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [showEditPolicyModal, setShowEditPolicyModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);

  // Edit Company
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editCompanyContact, setEditCompanyContact] = useState('');
  const [editCompanyIrda, setEditCompanyIrda] = useState('');
  const [editCompanyType, setEditCompanyType] = useState('Life Insurance');
  const [editCompanyAddress, setEditCompanyAddress] = useState('');
  const [editCompanyStatus, setEditCompanyStatus] = useState('Active');
  const [editCompanyStopStart, setEditCompanyStopStart] = useState('');
  const [editCompanyStopEnd, setEditCompanyStopEnd] = useState('');
  const [editCompanyStopReason, setEditCompanyStopReason] = useState('');

  // Edit Policy
  const [editingPolicyId, setEditingPolicyId] = useState(null);
  const [editPolicyName, setEditPolicyName] = useState('');

  const [editCompanyLogo, setEditCompanyLogo] = useState(null);       // existing path from DB
const [editCompanyBg, setEditCompanyBg] = useState(null);
const [editCompanyLogoFile, setEditCompanyLogoFile] = useState(null);
const [editCompanyBgFile, setEditCompanyBgFile] = useState(null);
const [editCompanyLogoPreview, setEditCompanyLogoPreview] = useState('');
const [editCompanyBgPreview, setEditCompanyBgPreview] = useState('');
const [editCompanyInsuranceTypes, setEditCompanyInsuranceTypes] = useState([]);
const [editWebsiteVisibility, setEditWebsiteVisibility] = useState('show');

const [newPolicyKeyFeatures, setNewPolicyKeyFeatures] = useState([]);
const [newPolicyEligibility, setNewPolicyEligibility] = useState([]);
const [editPolicyKeyFeatures, setEditPolicyKeyFeatures] = useState([]);
const [editPolicyEligibility, setEditPolicyEligibility] = useState([]);

  // New Company
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyContact, setNewCompanyContact] = useState('');
  const [newCompanyIrda, setNewCompanyIrda] = useState('');
  const [newCompanyType, setNewCompanyType] = useState('Life Insurance');
  const [newCompanyAddress, setNewCompanyAddress] = useState('');
  const [newCompanyStatus, setNewCompanyStatus] = useState('Active');
  const [newCompanyStopStart, setNewCompanyStopStart] = useState('');
  const [newCompanyStopEnd, setNewCompanyStopEnd] = useState('');
  const [newCompanyStopReason, setNewCompanyStopReason] = useState('');
  const [insuranceTypesList, setInsuranceTypesList] = useState([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [showAddType, setShowAddType] = useState(false);
  const [newCompanyDescriptionPoints, setNewCompanyDescriptionPoints] = useState([]);
const [editCompanyDescriptionPoints, setEditCompanyDescriptionPoints] = useState([]);

  // Company form
  const [newCompanyLogo, setNewCompanyLogo] = useState(null);          // File
  const [newCompanyBg, setNewCompanyBg] = useState(null);              // File
  const [newCompanyLogoPreview, setNewCompanyLogoPreview] = useState('');
  const [newCompanyBgPreview, setNewCompanyBgPreview] = useState('');
  const [newCompanyInsuranceTypes, setNewCompanyInsuranceTypes] = useState(['Life Insurance']);
  const [newWebsiteVisibility, setNewWebsiteVisibility] = useState('show'); // show | hide

  // Stop Control
  const [stopCompanyId, setStopCompanyId] = useState(null);
  const [stopStatus, setStopStatus] = useState('Active');
  const [stopStartDateVal, setStopStartDateVal] = useState('');
  const [stopEndDateVal, setStopEndDateVal] = useState('');
  const [stopReasonVal, setStopReasonVal] = useState('');
  const [stopWebsiteVisibility, setStopWebsiteVisibility] = useState('show'); // ← ADD THIS

  // New Policy
  const [newPolicyName, setNewPolicyName] = useState('');
const [newPolicyBrochureFile, setNewPolicyBrochureFile] = useState(null);

const [editPolicyBrochureFile, setEditPolicyBrochureFile] = useState(null);
const [editPolicyBrochurePath, setEditPolicyBrochurePath] = useState(null);
const [editPolicyBrochureName, setEditPolicyBrochureName] = useState('');
const [editPolicyBrochureCleared, setEditPolicyBrochureCleared] = useState(false);

  // Customer form (unchanged logic)
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custDob, setCustDob] = useState('1990-01-01');
  const [custGender, setCustGender] = useState('Male');
  const [custOccupation, setCustOccupation] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custSpouseName, setCustSpouseName] = useState('');
  const [custAssignedAgent, setCustAssignedAgent] = useState('__DIRECT__');
  const [custFatherName, setCustFatherName] = useState('');
  const [custMotherName, setCustMotherName] = useState('');
  const [custBloodGroup, setCustBloodGroup] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeDob, setNomineeDob] = useState('2015-01-01');
  const [nomineeRelationship, setNomineeRelationship] = useState('');
  const [nomineeEmail, setNomineeEmail] = useState('');
const [incomeProofFile, setIncomeProofFile] = useState(null);
const [incomeProofFileName, setIncomeProofFileName] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [aadhaarFileName, setAadhaarFileName] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [panFileName, setPanFileName] = useState('');
  const [marksheetFileName, setMarksheetFileName] = useState('');
  const [bankProofFileName, setBankProofFileName] = useState('');
  const [signatureFileName, setSignatureFileName] = useState('');
  // Optional 2nd phones + nominee mobile
const [custMobile2, setCustMobile2] = useState('');
const [nomineeMobile, setNomineeMobile] = useState('');
const [nomineeMobile2, setNomineeMobile2] = useState('');
const [aadhaarFile, setAadhaarFile] = useState(null);
const [photoFile, setPhotoFile] = useState(null);
const [panFile, setPanFile] = useState(null);
const [marksheetFile, setMarksheetFile] = useState(null);
const [bankProofFile, setBankProofFile] = useState(null);
const [signatureFile, setSignatureFile] = useState(null);

const [editingCustomerId, setEditingCustomerId] = useState(null);

  
// Active agents from recruitment (no mock list)
const [activeAgents, setActiveAgents] = useState([]);

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const onlyDigits = (v) => String(v || '').replace(/\D/g, '');
const isValidSecureEmail = (email) => {
  const v = String(email || '').trim();
  if (!v) return true; // optional field → empty OK

  // exactly one @
  const at = v.indexOf('@');
  if (at <= 0 || at !== v.lastIndexOf('@')) return false;

  const local = v.slice(0, at);
  const domain = v.slice(at + 1);

  if (!local || !domain) return false;

  // at least one dot in domain
  if (!domain.includes('.')) return false;

  // allowed chars
  if (!/^[A-Za-z0-9._+-]+$/.test(local)) return false;
  if (!/^[A-Za-z0-9.-]+$/.test(domain)) return false;

  // no consecutive symbols in local (.. __ -- ++ and mixed pairs)
  if (/[._+-]{2,}/.test(local)) return false;
  // no consecutive .. or -- in domain
  if (/\.\.|--/.test(domain)) return false;

  // symbols cannot be first/last of full email
  if (/^[._+-]/.test(v) || /[._+-]$/.test(v)) return false;

  // local cannot start/end with symbol
  if (/^[._+-]/.test(local) || /[._+-]$/.test(local)) return false;

  // domain cannot start/end with . or -
  if (/^[.-]/.test(domain) || /[.-]$/.test(domain)) return false;

  // domain labels (each part between dots) non-empty
  const labels = domain.split('.');
  if (labels.some((l) => !l || l.startsWith('-') || l.endsWith('-'))) return false;

  return true;
};

// Existing saved documents (edit mode) — show name, don't force re-upload
const [existingDocs, setExistingDocs] = useState({
  aadhaar: null,      // { path, fileName }
  photo: null,
  pan: null,
  marksheet: null,
  bankProof: null,
  signature: null,
  incomeProof: null,
});

const clearExistingDocs = () => {
  setExistingDocs({
    aadhaar: null,
    photo: null,
    pan: null,
    marksheet: null,
    bankProof: null,
    signature: null,
    incomeProof: null,
  });
};

  // ---------- Load from backend ----------
  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyApi.getAll();
      const normalised = (data || []).map((c) => ({
        ...c,
        id: c._id || c.id,
        irdaRegistration: c.registrationCode || c.irdaReg || c.irdaRegistration || 'N/A',
        policies: c.policies || [],
      }));
      setCompanies(normalised);
      if (normalised.length && !selectedCompanyId) {
        setSelectedCompanyId(normalised[0].id);
      }
    } catch (err) {
      onShowNotification?.(`Failed to load companies: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  loadCompanies();
}, []);

// ADD THIS
useEffect(() => {
  companyApi
    .getInsuranceTypes()
    .then((types) => setInsuranceTypesList(types || []))
    .catch((err) => {
      console.error('Failed to load insurance types', err);
      // fallback so UI is not empty
      setInsuranceTypesList([
        { name: 'Life Insurance', isDefault: true },
        { name: 'Health Insurance', isDefault: true },
        { name: 'General Insurance', isDefault: true },
      ]);
    });
}, []);

useEffect(() => {
  const loadAgents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/candidates`);
      if (!res.ok) throw new Error('Failed to load agents');
      const rows = await res.json();

      // Licensed / code-generated agents only
      const agents = (rows || [])
        .filter((c) => c.exam?.agentCodeGenerated)
        .map((c) => ({
          id: c.id || c._id,
          name: c.name || 'Agent',
          code: c.exam.agentCodeGenerated,
          label: `${c.name} (${c.exam.agentCodeGenerated})`,
        }));

      setActiveAgents(agents);
    } catch (err) {
      console.error('Active agents load failed', err);
      setActiveAgents([]);
    }
  };
  loadAgents();
}, [API_URL]);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];
  const selectedPolicy = selectedCompany?.policies?.find((p) => p.id === selectedPolicyId);

  // ---------- Company CRUD ----------
  const handleSaveCompany = async (e) => {
  e.preventDefault();

  const name = newCompanyName.trim();
  if (!name) {
    onShowNotification('Company name is required');
    return;
  }

  const nameExists = companies.some(
    (c) => c.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (nameExists) {
    onShowNotification(
      `Duplicate company name. "${name}" already exists. Please use a different name.`
    );
    return;
  }

  if (!newCompanyContact || !/^\d{10,15}$/.test(newCompanyContact)) {
    onShowNotification('Contact number is required (10–15 digits)');
    return;
  }

  if (!newCompanyAddress.trim()) {
    onShowNotification('Head office location is required');
    return;
  }

  if (newCompanyInsuranceTypes.length === 0) {
    onShowNotification('Select at least one insurance type');
    return;
  }

  if (!newCompanyLogo) {
    onShowNotification('Company logo is required');
    return;
  }

  const descPoints = (newCompanyDescriptionPoints || [])
    .filter((p) => String(p.text || '').trim())
    .map((p, i) => ({ text: String(p.text).trim(), order: i }));

  if (descPoints.length === 0) {
    onShowNotification('Add at least one description point');
    return;
  }

  if (newCompanyStatus === 'Temporarily Stopped') {
    if (!newCompanyStopStart || !newCompanyStopEnd || !newCompanyStopReason.trim()) {
      onShowNotification('Pause dates and reason are required when status is Paused');
      return;
    }
  }

  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('registrationCode', 'N/A'); // IRDAI field removed from form
    formData.append('type', newCompanyInsuranceTypes[0]);
    formData.append('insuranceTypes', JSON.stringify(newCompanyInsuranceTypes));
    formData.append('address', newCompanyAddress.trim());
    formData.append('contact', newCompanyContact.trim());
    formData.append('status', newCompanyStatus);
    formData.append(
      'websiteVisibility',
      newCompanyStatus === 'Active' ? 'show' : newWebsiteVisibility
    );
    formData.append(
      'consultationEnabled',
      newCompanyStatus === 'Active' ? 'true' : 'false'
    );
    formData.append('descriptionPoints', JSON.stringify(descPoints));

    if (newCompanyStatus === 'Temporarily Stopped') {
      formData.append('stopStartDate', newCompanyStopStart);
      formData.append('stopEndDate', newCompanyStopEnd);
      formData.append('stopReason', newCompanyStopReason.trim());
    }

    if (newCompanyLogo) formData.append('logo', newCompanyLogo);
    if (newCompanyBg) formData.append('backgroundImage', newCompanyBg);

    const created = await companyApi.createWithFiles(formData);

    const normalised = {
      ...created,
      id: created._id || created.id,
      irdaRegistration: created.registrationCode || 'N/A',
      descriptionPoints: created.descriptionPoints || descPoints,
      policies: created.policies || [],
    };

    setCompanies((prev) => [...prev, normalised]);
    setShowCompanyModal(false);
    onShowNotification(`Successfully added company ${name}`);

    setNewCompanyName('');
    setNewCompanyContact('');
    setNewCompanyIrda('');
    setNewCompanyAddress('');
    setNewCompanyStatus('Active');
    setNewCompanyStopStart('');
    setNewCompanyStopEnd('');
    setNewCompanyStopReason('');
    setNewCompanyInsuranceTypes(['Life Insurance']);
    setNewWebsiteVisibility('show');
    setNewCompanyLogo(null);
    setNewCompanyBg(null);
    setNewCompanyLogoPreview('');
    setNewCompanyBgPreview('');
    setNewCompanyDescriptionPoints([]);
    setShowAddType(false);
    setNewTypeName('');
  } catch (err) {
    onShowNotification(err.message || 'Failed to save company');
  }
};

  const handleOpenEditCompany = (company) => {
  setEditingCompanyId(company.id);
  setEditCompanyName(company.name || '');
  setEditCompanyContact((company.contact || '').replace(/\D/g, ''));
  setEditCompanyIrda(company.irdaRegistration || company.registrationCode || '');
  setEditCompanyAddress(company.address || '');
  setEditCompanyStatus(company.status || 'Active');
  setEditCompanyStopStart(company.stopStartDate || '');
  setEditCompanyStopEnd(company.stopEndDate || '');
  setEditCompanyStopReason(company.stopReason || '');
  setEditCompanyInsuranceTypes(
    company.insuranceTypes?.length
      ? company.insuranceTypes
      : [company.type || 'Life Insurance']
  );
  setEditWebsiteVisibility(company.websiteVisibility || 'show');
  setEditCompanyLogo(company.logo || null);
  setEditCompanyBg(company.backgroundImage || null);
  setEditCompanyLogoFile(null);
  setEditCompanyBgFile(null);
  setEditCompanyLogoPreview('');
  setEditCompanyBgPreview('');
  setShowEditCompanyModal(true);
  setEditCompanyDescriptionPoints(
  (company.descriptionPoints || []).map((p, i) => ({
    id: p.id || `pt-${i}-${Date.now()}`,
    text: typeof p === 'string' ? p : p.text || '',
  }))
);
};

  const handleUpdateCompany = async (e) => {
  e.preventDefault();
  if (!editingCompanyId) return;

  const name = editCompanyName.trim();
  if (!name) {
    onShowNotification('Company name is required');
    return;
  }

  const nameExists = companies.some(
    (c) =>
      c.id !== editingCompanyId &&
      c.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (nameExists) {
    onShowNotification(
      `Duplicate company name. "${name}" already exists. Please use a different name.`
    );
    return;
  }

  if (!editCompanyContact || !/^\d{10,15}$/.test(editCompanyContact)) {
    onShowNotification('Contact number is required (10–15 digits)');
    return;
  }

  if (!editCompanyAddress.trim()) {
    onShowNotification('Head office location is required');
    return;
  }

  if (editCompanyInsuranceTypes.length === 0) {
    onShowNotification('Select at least one insurance type');
    return;
  }

  const hasLogo = !!(editCompanyLogoFile || editCompanyLogo);
  if (!hasLogo) {
    onShowNotification('Company logo is required');
    return;
  }

  const descPoints = (editCompanyDescriptionPoints || [])
    .filter((p) => String(p.text || '').trim())
    .map((p, i) => ({ text: String(p.text).trim(), order: i }));

  if (descPoints.length === 0) {
    onShowNotification('Add at least one description point');
    return;
  }

  if (editCompanyStatus === 'Temporarily Stopped') {
    if (!editCompanyStopStart || !editCompanyStopEnd || !editCompanyStopReason.trim()) {
      onShowNotification('Pause dates and reason are required when status is Paused');
      return;
    }
  }

  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('registrationCode', 'N/A');
    formData.append('type', editCompanyInsuranceTypes[0]);
    formData.append('insuranceTypes', JSON.stringify(editCompanyInsuranceTypes));
    formData.append('address', editCompanyAddress.trim());
    formData.append('contact', editCompanyContact.trim());
    formData.append('status', editCompanyStatus);
    formData.append(
      'websiteVisibility',
      editCompanyStatus === 'Active' ? 'show' : editWebsiteVisibility
    );
    formData.append(
      'consultationEnabled',
      editCompanyStatus === 'Active' ? 'true' : 'false'
    );
    formData.append('descriptionPoints', JSON.stringify(descPoints));

    if (editCompanyStatus === 'Temporarily Stopped') {
      formData.append('stopStartDate', editCompanyStopStart);
      formData.append('stopEndDate', editCompanyStopEnd);
      formData.append('stopReason', editCompanyStopReason.trim());
    } else {
      formData.append('stopStartDate', '');
      formData.append('stopEndDate', '');
      formData.append('stopReason', '');
    }

    if (editCompanyLogoFile) formData.append('logo', editCompanyLogoFile);
    if (editCompanyBgFile) formData.append('backgroundImage', editCompanyBgFile);

    const updated = await companyApi.updateWithFiles(editingCompanyId, formData);

    setCompanies((prev) =>
      prev.map((c) =>
        c.id === editingCompanyId
          ? {
              ...c,
              ...updated,
              id: updated._id || updated.id || c.id,
              irdaRegistration: updated.registrationCode || c.irdaRegistration,
              descriptionPoints: updated.descriptionPoints || descPoints,
              policies: updated.policies || c.policies || [],
            }
          : c
      )
    );

    setShowEditCompanyModal(false);
    onShowNotification(`Successfully updated ${name}`);
  } catch (err) {
    onShowNotification(err.message || 'Failed to update company');
  }
};

  const handleAddInsuranceType = async () => {
  const name = newTypeName.trim();
  if (!name) {
    onShowNotification('Enter an insurance type name');
    return;
  }

  // prevent local duplicate
  if (insuranceTypesList.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
    onShowNotification(`Type "${name}" already exists`);
    return;
  }

  try {
    const created = await companyApi.addInsuranceType(name);
    setInsuranceTypesList((prev) => [...prev, created]);
    // auto-select the new type on the form that is open
    if (showCompanyModal) {
      setNewCompanyInsuranceTypes((prev) =>
        prev.includes(created.name) ? prev : [...prev, created.name]
      );
    }
    if (showEditCompanyModal) {
      setEditCompanyInsuranceTypes((prev) =>
        prev.includes(created.name) ? prev : [...prev, created.name]
      );
    }
    setNewTypeName('');
    setShowAddType(false);
    onShowNotification(`Added insurance type: ${created.name}`);
  } catch (err) {
    onShowNotification(err.message || 'Failed to add insurance type');
  }
};

 const handleSaveStopControl = async (e) => {
  e.preventDefault();
  if (!stopCompanyId) return;

  try {
    if (stopStatus === 'Temporarily Stopped') {
      if (!stopStartDateVal || !stopEndDateVal || !stopReasonVal.trim()) {
        onShowNotification('Pause dates and reason are required');
        return;
      }
    }

    const payload = {
      status: stopStatus,
      websiteVisibility:
        stopStatus === 'Active' ? 'show' : stopWebsiteVisibility || 'show',
      consultationEnabled: stopStatus === 'Active',
      stopStartDate:
        stopStatus === 'Temporarily Stopped' ? stopStartDateVal : null,
      stopEndDate:
        stopStatus === 'Temporarily Stopped' ? stopEndDateVal : null,
      stopReason:
        stopStatus === 'Temporarily Stopped' ? stopReasonVal.trim() : null,
    };

    const updated = await companyApi.update(stopCompanyId, payload);

    setCompanies((prev) =>
      prev.map((c) =>
        c.id === stopCompanyId
          ? {
              ...c,
              ...payload,
              // keep any extra fields returned by API
              ...(updated || {}),
              id: c.id,
            }
          : c
      )
    );

    setShowStopModal(false);
    onShowNotification(
      stopStatus === 'Active'
        ? 'Company is now Fully Active'
        : stopWebsiteVisibility === 'hide'
        ? 'Company paused and hidden from website'
        : 'Company paused but still visible on website (consultation disabled)'
    );
  } catch (err) {
    onShowNotification(err.message || 'Failed to update listing status');
  }
};
  // ---------- Policy / Scheme CRUD ----------
  // ---------- Add Scheme ----------
const handleSavePolicy = async (e) => {
  e.preventDefault();
  if (!selectedCompanyId) {
    onShowNotification('Select a company first');
    return;
  }

  const name = newPolicyName.trim();
  if (!name) {
    onShowNotification('Policy scheme name is required');
    return;
  }

  const keyFeatures = (newPolicyKeyFeatures || [])
    .filter((p) => String(p.text || '').trim())
    .map((p, i) => ({ text: String(p.text).trim(), order: i }));

  const eligibilityCriteria = (newPolicyEligibility || [])
    .filter((p) => String(p.text || '').trim())
    .map((p, i) => ({ text: String(p.text).trim(), order: i }));

  try {
    let brochurePath = null;
    let brochureFileName = null;

    if (newPolicyBrochureFile) {
      const up = await apiService.uploadDocument(
        newPolicyBrochureFile,
        'brochure',
        selectedCompanyId,
        'policy'
      );
      brochurePath = up?.path || up?.url || up?.filePath || null;
      brochureFileName =
        up?.fileName || up?.name || newPolicyBrochureFile.name;
      if (!brochurePath) {
        onShowNotification('Brochure upload failed — no path returned');
        return;
      }
    }

    const created = await companyApi.addScheme(selectedCompanyId, {
      name,
      keyFeatures,
      eligibilityCriteria,
      brochurePath,
      brochureFileName,
    });

    const normalised = {
      ...created,
      id: created.id || created._id || `pol-${Date.now()}`,
      name: created.name || name,
      keyFeatures: created.keyFeatures || keyFeatures,
      eligibilityCriteria: created.eligibilityCriteria || eligibilityCriteria,
      brochurePath: created.brochurePath ?? brochurePath,
      brochureFileName: created.brochureFileName ?? brochureFileName,
    };

    setCompanies((prev) =>
      prev.map((c) =>
        c.id === selectedCompanyId
          ? { ...c, policies: [...(c.policies || []), normalised] }
          : c
      )
    );

    setShowPolicyModal(false);
    onShowNotification(`Successfully added policy scheme ${name}`);
    setNewPolicyName('');
    setNewPolicyKeyFeatures([]);
    setNewPolicyEligibility([]);
    setNewPolicyBrochureFile(null);
  } catch (err) {
    onShowNotification(err.message || 'Failed to add policy scheme');
  }
};

// ---------- Open Edit Scheme ----------
const handleOpenEditPolicy = (policy) => {
  setEditingPolicyId(policy.id || policy._id);
  setEditPolicyName(policy.name || '');
  setEditPolicyKeyFeatures(
    (policy.keyFeatures || []).map((p, i) => ({
      id: p.id || `kf-${i}`,
      text: typeof p === 'string' ? p : p.text || '',
    }))
  );
  setEditPolicyEligibility(
    (policy.eligibilityCriteria || []).map((p, i) => ({
      id: p.id || `el-${i}`,
      text: typeof p === 'string' ? p : p.text || '',
    }))
  );

  setEditPolicyBrochureFile(null);
  setEditPolicyBrochurePath(policy.brochurePath || null);
  setEditPolicyBrochureName(policy.brochureFileName || '');
  setEditPolicyBrochureCleared(false);

  setShowEditPolicyModal(true);
};

// ---------- Update Scheme ----------
const handleUpdatePolicy = async (e) => {
  e.preventDefault();
  if (!editingPolicyId || !selectedCompanyId) return;

  const name = editPolicyName.trim();
  if (!name) {
    onShowNotification('Policy scheme name is required');
    return;
  }

  const keyFeatures = (editPolicyKeyFeatures || [])
    .filter((p) => String(p.text || '').trim())
    .map((p, i) => ({ text: String(p.text).trim(), order: i }));

  const eligibilityCriteria = (editPolicyEligibility || [])
    .filter((p) => String(p.text || '').trim())
    .map((p, i) => ({ text: String(p.text).trim(), order: i }));

  try {
    let brochurePath = editPolicyBrochureCleared ? null : editPolicyBrochurePath;
    let brochureFileName = editPolicyBrochureCleared ? null : editPolicyBrochureName;

    // New file chosen → upload first, then save path
    if (editPolicyBrochureFile) {
      const up = await apiService.uploadDocument(
        editPolicyBrochureFile,
        'brochure',
        selectedCompanyId,
        'policy'
      );
      brochurePath = up?.path || up?.url || up?.filePath || null;
      brochureFileName =
        up?.fileName || up?.name || editPolicyBrochureFile.name;
      if (!brochurePath) {
        onShowNotification('Brochure upload failed — no path returned');
        return;
      }
    }

    const payload = {
      name,
      keyFeatures,
      eligibilityCriteria,
      brochurePath,
      brochureFileName,
    };

    const updated = await companyApi.updateScheme(
      selectedCompanyId,
      editingPolicyId,
      payload
    );

    setCompanies((prev) =>
      prev.map((c) =>
        c.id === selectedCompanyId
          ? {
              ...c,
              policies: (c.policies || []).map((p) =>
                (p.id || p._id) === editingPolicyId
                  ? {
                      ...p,
                      ...updated,
                      id: updated.id || updated._id || p.id,
                      name: updated.name || name,
                      keyFeatures: updated.keyFeatures || keyFeatures,
                      eligibilityCriteria:
                        updated.eligibilityCriteria || eligibilityCriteria,
                      brochurePath:
                        updated.brochurePath !== undefined
                          ? updated.brochurePath
                          : brochurePath,
                      brochureFileName:
                        updated.brochureFileName !== undefined
                          ? updated.brochureFileName
                          : brochureFileName,
                    }
                  : p
              ),
            }
          : c
      )
    );

    setShowEditPolicyModal(false);
    setEditingPolicyId(null);
    setEditPolicyBrochureFile(null);
    setEditPolicyBrochurePath(null);
    setEditPolicyBrochureName('');
    setEditPolicyBrochureCleared(false);
    onShowNotification(`Successfully updated policy scheme ${name}`);
  } catch (err) {
    onShowNotification(err.message || 'Failed to update policy scheme');
  }
};

// ---------- Delete Scheme (unchanged logic, safe ids) ----------
const handleDeletePolicy = async (policyId, policyName) => {
  if (!selectedCompanyId) return;
  const ok = window.confirm(
    `Delete policy "${policyName}"?\n\nThis cannot be undone.`
  );
  if (!ok) return;

  try {
    await companyApi.deleteScheme(selectedCompanyId, policyId);
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === selectedCompanyId
          ? {
              ...c,
              policies: (c.policies || []).filter(
                (p) => (p.id || p._id) !== policyId
              ),
            }
          : c
      )
    );
    if (selectedPolicyId === policyId) setSelectedPolicyId('');
    onShowNotification(`Removed policy "${policyName}"`);
  } catch (err) {
    onShowNotification(err.message || 'Failed to delete policy');
  }
};

  // ---------- Customer (same as before) ----------
 
 const relatedCustomers = (customers || []).filter((c) => {
  const sameCompany =
    (c.insuranceCompany || '').toLowerCase() ===
    (selectedCompany?.name || '').toLowerCase();
  if (!sameCompany) return false;

  // optional: also filter by selected policy
  if (selectedPolicyId && selectedPolicy?.name) {
    return (
      (c.policyType || '').toLowerCase() ===
      (selectedPolicy.name || '').toLowerCase()
    );
  }
  return true;
});

  const uploadCustomerDoc = async (file, customerId, category) => {
  if (!file) return null;
  try {
    const result = await apiService.uploadDocument(
      file,
      category,
      customerId,
      'customer'
    );
    // Backend may return { path }, { url }, { filePath }, or { data: {...} }
    const path =
      result?.path ||
      result?.url ||
      result?.filePath ||
      result?.data?.path ||
      result?.data?.url ||
      null;
    return {
      path,
      fileName: file.name, // exact name user uploaded
    };
  } catch (err) {
    console.error(`Upload failed for ${category}:`, err);
    return null;
  }
};

 const handleSaveCustomer = async (e) => {
  e.preventDefault();

  const notify = (msg) => {
    if (typeof onShowNotification === 'function') onShowNotification(msg);
    else console.warn('[notify]', msg);
  };

  if (typeof onAddCustomer !== 'function' && !editingCustomerId) {
    onShowNotification?.(
      'Customer save is not connected (onAddCustomer missing from context).'
    );
    return;
  }

  if (!selectedPolicy || !selectedCompany) {
    notify('No policy selected');
    return;
  }

  const NAME_RE = /^[A-Za-z\s.'.-]+$/;
  const PHONE_RE = /^\d{10,15}$/;
  const ADDRESS_RE = /^[A-Za-z0-9\s,./\-#()'&]+$/;
  const MAX_DOC_BYTES = 1 * 1024 * 1024;
  const DOC_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

  const onlyDigits = (v) => String(v || '').replace(/\D/g, '');

  const validateName = (label, value, required = false) => {
    const v = (value || '').trim();
    if (!v) return required ? `${label} is required` : null;
    if (!NAME_RE.test(v)) return `${label} must contain letters only`;
    return null;
  };

  const validatePhone = (label, value, required = false) => {
    const v = onlyDigits(value);
    if (!v) return required ? `${label} is required` : null;
    if (!PHONE_RE.test(v)) return `${label} must be 10–15 digits`;
    return null;
  };

  const validateAddress = (value, required = false) => {
    const v = (value || '').trim();
    if (!v) return required ? 'Postal address is required' : null;
    if (!ADDRESS_RE.test(v)) {
      return "Address may only contain letters, numbers, spaces and , . / - # ( ) ' &";
    }
    if (v.length < 8) return 'Please enter a complete postal address';
    return null;
  };

  const checkDocFile = (file, label) => {
    if (!file) return null;
    const okType =
      DOC_TYPES.includes(file.type) ||
      /\.(jpe?g|png|pdf)$/i.test(file.name || '');
    if (!okType) return `${label}: only JPG, PNG or PDF allowed`;
    if (file.size > MAX_DOC_BYTES) return `${label}: file must be under 1 MB`;
    return null;
  };

  const emailOk = (email) => {
    if (typeof isValidSecureEmail === 'function') {
      return isValidSecureEmail(email);
    }
    const v = String(email || '').trim();
    if (!v) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  };

  const errors = [
    validateName('Customer full name', custName, true),
    validateName('Spouse name', custSpouseName, false),
    validateName("Father's name", custFatherName, true),
    validateName("Mother's name", custMotherName, true),
    validateName('Nominee name', nomineeName, true),
    validateName('Relationship with applicant', nomineeRelationship, true),
    validatePhone('Mobile contact', custMobile, true),
    validatePhone('Alternate mobile', custMobile2, false),
    validatePhone('Nominee mobile', nomineeMobile, true),
    validatePhone('Nominee alternate mobile', nomineeMobile2, false),
    validateAddress(custAddress, true),
  ].filter(Boolean);

  if (!custDob) errors.push('Date of birth is required');
  if (!custBloodGroup) errors.push('Blood group is required');
  if (!nomineeDob) errors.push('Nominee date of birth is required');

  if ((custEmail || '').trim() && !emailOk(custEmail)) {
    errors.push('Customer email is invalid');
  }
  if ((nomineeEmail || '').trim() && !emailOk(nomineeEmail)) {
    errors.push('Nominee email is invalid');
  }

  [
    checkDocFile(aadhaarFile, 'Aadhaar'),
    checkDocFile(photoFile, 'Photo'),
    checkDocFile(panFile, 'PAN'),
    checkDocFile(marksheetFile, 'Marksheet'),
    checkDocFile(bankProofFile, 'Bank proof'),
    checkDocFile(signatureFile, 'Signature'),
    checkDocFile(incomeProofFile, 'Income proof'),
  ]
    .filter(Boolean)
    .forEach((msg) => errors.push(msg));

  if (errors.length) {
    notify(errors[0]);
    return;
  }

  const premNum =
    Number(String(selectedPolicy.premium || '').replace(/[^0-9]/g, '')) ||
    10000;
  const parsedAnnualIncome =
    Number(String(annualIncome || '').replace(/[^0-9]/g, '')) ||
    premNum * 10;

  const customerId = editingCustomerId || `cust-${Date.now()}`;

  // Upload only newly selected files
  const uploadCustomerDoc = async (file, category) => {
    if (!file) return null;
    try {
      const result = await apiService.uploadDocument(
        file,
        category,
        customerId,
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
      console.error(`Upload failed for ${category}:`, err);
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
    uploadCustomerDoc(aadhaarFile, 'aadhaar'),
    uploadCustomerDoc(photoFile, 'photo'),
    uploadCustomerDoc(panFile, 'pan'),
    uploadCustomerDoc(marksheetFile, 'marksheet'),
    uploadCustomerDoc(bankProofFile, 'bankProof'),
    uploadCustomerDoc(signatureFile, 'signature'),
    uploadCustomerDoc(incomeProofFile, 'incomeProof'),
  ]);

  const customerPayload = {
    id: customerId,
    name: custName.trim(),
    mobile: onlyDigits(custMobile),
    mobile2: onlyDigits(custMobile2) || undefined,
    email: (custEmail || '').trim() || 'N/A',
    insuranceCompany: selectedCompany.name,
    totalSumAssured: premNum * 15,
    totalPremium: premNum,
    advisor:
      !custAssignedAgent || custAssignedAgent === '__DIRECT__'
        ? 'Self / Internal Direct'
        : custAssignedAgent,
    address: custAddress.trim(),
    dateOfBirth: custDob,
    gender: custGender,
    city: 'Chennai',
    pinCode: '600001',
    occupation: custOccupation || 'Self Employed',
    annualIncome: parsedAnnualIncome,
    spouseName: custSpouseName.trim() || undefined,
    fatherName: custFatherName.trim(),
    motherName: custMotherName.trim(),
    bloodGroup: custBloodGroup,
    nominee: {
      name: nomineeName.trim(),
      dob: nomineeDob,
      relationship: nomineeRelationship.trim(),
      mobile: onlyDigits(nomineeMobile),
      mobile2: onlyDigits(nomineeMobile2) || undefined,
      email: (nomineeEmail || '').trim() || undefined,
    },
    policies: [],
    policyNo: `POL-${Math.floor(100000 + Math.random() * 900000)}`,
    policyType: selectedPolicy.name,
    premium: premNum,
    rate: selectedPolicy.rate,
    renewalDate: '',
    createdAt: new Date().toISOString(),
  };

  // Keep existing docs if not replaced; clear if user removed them
  const applyDoc = (uploaded, existingEntry, urlField, nameField) => {
    if (uploaded?.path) {
      customerPayload[urlField] = uploaded.path;
      customerPayload[nameField] = uploaded.fileName;
      return;
    }
    if (editingCustomerId) {
      if (existingEntry?.path) {
        customerPayload[urlField] = existingEntry.path;
        customerPayload[nameField] = existingEntry.fileName;
      } else {
        customerPayload[urlField] = null;
        customerPayload[nameField] = null;
      }
    }
  };

  applyDoc(aadhaarUp, existingDocs.aadhaar, 'aadhaarUrl', 'aadhaarFileName');
  applyDoc(photoUp, existingDocs.photo, 'photoUrl', 'photoFileName');
  applyDoc(panUp, existingDocs.pan, 'panUrl', 'panFileName');
  applyDoc(marksheetUp, existingDocs.marksheet, 'marksheetUrl', 'marksheetFileName');
  applyDoc(bankUp, existingDocs.bankProof, 'bankProofUrl', 'bankProofFileName');
  applyDoc(signatureUp, existingDocs.signature, 'signatureUrl', 'signatureFileName');
  applyDoc(incomeUp, existingDocs.incomeProof, 'incomeProofUrl', 'incomeProofFileName');

  try {
    if (editingCustomerId && typeof onUpdateCustomer === 'function') {
      await onUpdateCustomer(editingCustomerId, customerPayload);
      notify(`Customer "${custName.trim()}" updated successfully.`);
    } else {
      onAddCustomer(customerPayload);
      notify(`Customer profile created successfully for ${custName.trim()}.`);
    }
  } catch (err) {
    console.error(err);
    notify(err.message || 'Failed to save customer');
    return;
  }

  // Reset form
  setEditingCustomerId(null);
  clearExistingDocs();
  setCustName('');
  setCustMobile('');
  setCustMobile2('');
  setCustEmail('');
  setCustDob('1990-01-01');
  setCustGender('Male');
  setCustOccupation('');
  setCustAddress('');
  setCustSpouseName('');
  setCustAssignedAgent('__DIRECT__');
  setCustFatherName('');
  setCustMotherName('');
  setCustBloodGroup('');
  setNomineeName('');
  setNomineeDob('2015-01-01');
  setNomineeRelationship('');
  setNomineeMobile('');
  setNomineeMobile2('');
  setNomineeEmail('');
  setAnnualIncome('');
  setAadhaarFileName('');
  setPhotoFileName('');
  setPanFileName('');
  setMarksheetFileName('');
  setBankProofFileName('');
  setSignatureFileName('');
  setIncomeProofFileName('');
  setAadhaarFile(null);
  setPhotoFile(null);
  setPanFile(null);
  setMarksheetFile(null);
  setBankProofFile(null);
  setSignatureFile(null);
  setIncomeProofFile(null);

  setViewState('policies');
};

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-400 text-sm">
        Loading companies from database...
      </div>
    );
  }

   const openCustomerForEdit = (cust) => {
  // Auto-select policy that matches this customer
  if (selectedCompany?.policies?.length) {
    const match = selectedCompany.policies.find(
      (p) =>
        (p.name || '').toLowerCase() ===
        (cust.policyType || '').toLowerCase()
    );
    if (match) {
      setSelectedPolicyId(match.id);
    }
  }

  setEditingCustomerId(cust.id || cust._id);

  setCustName(cust.name || '');
  setCustMobile(cust.mobile || '');
  setCustMobile2(cust.mobile2 || '');
  setCustEmail(cust.email === 'N/A' ? '' : cust.email || '');
  setCustDob(cust.dateOfBirth || cust.dob || '1990-01-01');
  setCustGender(cust.gender || 'Male');
  setCustOccupation(cust.occupation || '');
  setCustAddress(cust.address || '');
  setCustSpouseName(cust.spouseName || '');
  setCustAssignedAgent(
    !cust.advisor || cust.advisor === 'Self / Internal Direct'
      ? '__DIRECT__'
      : cust.advisor
  );
  setCustFatherName(cust.fatherName || '');
  setCustMotherName(cust.motherName || '');
  setCustBloodGroup(cust.bloodGroup || '');
  setAnnualIncome(String(cust.annualIncome || ''));

  const nom = cust.nominee || {};
  setNomineeName(nom.name || '');
  setNomineeDob(nom.dob || '2015-01-01');
  setNomineeRelationship(nom.relationship || '');
  setNomineeMobile(nom.mobile || '');
  setNomineeMobile2(nom.mobile2 || '');
  setNomineeEmail(nom.email || '');

  // Existing documents (edit mode — do not force re-upload)
  const pick = (path, fileName) =>
    path
      ? {
          path,
          fileName:
            fileName ||
            (typeof path === 'string' ? path.split('/').pop() : 'file'),
        }
      : null;

  setExistingDocs({
    aadhaar: pick(
      cust.aadhaarUrl || cust.aadhaarFile,
      cust.aadhaarFileName
    ),
    photo: pick(
      cust.photoUrl || cust.profilePhoto || cust.passportPhoto,
      cust.photoFileName
    ),
    pan: pick(cust.panUrl || cust.panFile, cust.panFileName),
    marksheet: pick(
      cust.marksheetUrl || cust.marksheetFile,
      cust.marksheetFileName
    ),
    bankProof: pick(
      cust.bankProofUrl || cust.bankProofFile,
      cust.bankProofFileName
    ),
    signature: pick(
      cust.signatureUrl || cust.signatureFile,
      cust.signatureFileName
    ),
    incomeProof: pick(
      cust.incomeProofUrl || cust.incomeProofFile,
      cust.incomeProofFileName
    ),
  });

  // Clear any newly picked files
  setAadhaarFile(null);
  setAadhaarFileName('');
  setPhotoFile(null);
  setPhotoFileName('');
  setPanFile(null);
  setPanFileName('');
  setMarksheetFile(null);
  setMarksheetFileName('');
  setBankProofFile(null);
  setBankProofFileName('');
  setSignatureFile(null);
  setSignatureFileName('');
  setIncomeProofFile(null);
  setIncomeProofFileName('');

  setViewState('customerForm');
};

  // ---------- UI (same structure as your original) ----------
  return (
    <div className="space-y-6" id="companies-policies-container">
      {/* Header */}
      {viewState === 'companies' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white font-sans">Companies & Policies Management</h2>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Configure insurance company listings, establish policy schemes, and register clients only under active policies.
            </p>
          </div>
          <button
  onClick={() => {
    // Reset every field so the form is clean
    setNewCompanyName('');
    setNewCompanyContact('');
    setNewCompanyIrda('');
    setNewCompanyAddress('');
    setNewCompanyStatus('Active');
    setNewCompanyStopStart('');
    setNewCompanyStopEnd('');
    setNewCompanyStopReason('');
    setNewCompanyInsuranceTypes(['Life Insurance']);
    setNewWebsiteVisibility('show');
    setNewCompanyLogo(null);
    setNewCompanyBg(null);
    setNewCompanyLogoPreview('');
    setNewCompanyBgPreview('');
    setShowAddType(false);
    setNewTypeName('');
    setShowCompanyModal(true);
  }}
  className="mt-3 sm:mt-0 px-4 py-2 bg-[#0078d4] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
>
  <Plus className="w-4 h-4" />
  Add New Company
  </button>
        </div>
      )}

      {viewState === 'customerForm' && (
        <div className="border-b border-slate-800 pb-5">
          <h2 className="text-xl font-bold text-white">
  {editingCustomerId ? 'Edit Customer' : 'Customer Registration'}
</h2>
<p className="text-sm text-slate-400">
  {editingCustomerId
    ? `Update details for ${custName || 'this customer'} under ${selectedCompany?.name}.`
    : `Complete the detailed profile to bind a new customer under ${selectedCompany?.name}.`}
</p>
        </div>
      )}

      {/* Companies Grid */}
      {viewState === 'companies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
{companies.map((company) => (
  <div
    key={company.id}
    className="rounded-xl border border-slate-800 bg-[#1e293b] p-4 flex flex-col justify-between relative overflow-hidden"
    style={
      company.backgroundImage
        ? {
            backgroundImage: `linear-gradient(rgba(30,41,59,0.55), rgba(30,41,59,0.50)), url(${API_URL}${company.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : undefined
    }
  >
    <div className="relative z-10">
  {(() => {
    const hasBg = Boolean(company.backgroundImage);
    // With background photo → bright text; without → softer slate text
    const labelCls = hasBg ? 'text-slate-200' : 'text-slate-500';
    const valueCls = hasBg
      ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]'
      : 'text-slate-200';
    const nameCls = hasBg
      ? 'text-sm font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
      : 'text-sm font-bold text-white';
    const bodyCls = hasBg
      ? 'space-y-1 text-[11px] text-slate-100'
      : 'space-y-1 text-[11px] text-slate-400';

    return (
      <>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-slate-800/90 border border-slate-600 flex items-center justify-center overflow-hidden shadow">
              {company.logo ? (
                <img
                  src={`${API_URL}${company.logo}`}
                  alt={company.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-4 h-4 text-slate-300" />
              )}
            </div>
            <div>
              <p className={`text-[9px] uppercase tracking-wider font-bold ${labelCls}`}>
                Carrier Node ID
              </p>
              <h4 className={nameCls}>{company.name}</h4>
            </div>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              company.status === 'Active'
                ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                : 'bg-rose-500/25 text-rose-200 border border-rose-400/40'
            }`}
          >
            {company.status === 'Temporarily Stopped' ? 'Temporarily Stopped' : 'Active'}
          </span>
        </div>

        <div className={bodyCls}>
    
          <p>
            <span className={labelCls}>Line:</span>{' '}
            <span className={valueCls}>
              {(company.insuranceTypes || [company.type]).filter(Boolean).join(', ')}
            </span>
          </p>
          <p>
            <span className={labelCls}>Office:</span>{' '}
            <span className={valueCls}>{company.address || 'N/A'}</span>
          </p>
          <p>
            <span className={labelCls}>Contact:</span>{' '}
            <span className={valueCls}>{company.contact || 'N/A'}</span>
          </p>
        </div>
      </>
    );
  })()}

      {company.status === 'Temporarily Stopped' && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/20 text-[10px]">
          <p className="text-rose-300 font-bold uppercase tracking-wider">Listing Stop Schedule</p>
          <p className="text-rose-200 mt-0.5">
            {company.stopStartDate} to {company.stopEndDate}
          </p>
          <p className="text-rose-300/80 mt-0.5">Reason: {company.stopReason}</p>
        </div>
      )}
    </div>

    <div className="flex gap-2 mt-4 relative z-10">
      <button
        onClick={() => {
          setSelectedCompanyId(company.id);
          setViewState('policies');
        }}
        className="flex-1 px-3 py-2 bg-[#0078d4] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold"
      >
        Manage Schemes
      </button>
      <button
        onClick={() => handleOpenEditCompany(company)}
        className="px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1"
      >
        <Edit className="w-3.5 h-3.5" /> Edit
      </button>
      <button
        onClick={() => {
          setStopCompanyId(company.id);
          setStopStatus(company.status);
          setStopStartDateVal(company.stopStartDate || '');
          setStopEndDateVal(company.stopEndDate || '');
          setStopReasonVal(company.stopReason || '');
          setStopWebsiteVisibility(company.websiteVisibility || 'show');
          setShowStopModal(true);
        }}
        className={`px-3 py-2 rounded-lg text-xs font-semibold ${
          company.status === 'Temporarily Stopped'
            ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
        }`}
      >
        {company.status === 'Temporarily Stopped' ? 'Start Control' : 'Stop Control'}
      </button>
    </div>
  </div>
))}
        </div>
      )}

      {/* ========== POLICIES VIEW ========== */}
{viewState === 'policies' && selectedCompany && (
  <div className="space-y-5">
    <button
      type="button"
      onClick={() => {
        setViewState('companies');
        setSelectedPolicyId('');
      }}
      className="self-start group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
        text-[#0078d4] bg-[#0078d4]/10 border border-[#0078d4]/25
        hover:bg-[#0078d4] hover:text-white transition-all"
    >
      <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
      Back to Companies List
    </button>

    {/* SINGLE top card: brand + profile + description */}
    <div className="rounded-xl border border-slate-600 bg-slate-800/80 p-5 shadow-lg">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left — identity + facts */}
        <div className="lg:w-1/2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-600 overflow-hidden flex items-center justify-center font-bold text-white shrink-0">
              {selectedCompany.logo ? (
                <img
                  src={`${API_URL}${selectedCompany.logo}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                selectedCompany.name?.slice(0, 1)
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white leading-tight">
                {selectedCompany.name}
              </h3>
              <p className="text-xs text-slate-400">
                {(selectedCompany.insuranceTypes || [selectedCompany.type])
                  .filter(Boolean)
                  .join(', ')}
                <span className="mx-1.5">•</span>
                <span
                  className={
                    selectedCompany.status === 'Active'
                      ? 'text-emerald-400 font-semibold'
                      : 'text-rose-400 font-semibold'
                  }
                >
                  {selectedCompany.status === 'Temporarily Stopped'
                    ? 'Paused'
                    : selectedCompany.status}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenEditCompany(selectedCompany)}
              className="ml-auto px-3 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-600 pt-4">
            <div>
              <span className="block text-slate-400 text-[10px] uppercase">Type</span>
              <span className="text-white font-semibold">
                {(selectedCompany.insuranceTypes || [selectedCompany.type])
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 text-[10px] uppercase">Contact</span>
              <span className="text-white font-semibold">
                {selectedCompany.contact || '—'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="block text-slate-400 text-[10px] uppercase">
                Head office
              </span>
              <span className="text-white font-semibold">
                {selectedCompany.address || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Right — description points */}
        <div className="lg:w-1/2 lg:border-l lg:border-slate-600 lg:pl-6">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">
            About this insurer
          </p>
          {Array.isArray(selectedCompany.descriptionPoints) &&
          selectedCompany.descriptionPoints.length > 0 ? (
            <ul className="space-y-2">
              {[...selectedCompany.descriptionPoints]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((pt, i) => (
                  <li key={i} className="text-xs text-slate-200 flex gap-2 leading-relaxed">
                    <span className="text-blue-400 shrink-0">•</span>
                    <span>
                      {String(pt.text || pt)
                        .split(/(\*\*[^*]+\*\*)/g)
                        .map((part, j) =>
                          part.startsWith('**') && part.endsWith('**') ? (
                            <strong key={j} className="text-white">
                              {part.slice(2, -2)}
                            </strong>
                          ) : (
                            <span key={j}>{part}</span>
                          )
                        )}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">
              No description points yet. Edit company to add them.
            </p>
          )}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2 space-y-4">

        
        {/* … keep your AVAILABLE POLICY SCHEMES block after this … */}
        {/* 2) POLICIES — single card, list style */}
        <div className="rounded-xl border border-slate-600 bg-slate-700 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-600">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Available Policy Schemes
              </h4>
              <span className="text-[11px] font-mono text-slate-300">
                {selectedCompany.policies?.length || 0} policies found
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewPolicyName('');
                setShowPolicyModal(true);
              }}
              className="px-3 py-1.5 bg-[#0078d4] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Policy
            </button>
          </div>

          {(selectedCompany.policies || []).length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-300 border-t border-dashed border-slate-600">
              No policies configured. Click &quot;Add New Policy&quot; to register one.
            </div>
          ) : (
            <div className="divide-y divide-slate-600/80">
              {selectedCompany.policies.map((policy) => {
                const isSelected = selectedPolicyId === policy.id;
                const canCreate =
                  isSelected && selectedCompany.status === 'Active';

                return (
                  <div
                    key={policy.id}
                    className={`px-5 py-4 transition-colors ${
                      isSelected ? 'bg-blue-600/20' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isSelected ? 'bg-blue-400' : 'bg-slate-500'
                          }`}
                        />
                        <h5 className="font-bold text-white text-sm truncate">
                          {policy.name}
                        </h5>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isSelected ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPolicyId('');
                              onShowNotification(`Unselected: ${policy.name}`);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-amber-300 border border-amber-500/40 hover:bg-amber-600/20 transition cursor-pointer"
                          >
                            Unselect
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPolicyId(policy.id);
                              onShowNotification(`Selected: ${policy.name}`);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-700 hover:text-white transition cursor-pointer"
                          >
                            Select Policy
                          </button>
                        )}

                        {canCreate && (
  <button
    type="button"
    onClick={() => {
      setEditingCustomerId(null);
      clearExistingDocs();   // ← add this
      setViewState('customerForm');
    }}
    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0078d4] hover:bg-blue-600 text-white transition cursor-pointer flex items-center gap-1"
  >
    <User className="w-3.5 h-3.5" />
    Create Customer
  </button>
)}

                        <button
                          type="button"
                          onClick={() => handleOpenEditPolicy(policy)}
                          className="p-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg cursor-pointer transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePolicy(policy.id, policy.name)}
                          className="p-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Active Assignment Summary + customer list */}
<div className="space-y-4">
  <div className="rounded-xl border border-slate-600 bg-slate-700 p-5 shadow-lg text-xs text-slate-200 space-y-3">
    <p className="font-bold text-white">Active Assignment Summary</p>

    <div className="space-y-2 border-t border-slate-600 pt-3 text-[11px] font-mono">
      <div className="flex justify-between gap-2">
        <span className="text-slate-400">Company:</span>
        <span className="font-bold text-white truncate max-w-[150px]">
          {selectedCompany.name}
        </span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-slate-400">Policy:</span>
        <span className="font-bold text-blue-300 truncate max-w-[150px]">
          {selectedPolicy?.name || 'None Selected'}
        </span>
      </div>
    </div>

    {selectedCompany.status === 'Temporarily Stopped' ? (
      <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] rounded-lg">
        Cannot create customers: company is Temporarily Stopped.
      </div>
    ) : selectedPolicyId ? (
      <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] rounded-lg">
        Policy selected. Use <strong>Create Customer</strong> on the policy row.
      </div>
    ) : (
      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] rounded-lg">
        Select a policy on the left to enable customer registration.
      </div>
    )}

    {/* ===== NEW: list of created customers ===== */}
    <div className="mt-4 border-t border-slate-600 pt-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
        Registered Customers
        <span className="ml-1 text-slate-500">({relatedCustomers.length})</span>
      </p>

      {relatedCustomers.length === 0 ? (
        <p className="text-[11px] text-slate-500">
          No customers created for this company yet.
        </p>
      ) : (
        <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {relatedCustomers.map((c) => {
            const id = c.id || c._id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => openCustomerForEdit(c)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/70 hover:bg-blue-600/20 border border-slate-600 hover:border-blue-500/40 transition flex items-center justify-between gap-2 group"
                >
                  <span className="font-semibold text-white truncate text-[12px]">
                    {c.name}
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-blue-300 flex-shrink-0">
                    Edit →
                  </span>
                </button>
                
              </li>
              
            );
          })}
        </ul>
      )}
    </div>
  </div>
</div>
    </div>
  </div>
)}
      {viewState === 'customerForm' && selectedCompany && selectedPolicy && (
  <div className="space-y-5">
    {/* Back */}
    <button
      type="button"
      onClick={() => {
    setEditingCustomerId(null);   // clear edit mode
    setViewState('policies');
  }}
      className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
        text-[#0078d4] bg-[#0078d4]/10 border border-[#0078d4]/25
        hover:bg-[#0078d4] hover:text-white transition-all cursor-pointer"
    >
      <span className="transition-transform group-hover:-translate-x-0.5">←</span>
      Back to Policy Schemes
    </button>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* LEFT form */}
      <form
        onSubmit={handleSaveCustomer}
        className="xl:col-span-2 rounded-xl border border-slate-600 bg-slate-700 p-5 space-y-6 shadow-lg"
      >
        {/* 1. CORE PERSONAL */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 border-b border-slate-600 pb-2">
            1. Core Personal Details
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold">
                Customer Full Name *
              </label>
              <input
                required
                value={custName}
                onChange={(e) =>
                  setCustName(e.target.value.replace(/[^A-Za-z\s.'.-]/g, ''))
                }
                placeholder="e.g. Priyamvada Raman"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold">
                Spouse Name
              </label>
              <input
                value={custSpouseName}
                onChange={(e) =>
                  setCustSpouseName(e.target.value.replace(/[^A-Za-z\s.'.-]/g, ''))
                }
                placeholder="e.g. Venkatesh Prasad"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold">
                Assigned Agent (Advisor Code)
              </label>
              <select
                value={custAssignedAgent}
                onChange={(e) => setCustAssignedAgent(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              >
                <option value="__DIRECT__">No Agent</option>
                {activeAgents.map((a) => (
                  <option key={a.id} value={a.label}>
                    {a.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">
                Only active licensed agents from recruitment are listed.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold">
                Gender
              </label>
              <select
                value={custGender}
                onChange={(e) => setCustGender(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Father | Mother  (swapped positions as requested) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold">
                Father&apos;s Full Name *
              </label>
              <input
                required
                value={custFatherName}
                onChange={(e) =>
                  setCustFatherName(e.target.value.replace(/[^A-Za-z\s.'.-]/g, ''))
                }
                placeholder="Father's Name"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold">
                Mother&apos;s Full Name *
              </label>
              <input
                required
                value={custMotherName}
                onChange={(e) =>
                  setCustMotherName(e.target.value.replace(/[^A-Za-z\s.'.-]/g, ''))
                }
                placeholder="Mother's Name"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Blood group select */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold">
                Blood Group *
              </label>
              <select
                required
                value={custBloodGroup}
                onChange={(e) => setCustBloodGroup(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              >
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold">
                Date of Birth *
              </label>
              <input
                required
                type="date"
                value={custDob}
                onChange={(e) => setCustDob(e.target.value)}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch (_) {}
                }}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold">
                Mobile Contact *
              </label>
              <input
                required
                inputMode="numeric"
                value={custMobile}
                onChange={(e) => setCustMobile(onlyDigits(e.target.value))}
                maxLength={10}
                placeholder="+91"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold">
                Alternate Mobile
              </label>
              <input
                inputMode="numeric"
                value={custMobile2}
                onChange={(e) => setCustMobile2(onlyDigits(e.target.value))}
                maxLength={10}
                placeholder="+91"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-400 font-bold">
              Email ID
            </label>
            <input
              type="email"
              value={custEmail}
              onChange={(e) => setCustEmail(e.target.value.trimStart())}
              placeholder="name@example.com"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-500">Enter the full email address manually.</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-400 font-bold">
              Postal Address *
            </label>
            <textarea
              required
              rows={2}
              value={custAddress}
              onChange={(e) => setCustAddress(e.target.value)}
              placeholder="House no, street, area, city, state, PIN"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* 2. NOMINEE PARTICULARS */}
<div className="space-y-3">
  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 border-b border-slate-600 pb-2">
    2. Nominee Particulars
  </h4>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    <div className="space-y-1">
      <label className="text-[10px] uppercase text-slate-400 font-bold">
        Nominee Full Name *
      </label>
      <input
        required
        value={nomineeName}
        onChange={(e) =>
          setNomineeName(e.target.value.replace(/[^A-Za-z\s.'.-]/g, ''))
        }
        placeholder="e.g. Ananya Raman"
        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
      />
    </div>

    <div className="space-y-1">
      <label className="text-[10px] uppercase text-slate-400 font-bold">
        Nominee DOB *
      </label>
      <input
        required
        type="date"
        value={nomineeDob}
        onChange={(e) => setNomineeDob(e.target.value)}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker?.();
          } catch (_) {}
        }}
        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500 cursor-pointer"
      />
    </div>

    {/* Order: Mobile → Alternate Mobile → Relationship */}
    <div className="space-y-1">
      <label className="text-[10px] uppercase text-slate-400 font-bold">
        Nominee Mobile *
      </label>
      <input
        required
        type="text"
        inputMode="numeric"
        value={nomineeMobile}
        onChange={(e) => setNomineeMobile(e.target.value.replace(/\D/g, ''))}
        maxLength={10}
        placeholder="+91"
        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
      />
    </div>

    <div className="space-y-1">
      <label className="text-[10px] uppercase text-slate-400 font-bold">
        Nominee Alternate Mobile
      </label>
      <input
        type="text"
        inputMode="numeric"
        value={nomineeMobile2}
        onChange={(e) => setNomineeMobile2(e.target.value.replace(/\D/g, ''))}
        maxLength={10}
        placeholder="+91"
        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
      />
    </div>

    <div className="space-y-1">
      <label className="text-[10px] uppercase text-slate-400 font-bold">
        Relationship with Applicant *
      </label>
      <input
        required
        value={nomineeRelationship}
        onChange={(e) =>
          setNomineeRelationship(e.target.value.replace(/[^A-Za-z\s.'.-]/g, ''))
        }
        placeholder="e.g. Spouse, Son, Daughter"
        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
      />
    </div>

    <div className="space-y-1">
      <label className="text-[10px] uppercase text-slate-400 font-bold">
        Nominee Email ID
      </label>
      <input
        type="email"
        value={nomineeEmail}
        onChange={(e) => setNomineeEmail(e.target.value.trimStart())}
        placeholder="e.g. nominee@gmail.com"
        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
      />
    </div>
  </div>
</div>

        {/* 3. WORK */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 border-b border-slate-600 pb-2">
            3. Work Particulars
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold">
                Estimated Annual Income (₹)
              </label>
              <input
                inputMode="numeric"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(onlyDigits(e.target.value))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold">
                Occupation / Place of employment
              </label>
              <input
                value={custOccupation}
                onChange={(e) => setCustOccupation(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 4. INITIAL KYC DOCUMENT UPLOADS */}
<div className="space-y-3">
  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
    4. Initial KYC Document Uploads
  </h4>
  <p className="text-[11px] text-amber-400 font-semibold">
    Each document must be under 1 MB.
    {editingCustomerId && (
      <span className="text-slate-400 font-normal">
        {' '}
        Already uploaded files are shown below — remove only if you need to replace them.
      </span>
    )}
  </p>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <DocUploadZone
      label="Aadhaar Card Copy (max 1 MB)"
      hint="Drag Aadhaar copy here"
      file={aadhaarFile}
      setFile={setAadhaarFile}
      existing={existingDocs.aadhaar}
      onClearExisting={() =>
        setExistingDocs((prev) => ({ ...prev, aadhaar: null }))
      }
      apiUrl={API_URL}
    />
    <DocUploadZone
      label="Passport Size Photo (max 1 MB)"
      hint="Drag photo here"
      file={photoFile}
      setFile={setPhotoFile}
      existing={existingDocs.photo}
      onClearExisting={() =>
        setExistingDocs((prev) => ({ ...prev, photo: null }))
      }
      apiUrl={API_URL}
    />
    <DocUploadZone
      label="PAN Card Copy (max 1 MB)"
      hint="Drag PAN copy here"
      file={panFile}
      setFile={setPanFile}
      existing={existingDocs.pan}
      onClearExisting={() =>
        setExistingDocs((prev) => ({ ...prev, pan: null }))
      }
      apiUrl={API_URL}
    />
    <DocUploadZone
      label="12th / Degree Certificate (max 1 MB)"
      hint="Drag marksheet here"
      file={marksheetFile}
      setFile={setMarksheetFile}
      existing={existingDocs.marksheet}
      onClearExisting={() =>
        setExistingDocs((prev) => ({ ...prev, marksheet: null }))
      }
      apiUrl={API_URL}
    />
    <DocUploadZone
      label="Bank Account Proof (max 1 MB)"
      hint="Drag bank proof here"
      file={bankProofFile}
      setFile={setBankProofFile}
      existing={existingDocs.bankProof}
      onClearExisting={() =>
        setExistingDocs((prev) => ({ ...prev, bankProof: null }))
      }
      apiUrl={API_URL}
    />
    <DocUploadZone
      label="Applicant Signature (max 1 MB)"
      hint="Drag signature here"
      file={signatureFile}
      setFile={setSignatureFile}
      existing={existingDocs.signature}
      onClearExisting={() =>
        setExistingDocs((prev) => ({ ...prev, signature: null }))
      }
      apiUrl={API_URL}
    />
    <DocUploadZone
      label="Income Proof (max 1 MB)"
      hint="Drag income proof here"
      file={incomeProofFile}
      setFile={setIncomeProofFile}
      existing={existingDocs.incomeProof}
      onClearExisting={() =>
        setExistingDocs((prev) => ({ ...prev, incomeProof: null }))
      }
      apiUrl={API_URL}
    />
  </div>
</div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setViewState('policies')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#0078d4] hover:bg-blue-600 text-white rounded-lg text-xs font-bold"
          >
            Save Profile
          </button>
        </div>
      </form>

      {/* RIGHT binding panel — keep your existing Policy Particulars card */}
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-600 bg-slate-700 p-5 text-xs text-slate-200 space-y-2">
          <p className="font-bold text-white text-[10px] uppercase tracking-wider">
            Policy Particulars Binding
          </p>
          <div className="border-t border-slate-600 pt-3 space-y-2 font-mono text-[11px]">
            <div className="flex justify-between gap-2">
              <span className="text-slate-400">Carrier:</span>
              <span className="font-bold text-white">{selectedCompany.name}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-400">Scheme Name:</span>
              <span className="font-bold text-white">{selectedPolicy.name}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-600 bg-slate-700 p-5 text-xs text-slate-300 space-y-2">
          <p className="font-bold text-white text-[10px] uppercase tracking-wider">
            Registry Instructions
          </p>
          <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
            <li>Double-check spelling of names and contact numbers.</li>
            <li>Upload KYC files under 1 MB (JPG / PNG / PDF).</li>
            <li>Customer is mapped only to the selected active policy.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
)}

      {/* MODALS */}

      {/* 1. Add Company Modal */}
      {/* ========== ADD COMPANY MODAL ========== */}
{showCompanyModal && (
  <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[99]">
    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-slate-800 bg-[#1e293b] p-6 shadow-2xl relative">
      <button
        type="button"
        onClick={() => setShowCompanyModal(false)}
        className="absolute right-4 top-4 text-slate-400 hover:text-white z-10"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="mb-4">
        <h3 className="text-md font-bold text-white flex items-center gap-1.5">
          <Building2 className="w-5 h-5 text-blue-400" /> Register Insurance Company
        </h3>
        <p className="text-xs text-slate-400">
          Add a carrier node to manage under the Aynkaran Ledger.
        </p>
      </div>

      <form onSubmit={handleSaveCompany} className="space-y-4 text-xs font-semibold text-slate-300">
        {/* Logo + Background */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-slate-400">
              Company Logo *
            </label>
            <input
              required
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setNewCompanyLogo(file);
                  setNewCompanyLogoPreview(URL.createObjectURL(file));
                }
              }}
              className="w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-700 file:text-white"
            />
            {newCompanyLogoPreview && (
              <img
                src={newCompanyLogoPreview}
                alt=""
                className="mt-1 w-12 h-12 rounded-lg object-cover border border-slate-600"
              />
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-slate-400">
              Card Background <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setNewCompanyBg(file);
                  setNewCompanyBgPreview(URL.createObjectURL(file));
                }
              }}
              className="w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-700 file:text-white"
            />
            {newCompanyBgPreview && (
              <img
                src={newCompanyBgPreview}
                alt=""
                className="mt-1 w-16 h-10 rounded-lg object-cover border border-slate-600"
              />
            )}
          </div>
        </div>

        {/* Name + Contact — both required */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-slate-400">
              Company Name *
            </label>
            <input
              required
              type="text"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="e.g. Star Health Insurance"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-slate-400">
              Contact Number *
            </label>
            <input
              required
              type="tel"
              inputMode="numeric"
              value={newCompanyContact}
              onChange={(e) =>
                setNewCompanyContact(e.target.value.replace(/\D/g, '').slice(0, 15))
              }
              placeholder="+91"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Address only — no IRDAI */}
        <div className="space-y-1">
          <label className="block text-[10px] uppercase tracking-wider text-slate-400">
            Head Office Location *
          </label>
          <input
            required
            type="text"
            value={newCompanyAddress}
            onChange={(e) => setNewCompanyAddress(e.target.value)}
            placeholder="Street, City, State..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </div>

        {/* Insurance types — click chips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] uppercase tracking-wider text-slate-400">
              Insurance Types *
            </label>
            <button
              type="button"
              onClick={() => setShowAddType(true)}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
            >
              + Add Type
            </button>
          </div>
          <InsuranceTypeChips
            types={insuranceTypesList}
            selected={newCompanyInsuranceTypes}
            onChange={setNewCompanyInsuranceTypes}
          />
          {showAddType && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g. Cyber Insurance"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none"
              />
              <button
                type="button"
                onClick={handleAddInsuranceType}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddType(false)}
                className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Description points */}
        <PointsEditor
          label="Company Description (points) *"
          points={newCompanyDescriptionPoints}
          setPoints={setNewCompanyDescriptionPoints}
          placeholder="e.g. Strong claim support across India"
        />

        {/* Listing status */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-3">
          <div>
            <p className="font-bold text-white">Company Listing Status</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Control whether this company appears on the public website and whether
              customers can request consultation.
            </p>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-white font-bold cursor-pointer">
              <input
                type="radio"
                name="new-status"
                checked={newCompanyStatus === 'Active'}
                onChange={() => {
                  setNewCompanyStatus('Active');
                  setNewWebsiteVisibility('show');
                }}
                className="accent-[#0078d4]"
              />
              Fully Active
            </label>
            <label className="flex items-center gap-1.5 text-white font-bold cursor-pointer">
              <input
                type="radio"
                name="new-status"
                checked={newCompanyStatus === 'Temporarily Stopped'}
                onChange={() => setNewCompanyStatus('Temporarily Stopped')}
                className="accent-[#0078d4]"
              />
              Paused
            </label>
          </div>
          {/* keep your existing paused dates / visibility block if status is Paused */}
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={() => {
              setNewCompanyName('');
              setNewCompanyContact('');
              setNewCompanyAddress('');
              setNewCompanyStatus('Active');
              setNewCompanyInsuranceTypes(['Life Insurance']);
              setNewWebsiteVisibility('show');
              setNewCompanyLogo(null);
              setNewCompanyBg(null);
              setNewCompanyLogoPreview('');
              setNewCompanyBgPreview('');
              setNewCompanyDescriptionPoints([]);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
          >
            Clear
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowCompanyModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0078d4] hover:bg-blue-600 text-white rounded-lg font-bold"
            >
              Save Company
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Add Policy Modal */}
{showPolicyModal && (
  <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[99]">
    <div className="w-full max-w-md rounded-lg border border-slate-800 bg-[#1e293b] p-6 shadow-2xl relative">
      <button
        onClick={() => setShowPolicyModal(false)}
        className="absolute right-4 top-4 text-slate-400 hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="mb-4">
        <h3 className="text-md font-bold text-white flex items-center gap-1.5">
          <ShieldCheck className="w-5 h-5 text-blue-400" /> Configure Policy Scheme
        </h3>
        <p className="text-xs text-slate-400">
          Add an active scheme under {selectedCompany?.name}
        </p>
      </div>

      <form onSubmit={handleSavePolicy} className="space-y-4 text-xs font-semibold text-slate-300">
        <div className="space-y-1">
          <label className="block text-[10px] uppercase tracking-wider text-slate-400">
            Policy Scheme Name *
          </label>
          <input
            required
            type="text"
            value={newPolicyName}
            onChange={(e) => setNewPolicyName(e.target.value)}
            placeholder="e.g. Health Assure Plan"
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </div>

        <PointsEditor
  label="Key features"
  points={newPolicyKeyFeatures}
  setPoints={setNewPolicyKeyFeatures}
  placeholder="e.g. **High** sum assured with flexible terms"
/>
<PointsEditor
  label="Eligibility criteria"
  points={newPolicyEligibility}
  setPoints={setNewPolicyEligibility}
  placeholder="e.g. Age **18–65** years"
/>

<DocUploadZone
  label="Brochure (PDF / image)"
  hint="Click to choose brochure"
  file={newPolicyBrochureFile}
  setFile={(f) => {
    setNewPolicyBrochureFile(f);
  }}
  existing={null}
  onClearExisting={() => setNewPolicyBrochureFile(null)}
  apiUrl={API_URL}
/>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowPolicyModal(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#0078d4] hover:bg-blue-600 text-white rounded-lg font-bold"
          >
            Save Scheme
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* 3. Existing Company Stop Control Modal */}
      {showStopModal && (
  <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[99]">
    <div className="w-full max-w-md rounded-lg border border-slate-800 bg-[#1e293b] p-6 shadow-2xl relative">
      <button
        type="button"
        onClick={() => setShowStopModal(false)}
        className="absolute right-4 top-4 text-slate-400 hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="mb-4">
        <h3 className="text-md font-bold text-white flex items-center gap-1.5">
          <Building2 className="w-5 h-5 text-blue-400" /> Company Listing Status
        </h3>
        <p className="text-xs text-slate-400">
          Control whether this company appears on the public website and whether
          customers can request consultation.
        </p>
      </div>

      <form onSubmit={handleSaveStopControl} className="space-y-4 text-xs font-semibold text-slate-300">
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-white font-bold cursor-pointer">
              <input
                type="radio"
                name="stop-status"
                checked={stopStatus === 'Active'}
                onChange={() => {
                  setStopStatus('Active');
                  setStopWebsiteVisibility('show');
                }}
                className="accent-[#0078d4]"
              />
              Fully Active
            </label>
            <label className="flex items-center gap-1.5 text-white font-bold cursor-pointer">
              <input
                type="radio"
                name="stop-status"
                checked={stopStatus === 'Temporarily Stopped'}
                onChange={() => setStopStatus('Temporarily Stopped')}
                className="accent-[#0078d4]"
              />
              Paused
            </label>
          </div>

          {stopStatus === 'Temporarily Stopped' && (
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <p className="text-[11px] text-slate-400">
                When paused, choose website visibility:
              </p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-1.5 text-white font-bold cursor-pointer">
                  <input
                    type="radio"
                    name="stop-visibility"
                    checked={stopWebsiteVisibility === 'show'}
                    onChange={() => setStopWebsiteVisibility('show')}
                    className="accent-emerald-500"
                  />
                  Show on Website
                  <span className="text-[10px] text-slate-400 font-normal">
                    (consultation disabled)
                  </span>
                </label>
                <label className="flex items-center gap-1.5 text-white font-bold cursor-pointer">
                  <input
                    type="radio"
                    name="stop-visibility"
                    checked={stopWebsiteVisibility === 'hide'}
                    onChange={() => setStopWebsiteVisibility('hide')}
                    className="accent-rose-500"
                  />
                  Hide from Website
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
  <div className="space-y-1">
    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">
      Pause Start Date *
    </label>
    <input
      required
      type="date"
      value={stopStartDateVal || ''}
      onChange={(e) => setStopStartDateVal(e.target.value)}
      onClick={(e) => {
        try {
          e.currentTarget.showPicker?.();
        } catch (_) {}
      }}
      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-white outline-none focus:border-blue-500 text-xs font-mono cursor-pointer"
    />
  </div>
  <div className="space-y-1">
    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">
      Pause End Date *
    </label>
    <input
      required
      type="date"
      value={stopEndDateVal || ''}
      onChange={(e) => setStopEndDateVal(e.target.value)}
      onClick={(e) => {
        try {
          e.currentTarget.showPicker?.();
        } catch (_) {}
      }}
      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-white outline-none focus:border-blue-500 text-xs font-mono cursor-pointer"
    />
  </div>
</div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Reason *
                </label>
                <textarea
                  required
                  rows={2}
                  value={stopReasonVal}
                  onChange={(e) => setStopReasonVal(e.target.value)}
                  placeholder="Enter reason for pausing..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-white outline-none text-xs"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={() => setShowStopModal(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#0078d4] hover:bg-blue-600 text-white rounded-lg font-bold"
          >
            Save Status
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* ========== EDIT COMPANY MODAL ========== */}
{showEditCompanyModal && (
  <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[99]">
    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-slate-800 bg-[#1e293b] p-6 shadow-2xl relative">
      <button
        type="button"
        onClick={() => setShowEditCompanyModal(false)}
        className="absolute right-4 top-4 text-slate-400 hover:text-white z-10"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="mb-4">
        <h3 className="text-md font-bold text-white flex items-center gap-1.5">
          <Edit className="w-5 h-5 text-amber-400" /> Edit Insurer Company Profile
        </h3>
        <p className="text-xs text-slate-400">
          Modify details for existing partner carrier node
        </p>
      </div>

      <form onSubmit={handleUpdateCompany} className="space-y-4 text-xs font-semibold text-slate-300">
        {/* Logo + Background */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-slate-400">
              Company Logo *
            </label>
            <div className="flex items-center gap-3">
              {(editCompanyLogoPreview || editCompanyLogo) && (
                <img
                  src={
                    editCompanyLogoPreview ||
                    `${API_URL}${editCompanyLogo}`
                  }
                  alt="Logo"
                  className="w-12 h-12 rounded-lg object-cover border border-slate-600"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setEditCompanyLogoFile(file);
                    setEditCompanyLogoPreview(URL.createObjectURL(file));
                  }
                }}
                className="text-xs text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-700 file:text-white"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-slate-400">
              Card Background <span className="text-slate-500">(optional)</span>
            </label>
            <div className="flex items-center gap-3">
              {(editCompanyBgPreview || editCompanyBg) && (
                <img
                  src={
                    editCompanyBgPreview || `${API_URL}${editCompanyBg}`
                  }
                  alt="BG"
                  className="w-16 h-10 rounded-lg object-cover border border-slate-600"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setEditCompanyBgFile(file);
                    setEditCompanyBgPreview(URL.createObjectURL(file));
                  }
                }}
                className="text-xs text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-700 file:text-white"
              />
            </div>
          </div>
        </div>

        {/* Name + Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-slate-400">
              Company Full Name *
            </label>
            <input
              required
              type="text"
              value={editCompanyName}
              onChange={(e) => setEditCompanyName(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-slate-400">
              Official Contact Phone *
            </label>
            <input
              required
              type="tel"
              inputMode="numeric"
              value={editCompanyContact}
              onChange={(e) =>
                setEditCompanyContact(e.target.value.replace(/\D/g, '').slice(0, 15))
              }
              maxLength={15}
              placeholder="+91"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Address only — IRDAI removed */}
        <div className="space-y-1">
          <label className="block text-[10px] uppercase tracking-wider text-slate-400">
            Head Office Location / Address *
          </label>
          <input
            required
            type="text"
            value={editCompanyAddress}
            onChange={(e) => setEditCompanyAddress(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </div>

        {/* Insurance types — click chips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] uppercase tracking-wider text-slate-400">
              Insurance Types *
            </label>
            <button
              type="button"
              onClick={() => setShowAddType(true)}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
            >
              + Add Type
            </button>
          </div>
          <InsuranceTypeChips
            types={insuranceTypesList}
            selected={editCompanyInsuranceTypes}
            onChange={setEditCompanyInsuranceTypes}
          />
          {showAddType && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g. Cyber Insurance"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none"
              />
              <button
                type="button"
                onClick={handleAddInsuranceType}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddType(false)}
                className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Description points */}
        <PointsEditor
          label="Company Description (points) *"
          points={editCompanyDescriptionPoints}
          setPoints={setEditCompanyDescriptionPoints}
          placeholder="e.g. Strong claim support across India"
        />

        {/* Listing status — same as register */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-3">
          <div>
            <p className="font-bold text-white">Company Listing Status</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Control whether this company appears on the public website and whether
              customers can request consultation.
            </p>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-white font-bold cursor-pointer">
              <input
                type="radio"
                name="edit-status"
                checked={editCompanyStatus === 'Active'}
                onChange={() => {
                  setEditCompanyStatus('Active');
                  setEditWebsiteVisibility('show');
                }}
                className="accent-[#0078d4]"
              />
              Fully Active
            </label>
            <label className="flex items-center gap-1.5 text-white font-bold cursor-pointer">
              <input
                type="radio"
                name="edit-status"
                checked={editCompanyStatus === 'Temporarily Stopped'}
                onChange={() => setEditCompanyStatus('Temporarily Stopped')}
                className="accent-[#0078d4]"
              />
              Paused
            </label>
          </div>
          {/* keep existing paused visibility + dates block */}
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={() => {
              setEditCompanyName('');
              setEditCompanyContact('');
              setEditCompanyAddress('');
              setEditCompanyStatus('Active');
              setEditCompanyInsuranceTypes(['Life Insurance']);
              setEditWebsiteVisibility('show');
              setEditCompanyLogoFile(null);
              setEditCompanyBgFile(null);
              setEditCompanyLogoPreview('');
              setEditCompanyBgPreview('');
              setEditCompanyDescriptionPoints([]);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
          >
            Clear
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowEditCompanyModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold"
            >
              Update Company
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Edit Policy Modal */}
{showEditPolicyModal && (
  <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[99]">
    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 bg-[#1e293b] p-6 shadow-2xl relative">
      <button
        type="button"
        onClick={() => {
          setShowEditPolicyModal(false);
        }}
        className="absolute right-4 top-4 text-slate-400 hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="mb-4">
        <h3 className="text-base font-bold text-white flex items-center gap-1.5">
          <Edit className="w-5 h-5 text-amber-400" /> Edit Policy Scheme Details
        </h3>
        <p className="text-xs text-slate-400">
          Modify scheme parameters under {selectedCompany?.name}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          handleUpdatePolicy(e);
        }}
        className="space-y-4 text-xs font-semibold text-slate-300"
      >
        <div className="space-y-1">
          <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Policy Scheme Name *
          </label>
          <input
            required
            type="text"
            value={editPolicyName}
            onChange={(e) => {
              setEditPolicyName(e.target.value);
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </div>

        <PointsEditor
          label="Key features"
          points={editPolicyKeyFeatures}
          setPoints={(v) => {
            setEditPolicyKeyFeatures(typeof v === 'function' ? v : v);
          }}
          placeholder="e.g. **High** sum assured"
        />

        <PointsEditor
          label="Eligibility criteria"
          points={editPolicyEligibility}
          setPoints={(v) => {
            setEditPolicyEligibility(typeof v === 'function' ? v : v);
          }}
          placeholder="e.g. Age **18–65**"
        />

        {/* Brochure — see §5 */}
        <DocUploadZone
  label="Brochure (PDF / image)"
  hint="Click to choose brochure"
  file={editPolicyBrochureFile}
  setFile={(f) => {
    setEditPolicyBrochureFile(f);
  }}
  existing={
    !editPolicyBrochureCleared && editPolicyBrochurePath
      ? {
          path: editPolicyBrochurePath,
          fileName: editPolicyBrochureName || 'brochure.pdf',
        }
      : null
  }
  onClearExisting={() => {
    const ok = window.confirm(
      'Remove this brochure? It will be cleared when you click Update Scheme.'
    );
    if (!ok) return;
    setEditPolicyBrochureCleared(true);
    setEditPolicyBrochureFile(null);
    setEditPolicyBrochurePath(null);
    setEditPolicyBrochureName('');
  }}
  apiUrl={API_URL}
/>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setShowEditPolicyModal(false);
            }}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold"
          >
            Update Scheme
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}
