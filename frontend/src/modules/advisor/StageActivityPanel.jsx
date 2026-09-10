import React from 'react';
import { Check, Edit3, Lock, Upload } from 'lucide-react';

// Keep this outside the panel component.  A component declared inside the
// render function is treated as a new React component after every keystroke,
// which remounts its input and makes the field lose focus.
function StageField({ label, field, type = 'text', options, formData, onChange, readOnly = false, required = false }) {

	return (
		<label className="block">
			<span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
			{options ? (
				<select value={formData[field] || ''} onChange={(e) => onChange?.(field, e.target.value)} className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-blue-500">
					<option value="">Select</option>{options.map(option => <option key={option} value={option}>{option}</option>)}
				</select>
			) : (
				<input type={type} value={formData[field] || ''} readOnly={readOnly} required={required} onChange={(e) => onChange?.(field, e.target.value)} className={`mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-blue-500 ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`} />
			)}
		</label>
	);
}

export default function StageActivityPanel({
	currentStageNumber,
	candidate,
	advisor,
	stageDef,
	formData = {},
	onChange,
	onSubmit,
	isSubmitting,
	isBlocked,
	blockReason,
	onOpenEditModal,
	onOpenConversionModal,
	localUploadedDocs = {},
	candidateDocs = [],
	handleFilePicked
}) {
	if (!stageDef) return null;

	const isCandidateStage = Boolean(candidate) && !advisor;
	const canEditCandidate = isCandidateStage && typeof onOpenEditModal === 'function';
	const canConvert = currentStageNumber === 10 && candidate && typeof onOpenConversionModal === 'function';

	return (
		<section className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-4">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div>
					<div className="flex items-center gap-2">
						<span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
							Milestone {currentStageNumber} Activity Center
						</span>
						{isBlocked && <Lock className="w-3.5 h-3.5 text-rose-400" />}
					</div>
					<h4 className="text-sm font-black text-white mt-1">{stageDef.name}</h4>
					<p className="text-xs text-slate-400 mt-1">{stageDef.purpose}</p>
				</div>

				<div className="flex items-center gap-2">
					{canEditCandidate && (
						<button
							type="button"
							onClick={() => onOpenEditModal(candidate)}
							className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition"
						>
							<Edit3 className="w-3.5 h-3.5" /> Edit Candidate
						</button>
					)}
					{canConvert && (
						<button
							type="button"
							onClick={() => onOpenConversionModal(candidate)}
							className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition"
						>
							Convert to Advisor
						</button>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
					<span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Activities</span>
					<ul className="mt-2 space-y-1.5">
						{stageDef.activities.map((activity) => (
							<li key={activity} className="flex items-start gap-2 text-[11px] text-slate-300">
								<Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
								<span>{activity}</span>
							</li>
						))}
					</ul>
				</div>

				<div className="space-y-3">
					<label className="block">
						<span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Stage Remarks</span>
						<textarea
							rows={4}
							value={formData.remarks || ''}
							onChange={(event) => onChange && onChange('remarks', event.target.value)}
							placeholder="Add completion notes for this stage..."
							className="mt-2 w-full resize-y bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
						/>
					</label>

					{currentStageNumber === 3 && typeof handleFilePicked === 'function' && (
						<div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
							<Upload className="w-4 h-4 text-blue-400 shrink-0" />
							<span>Use the document cards below to upload and confirm required KYC files.</span>
						</div>
					)}
				</div>
			</div>

			{currentStageNumber === 1 && <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><StageField formData={formData} onChange={onChange} label="Meeting date" field="meetingDate" type="date" /><StageField formData={formData} onChange={onChange} label="Meeting time" field="meetingTime" type="time" /><StageField formData={formData} onChange={onChange} label="Meeting venue" field="meetingVenue" /><StageField formData={formData} onChange={onChange} label="Meeting outcome" field="meetingOutcome" options={['Completed', 'Not Attended', 'Rescheduled', 'Cancelled']} /></div>}
			{currentStageNumber === 2 && <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><StageField formData={formData} onChange={onChange} label="Trainee ID" field="traineeId" required /><StageField formData={formData} onChange={onChange} label="Commitment status" field="commitmentStatus" options={['Pending', 'Signed', 'Declined']} /><StageField formData={formData} onChange={onChange} label="Declaration document reference" field="commitmentDocument" /></div>}
			{currentStageNumber === 4 && <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><StageField formData={formData} onChange={onChange} label="Amount" field="amount" type="number" /><StageField formData={formData} onChange={onChange} label="Payment status" field="paymentStatus" options={['Pending', 'Paid']} /><StageField formData={formData} onChange={onChange} label="Payment date" field="paymentDate" type="date" /><StageField formData={formData} onChange={onChange} label="Payment method" field="paymentMethod" options={['Cash', 'Bank', 'UPI', 'Other']} /></div>}
			{currentStageNumber === 7 && <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><StageField formData={formData} onChange={onChange} label="Amount" field="amount" type="number" /><StageField formData={formData} onChange={onChange} label="Payment status" field="paymentStatus" options={['Pending', 'Paid']} /><StageField formData={formData} onChange={onChange} label="Payment date" field="paymentDate" type="date" /><StageField formData={formData} onChange={onChange} label="Payment method" field="paymentMethod" options={['Cash', 'Bank', 'UPI', 'Other']} /></div>}
			{currentStageNumber === 5 && <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><StageField formData={formData} onChange={onChange} label="PRL application status" field="prlApplicationStatus" options={['Pending', 'Applied', 'Completed']} /><StageField formData={formData} onChange={onChange} label="URN Number" field="urnNumber" /><StageField formData={formData} onChange={onChange} label="Application date" field="prlApplicationDate" type="date" /><StageField formData={formData} onChange={onChange} label="Application/reference number" field="prlReference" /></div>}
			{currentStageNumber === 6 && <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><StageField formData={formData} onChange={onChange} label="Enrollment status" field="trainingEnrollmentStatus" options={['Pending', 'Enrolled', 'Active']} /><StageField formData={formData} onChange={onChange} label="Enrollment date" field="trainingEnrollmentDate" type="date" /><StageField formData={formData} onChange={onChange} label="Training batch" field="trainingBatch" /><StageField formData={formData} onChange={onChange} label="Training start date" field="trainingStartDate" type="date" /><StageField formData={formData} onChange={onChange} label="Training end date" field="trainingEndDate" type="date" /></div>}
			{currentStageNumber === 8 && <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><StageField formData={formData} onChange={onChange} label="Exam registration number" field="examRegistrationNumber" /><StageField formData={formData} onChange={onChange} label="Exam registration date" field="examRegistrationDate" type="date" /><StageField formData={formData} onChange={onChange} label="Exam date" field="examDate" type="date" /><StageField formData={formData} onChange={onChange} label="Exam fee" field="amount" type="number" /><StageField formData={formData} onChange={onChange} label="Payment status" field="paymentStatus" options={['Pending', 'Paid']} /><StageField formData={formData} onChange={onChange} label="Payment date" field="paymentDate" type="date" /><StageField formData={formData} onChange={onChange} label="Payment method" field="paymentMethod" options={['Cash', 'Bank', 'UPI', 'Other']} /></div>}
			{currentStageNumber === 9 && <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><StageField formData={formData} onChange={onChange} label="Certification result" field="result" options={['Pending', 'Passed', 'Failed']} /><StageField formData={formData} onChange={onChange} label="Result date" field="resultDate" type="date" /><StageField formData={formData} onChange={onChange} label="Score" field="score" /></div>}
			{currentStageNumber === 10 && <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><StageField formData={formData} onChange={onChange} label="Aynkaran license / advisor code" field="advisorCode" /><StageField formData={formData} onChange={onChange} label="License generated date" field="licenseGeneratedDate" type="date" /><StageField formData={formData} onChange={onChange} label="Advisor status" field="advisorStatus" options={['Pending', 'Active']} /><StageField formData={formData} onChange={onChange} label="Insurance company" field="insuranceCompany" /><StageField formData={formData} onChange={onChange} label="ABP" field="abp" /><StageField formData={formData} onChange={onChange} label="L1 Manager" field="l1Manager" /><StageField formData={formData} onChange={onChange} label="License document reference" field="licenseDocument" /></div>}

			{isBlocked && (
				<p className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
					{blockReason}
				</p>
			)}

			<div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
				<span className="text-[10px] text-slate-500 font-mono">
					{Object.keys(localUploadedDocs).length + candidateDocs.length > 0
						? `${Object.keys(localUploadedDocs).length + candidateDocs.length} document record(s) linked`
						: 'No document records linked'}
				</span>
				<button
					type="button"
					onClick={onSubmit}
					disabled={isSubmitting || isBlocked}
					className="px-4 py-2 bg-[#0078d4] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition"
				>
					{isSubmitting ? 'Saving...' : <><Check className="w-3.5 h-3.5" /> {currentStageNumber === 10 ? 'Complete Final Milestone' : `Complete Milestone ${currentStageNumber}`}</>}
				</button>
			</div>
		</section>
	);
}
