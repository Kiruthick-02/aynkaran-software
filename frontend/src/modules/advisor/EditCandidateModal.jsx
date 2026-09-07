// frontend/src/modules/advisor/EditCandidateModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X, Check, User, Phone, Mail, MapPin, Calendar, Camera,
  Building, Award, Upload, AlertCircle, Sparkles, FileText
} from 'lucide-react';
import { advisorApi } from '../../services/advisorApi';

export default function EditCandidateModal({
  isOpen,
  candidate,
  onClose,
  onSave,
  onShowNotification
}) {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: 'O+',
    qualification: 'Graduate',
    occupation: '',
    insuranceCompany: 'SBI Life Insurance',
    referralName: '',
    referralContact: '',
    source: 'Direct Walk-in',
    address: '',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    notes: '',
    photoUrl: '',
    profilePicture: ''
  });

  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (candidate) {
      setFormData({
        name: candidate.name || '',
        mobile: candidate.mobile || '',
        alternateMobile: candidate.alternateMobile || '',
        email: candidate.email || '',
        dateOfBirth: candidate.dateOfBirth || '',
        gender: candidate.gender || 'Male',
        bloodGroup: candidate.bloodGroup || 'O+',
        qualification: candidate.qualification || 'Graduate',
        occupation: candidate.occupation || '',
        insuranceCompany: candidate.insuranceCompany || 'SBI Life Insurance',
        referralName: candidate.referralName || candidate.referralPerson || '',
        referralContact: candidate.referralContact || '',
        source: candidate.source || 'Direct Walk-in',
        address: candidate.address || '',
        city: candidate.city || 'Chennai',
        district: candidate.district || 'Chennai',
        state: candidate.state || 'Tamil Nadu',
        pincode: candidate.pincode || '600001',
        notes: candidate.notes || '',
        photoUrl: candidate.photoUrl || candidate.profilePicture || candidate.passportPhoto || '',
        profilePicture: candidate.profilePicture || candidate.photoUrl || candidate.passportPhoto || ''
      });
      setPhotoPreview(candidate.photoUrl || candidate.profilePicture || candidate.passportPhoto || null);
      setSelectedPhotoFile(null);
      setErrorMsg(null);
    }
  }, [candidate, isOpen]);

  if (!isOpen || !candidate) return null;

  const handlePhotoSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }
    setSelectedPhotoFile(file);
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim()) {
      setErrorMsg('Candidate Name and Mobile Number are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      let finalPhotoUrl = formData.photoUrl || formData.profilePicture || '';

      // If a new photo file was picked, upload it via documents API
      if (selectedPhotoFile) {
        try {
          const uploadRes = await advisorApi.uploadAdvisorDocument(
            selectedPhotoFile,
            'Passport Size Photo',
            candidate.id,
            'candidate'
          );
          if (uploadRes && (uploadRes.url || uploadRes.path)) {
            finalPhotoUrl = uploadRes.url || uploadRes.path;
          }
        } catch (uploadErr) {
          console.warn('[Photo Upload Error, using fallback data URL]', uploadErr);
        }
      }

      const updatedPayload = {
        ...formData,
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        photoUrl: finalPhotoUrl,
        profilePicture: finalPhotoUrl,
        passportPhoto: finalPhotoUrl,
        passportPhotoUrl: finalPhotoUrl,
        updatedAt: new Date().toISOString()
      };

      if (onSave) {
        await onSave(candidate.id, updatedPayload);
      }

      if (onShowNotification) {
        onShowNotification(`Candidate profile for "${formData.name}" updated successfully.`);
      }
      onClose();
    } catch (err) {
      console.error('[Update Candidate Form Error]', err);
      setErrorMsg(err.message || 'Failed to save candidate updates.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[220] flex min-h-[calc(100vh-7rem)] items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[calc(100vh-7rem)] bg-[#0f172a] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1e293b] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Edit Trainee Candidate Profile
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Candidate ID: {candidate.id} • {candidate.currentStage || 'Stage 1'}
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form id="edit-candidate-form" onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Passport Size Photo / Profile Icon Uploader */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-800 border-2 border-blue-500/50 flex items-center justify-center shadow-lg relative">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={formData.name || 'Candidate'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-slate-500">
                      <User className="w-10 h-10 mx-auto opacity-50" />
                      <span className="text-[9px] font-bold block mt-1">No Photo</span>
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg cursor-pointer transition transform hover:scale-110">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelected}
                  />
                </label>
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-white">Passport-Size Photograph / Profile Icon</h4>
                <p className="text-xs text-slate-400 max-w-md">
                  Upload official passport-size photo. This photo will be set as the candidate profile icon and stored in the Document Vault.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoSelected}
                    />
                  </label>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setSelectedPhotoFile(null);
                        setFormData(prev => ({ ...prev, photoUrl: '', profilePicture: '' }));
                      }}
                      className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold transition"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Personal Particulars */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                1. Personal & Contact Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-300">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Primary Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Alternate Mobile</label>
                  <input
                    type="tel"
                    value={formData.alternateMobile}
                    onChange={e => setFormData({ ...formData, alternateMobile: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Educational & Carrier Preferences */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                2. Educational & Sponsor Affiliation
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-300">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Highest Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. B.Com, MBA, 12th Pass"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Current Occupation</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="e.g. Sales Executive, Business"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Insurance Partner Company</label>
                  <select
                    value={formData.insuranceCompany}
                    onChange={e => setFormData({ ...formData, insuranceCompany: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="SBI Life Insurance">SBI Life Insurance</option>
                    <option value="HDFC Life Insurance">HDFC Life Insurance</option>
                    <option value="Care Health Insurance">Care Health Insurance</option>
                    <option value="Bajaj General Insurance">Bajaj General Insurance</option>
                    <option value="LIC of India">LIC of India</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Referral Sponsor Name</label>
                  <input
                    type="text"
                    value={formData.referralName}
                    onChange={e => setFormData({ ...formData, referralName: e.target.value })}
                    placeholder="Referral Person"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Referral Contact</label>
                  <input
                    type="tel"
                    value={formData.referralContact}
                    onChange={e => setFormData({ ...formData, referralContact: e.target.value })}
                    placeholder="Contact Number"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Recruitment Source</label>
                  <select
                    value={formData.source}
                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Direct Walk-in">Direct Walk-in</option>
                    <option value="Advisor Referral">Advisor Referral</option>
                    <option value="Campus Recruitment">Campus Recruitment</option>
                    <option value="Digital Media Campaign">Digital Media Campaign</option>
                    <option value="Job Portal">Job Portal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Residential Address */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                3. Residential Address
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-300">
                <div className="space-y-1 sm:col-span-4">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Street Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="House / Door No, Street, Landmark"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#1e293b] border-t border-slate-800 shrink-0">
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
            form="edit-candidate-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#0078d4] hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Candidate Details</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
