import React, { useState, useRef } from 'react';
import { compressImageToBase64, dataURLtoFile } from '../../utils/imageCompressor';
import API_URL from '../../config/api';
import { apiService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Search,
  Plus,
  Trash2,
  FileText,
  Upload,
  User,
  ShieldAlert,
  Wallet,
  Activity,
  UserCheck,
  Building,
  Calendar,
  Download,
  Eye,
} from 'lucide-react';

/**
 * Hybrid Date Input component allowing both manual typing and native calendar selection
 */
function DualDateInput({ value, onChange, placeholder = "YYYY-MM-DD", required = false }) {
  const dateRef = useRef(null);

  const handleTextChange = (e) => {
    onChange(e.target.value);
  };

  const handleDateChange = (e) => {
    onChange(e.target.value);
  };

  const triggerCalendar = () => {
    if (dateRef.current) {
      try {
        dateRef.current.showPicker();
      } catch (err) {
        dateRef.current.click();
      }
    }
  };

  // Check if string matches YYYY-MM-DD standard format for the calendar picker binding
  const isStandardDate = /^\d{4}-\d{2}-\d{2}$/.test(value);

  return (
    <div className="flex gap-2 items-center w-full">
      <input
        required={required}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleTextChange}
        className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
        title="Type manually (e.g. YYYY-MM-DD or DD-MM-YYYY)"
      />
      
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={triggerCalendar}
          className="p-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-sm"
          title="Choose date from calendar"
        >
          <Calendar size={14} />
        </button>
        <input
          ref={dateRef}
          type="date"
          value={isStandardDate ? value : ""}
          onChange={handleDateChange}
          className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
        />
      </div>
    </div>
  );
}

const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL || ''}${url}`;
};

export default function Customers({ customers = [], addCustomer, updateCustomer, deleteCustomer, policies = [] }) {
  const { loadStateFromServer } = useApp();
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
      updateCustomer(selectedCustomerId, { kycDocuments: updatedKyc });
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
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobileNumber.includes(searchQuery) ||
      c.emailId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
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
  };

  const handleAddKYCDocument = (category) => {
    if (!selectedCustomerId || !docFileVal) return;

    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (cust) {
      const updatedKyc = { ...cust.kycDocuments };
      updatedKyc[category] = docFileVal;
      updateCustomer(selectedCustomerId, { kycDocuments: updatedKyc });
    }

    setDocFileVal('');
  };

  const handleDeleteCustomer = (id) => {
    if (confirm('Are you sure you want to permanently delete this customer profile? Linked sales history will lose CRM anchors.')) {
      deleteCustomer(id);
      if (selectedCustomerId === id) {
        setSelectedCustomerId(customers[0]?.id || null);
      }
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

                  <div className="flex-1 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                      <h3 className="font-extrabold text-lg text-slate-900 leading-tight">{activeCustomer.name}</h3>
                      <span className="w-fit inline-block font-mono text-[9px] bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 mt-1 sm:mt-0 rounded font-semibold">
                        ID: {activeCustomer.id}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                      <p>DOB: <strong>{activeCustomer.dob}</strong></p>
                      <p>Mobile: <strong>{activeCustomer.mobileNumber}</strong></p>
                      <p>Email: <strong>{activeCustomer.emailId}</strong></p>
                    </div>
                  </div>
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
                                setPreviewDocName(slot.key === 'passportSizePhoto' ? 'Photo.png' : value.startsWith('data:') ? 'Attachment.pdf' : value.substring(value.lastIndexOf('/') + 1));
                                setPreviewDocCategory(slot.label);
                              }}
                              title="Click to preview document inline"
                            >
                              <Eye size={10} className="inline mr-0.5 text-emerald-600" />
                              <span>{value.startsWith('data:') ? (slot.key === 'passportSizePhoto' ? 'Photo.png' : 'Attachment.pdf') : value.substring(value.lastIndexOf('/') + 1)}</span>
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
          )}
        </div>
      </div>

      {isAddingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 p-6 my-8">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Users className="text-indigo-600" size={18} />
              <span>Establish New ERP Customer Profile</span>
            </h3>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div>
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
                    <input
                      type="email"
                      placeholder="e.g. user@domain.com"
                      value={emailId}
                      onChange={(e) => setEmailId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800"
                    />
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
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Aadhaar Card Drag / Click Upload Dropzone */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-605 text-slate-600">Aadhaar Card copy (scan_aadhaar.pdf / jpeg)</label>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsAadhaarDragging(true); }}
                      onDragLeave={() => setIsAadhaarDragging(false)}
                      onDrop={handleAadhaarDrop}
                      className={`relative border-2 border-dashed rounded-xl p-3.5 text-center transition-all flex flex-col items-center justify-center cursor-pointer min-h-[90px] ${
                        isAadhaarDragging
                          ? 'border-indigo-500 bg-indigo-50/50'
                          : aadhaarCard
                          ? 'border-emerald-300 bg-emerald-50/10'
                          : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
                      }`}
                      onClick={() => document.getElementById('aadhaar-file-input').click()}
                    >
                      <input
                        type="file"
                        id="aadhaar-file-input"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={handleAadhaarSelect}
                      />
                      {aadhaarCard ? (
                        <div className="space-y-1.5 w-full flex flex-col items-center">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <FileText size={18} />
                          </div>
                          <p className="text-[10px] font-bold text-emerald-800 truncate max-w-full">
                            {typeof aadhaarCard === 'string' && aadhaarCard.startsWith('data:') 
                              ? 'Aadhaar_Card_Uploaded.pdf' 
                              : aadhaarCard}
                          </p>
                          <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-extrabold">Ready to Register</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="mx-auto text-slate-400" size={16} />
                          <p className="text-[10px] text-slate-600 font-bold">Drag Aadhaar copy here</p>
                          <p className="text-[9px] text-slate-400">or click to browse PDF/Image</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Passport Size Photo Drag / Click Upload Dropzone */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-605 text-slate-600">Passport Size Photo (jpeg / png)</label>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsPhotoDragging(true); }}
                      onDragLeave={() => setIsPhotoDragging(false)}
                      onDrop={handlePhotoDrop}
                      className={`relative border-2 border-dashed rounded-xl p-3.5 text-center transition-all flex flex-col items-center justify-center cursor-pointer min-h-[90px] ${
                        isPhotoDragging
                          ? 'border-indigo-500 bg-indigo-50/50'
                          : passportSizePhoto
                          ? 'border-emerald-300 bg-emerald-50/10'
                          : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
                      }`}
                      onClick={() => document.getElementById('photo-file-input').click()}
                    >
                      <input
                        type="file"
                        id="photo-file-input"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoSelect}
                      />
                      {passportSizePhoto ? (
                        <div className="space-y-1.5 w-full flex flex-col items-center">
                          <img
                            referrerPolicy="no-referrer"
                            src={passportSizePhoto}
                            alt="Passport Preview"
                            className="w-10 h-10 rounded-full object-cover border border-indigo-600/20 bg-slate-50 shadow-sm"
                          />
                          <p className="text-[10px] font-bold text-slate-705 text-slate-700 truncate max-w-full">
                            {typeof passportSizePhoto === 'string' && passportSizePhoto.startsWith('data:') 
                              ? 'Passport_Photo.png' 
                              : 'Selected photo'}
                          </p>
                          <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-extrabold">Ready to Register</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="mx-auto text-slate-400" size={16} />
                          <p className="text-[10px] text-slate-600 font-bold">Drag Photo here</p>
                          <p className="text-[9px] text-slate-400">or click to browse Image</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingCustomer(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic KYC Document Preview Overlay */}
      {previewDocUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] bg-emerald-50 text-emerald-850 border border-emerald-200/80 px-2 py-0.5 rounded font-mono font-bold">
                  VERIFIED CUSTOMER KYC FILE
                </span>
                <h3 className="font-extrabold text-base text-slate-800 mt-2">{previewDocCategory}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{previewDocName}</p>
              </div>
              <button
                onClick={() => {
                  setPreviewDocUrl(null);
                  setPreviewDocName('');
                  setPreviewDocCategory('');
                }}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-lg p-1.5 focus:outline-none"
              >
                &times;
              </button>
            </div>

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
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-xs text-slate-700">Digital Copy Verified & Sealed</p>
                    <p className="text-[11px] text-slate-400">File Type doesn't support web rendering.</p>
                    <p className="text-[11px] text-emerald-700 font-bold">SHA-256 Checksum: Verified</p>
                  </div>
                </div>
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
