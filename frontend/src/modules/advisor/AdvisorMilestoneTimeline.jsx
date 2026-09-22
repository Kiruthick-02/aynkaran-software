// frontend/src/modules/advisor/AdvisorMilestoneTimeline.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  CheckCircle2, Clock, AlertOctagon, Lock, XCircle, ArrowRight,
  ShieldAlert, Check, FastForward, RotateCcw, Sparkles, UserCheck,
  FileText, Calendar, Award, BookOpen, AlertTriangle, ChevronRight,
  ExternalLink, Info, CheckSquare, ShieldCheck, HelpCircle, X,
  Upload, Eye, Camera, Plus, RefreshCw, Download
} from 'lucide-react';
import { advisorApi } from '../../services/advisorApi';
import { apiService } from '../../services/api';
import { resolveApiUrl } from '../../config/api';
import DocumentPreviewModal from './DocumentPreviewModal';
import StageActivityPanel from './StageActivityPanel';

const resolveDocumentUrl = (value) => {
  return resolveApiUrl(value);
};

// The only milestones displayed in the candidate onboarding console.
const OFFICIAL_10_MILESTONES = [
  ['MEETING_APPOINTMENT', 'Meeting Appointment', 'Schedule the first meeting and dispatch alerts.', ['Set meeting date, time, and venue', 'Use candidate mobile and email from the record', 'Dispatch WhatsApp, SMS, and email alerts', 'Record Completed, Not Attended, Rescheduled, or Cancelled outcome']],
  ['ONBOARDING_COMMITMENT_SIGN', 'Onboarding Commitment Sign', 'Record the candidate commitment to continue.', ['Record Pending, Signed, or Declined status', 'Upload commitment/declaration document when available', 'Only Signed unlocks the next milestone']],
  ['DOSSIER_KYC_COMPLETED', 'Document Scans and KYC Completed', 'Collect and verify mandatory KYC documents.', ['Upload Aadhaar, PAN, photo, bank proof, education certificate, and signature', 'Preview each selected document before confirming', 'Verify all mandatory documents', 'Show missing documents as blocked']],
  ['PRL_VERIFICATION_FEE_CLEARED', 'PRL Verification Fee Cleared', 'Record PRL verification fee payment.', ['Enter  amount', 'Record manual payment status', 'Enter payment date, method, and reference', 'Mark complete only when payment is Paid']],
  ['PRL_APPLICATION_DONE', 'PRL Application Done', 'Record the PRL application.', ['Record PRL application status', 'Enter the manual URN number', 'Enter application date and reference number', 'Upload the PRL application document', 'Record completion remarks']],
  ['IRDAI_PORTALS_TRAINING_ENROLLED', 'Training Enrolled', 'Record IRDAI portal training enrollment.', ['Record enrollment status and date', 'Enter training reference and batch', 'Set training start and end date', 'Record training provider or portal']],
  ['TRAINING_LICENSE_FEE_PAID', 'Training License Fee Paid', 'Record training license fee payment.', ['Enter amount and payment status', 'Record manual payment date and method', 'Enter receipt/reference number', 'Mark complete only when payment is Paid']],
  ['NSEIT_EXAM_REGISTERED', 'Exam Registered', 'Record exam registration and fee payment.', ['Enter registration number and registration date', 'Set exam date and exam center', 'Record exam fee, payment status, date, method, and reference', 'Upload hall ticket or registration document']],
  ['IRDAI_CARRIER_CERTIFICATION_PASSED', 'Exam Passed', 'Record certification result.', ['Record result as Pending, Failed, or Passed', 'Enter result date, certification number, and score', 'Upload certification document', 'Only Passed unlocks final license generation']],
  ['ACTIVE_AYNKARAN_LICENSE_GENERATED', 'Active Aynkaran License Generated', 'Generate the active Aynkaran advisor license/code.', ['Enter Aynkaran license/advisor code', 'Record license generated date and company', 'Assign ABP and L1 Manager where applicable', 'Set advisor status to Active and upload license document']]
].map(([key, name, purpose, activities], index) => ({
  stage: index + 1, key, name, purpose, activities,
  entryCondition: index ? `Milestone ${index} must be completed.` : 'Candidate record exists.',
  completionConditions: 'Explicit staff confirmation is required.',
  nextAction: index === 9 ? 'Onboarding is complete.' : 'Complete this milestone to unlock the next one.',
  transitionRule: 'Later milestones remain locked until this milestone is completed.'
}));

export const STRICT_17_STAGES = [
  {
    stage: 1,
    key: 'CANDIDATE_REGISTERED',
    name: 'Candidate Registered',
    purpose: 'Create the initial advisor candidate record in CRM.',
    activities: [
      'Enter candidate personal information',
      'Enter contact information',
      'Record qualification and occupation',
      'Record referral person details',
      'Record source of candidate',
      'Assign candidate number',
      'Set candidate status to ACTIVE'
    ],
    entryCondition: 'Candidate registration initiated.',
    completionConditions: 'Mandatory candidate info completed, saved, and candidate number generated.',
    nextAction: 'Collect mandatory candidate documents (Passport Photo, Aadhaar, PAN, Passbook, Certificates).',
    transitionRule: 'STAGE 1 → STAGE 2. If mandatory info missing: Remain in STAGE 1.'
  },
  {
    stage: 2,
    key: 'DOCUMENT_COLLECTION',
    name: 'Document Collection',
    purpose: 'Collect all required candidate KYC & educational documents into Document Vault.',
    activities: [
      'Select document type (Passport Photo, Aadhaar, PAN, Passbook, Certificates, Marksheet, Signature)',
      'Upload file and inspect document preview',
      'User confirms using "Confirm & Use File"',
      'Store and link document to candidate record and Document Vault'
    ],
    entryCondition: 'Candidate registered in Stage 1.',
    completionConditions: 'Mandatory documents uploaded and linked to candidate without omissions.',
    nextAction: 'Assign candidate to regulatory advisor training batch and schedule dates.',
    transitionRule: 'STAGE 2 → STAGE 3. If mandatory documents missing: Remain in STAGE 2.'
  },
  {
    stage: 3,
    key: 'TRAINING_SCHEDULED',
    name: 'Training Scheduled',
    purpose: 'Assign the candidate to the required advisor training.',
    activities: [
      'Select training batch',
      'Set training start date and end date',
      'Set venue/mode (Online / Classroom)',
      'Record trainer and batch ID',
      'Assign candidate to training batch'
    ],
    entryCondition: 'Candidate documents collected in Stage 2.',
    completionConditions: 'Candidate assigned to valid training batch with schedule recorded.',
    nextAction: 'Begin training sessions and track daily attendance.',
    transitionRule: 'STAGE 3 → STAGE 4. Generate training schedule reminders (7d, 3d, 1d, 0d).'
  },
  {
    stage: 4,
    key: 'TRAINING_IN_PROGRESS',
    name: 'Training In Progress',
    purpose: 'Track candidate while regulatory training is taking place.',
    activities: [
      'Record daily attendance',
      'Track each training session & module coverage',
      'Record absences or pending attendance',
      'Send date-based training reminders'
    ],
    entryCondition: 'Training start date has arrived.',
    completionConditions: 'Training sessions completed and required attendance condition satisfied.',
    nextAction: 'Issue completion certificate and mark training completed.',
    transitionRule: 'STAGE 4 → STAGE 5. If attendance requirement incomplete: Remain in STAGE 4.'
  },
  {
    stage: 5,
    key: 'TRAINING_COMPLETED',
    name: 'Training Completed',
    purpose: 'Confirm successful completion of training.',
    activities: [
      'Confirm final attendance',
      'Record training completion date',
      'Generate/store completion certificate',
      'Update candidate milestone'
    ],
    entryCondition: '100% attendance & session requirement met in Stage 4.',
    completionConditions: 'Training is officially marked COMPLETED.',
    nextAction: 'Register candidate for the official IRDA examination.',
    transitionRule: 'STAGE 5 → STAGE 6. Do NOT allow examination registration before training completion.'
  },
  {
    stage: 6,
    key: 'EXAM_REGISTRATION',
    name: 'Exam Registration',
    purpose: 'Register the candidate for the advisor examination.',
    activities: [
      'Select examination body / carrier portal',
      'Enter registration details & registration number',
      'Record registration date',
      'Upload registration documents where required'
    ],
    entryCondition: 'Training successfully completed in Stage 5.',
    completionConditions: 'Examination registration is successfully created.',
    nextAction: 'Confirm examination schedule date, time, and exam center.',
    transitionRule: 'STAGE 6 → STAGE 7.'
  },
  {
    stage: 7,
    key: 'EXAM_SCHEDULED',
    name: 'Exam Scheduled',
    purpose: 'Record the candidate confirmed examination schedule.',
    activities: [
      'Set exam date & time',
      'Set exam center location',
      'Record hall ticket information',
      'Save examination schedule and generate reminders'
    ],
    entryCondition: 'Exam registration completed in Stage 6.',
    completionConditions: 'Exam date and required scheduling info present.',
    nextAction: 'Candidate appears for exam at designated center on exam date.',
    transitionRule: 'STAGE 7 → STAGE 8. Automatic reminder dates generated (7d, 3d, 1d, 0d).'
  },
  {
    stage: 8,
    key: 'EXAM_APPEARED',
    name: 'Exam Appeared',
    purpose: 'Record whether the candidate actually appeared for the examination.',
    activities: [
      'Mark APPEARED or ABSENT',
      'Record appearance date',
      'Record exam center attendance details',
      'Store examination evidence / hall ticket'
    ],
    entryCondition: 'Exam date has arrived.',
    completionConditions: 'Examination appearance status is recorded.',
    nextAction: 'Await and record official examination result.',
    transitionRule: 'IF APPEARED: STAGE 8 → STAGE 9. IF ABSENT: Move to configured re-exam process.'
  },
  {
    stage: 9,
    key: 'EXAM_RESULT',
    name: 'Exam Result',
    purpose: 'Record the official examination result.',
    activities: [
      'Enter result (PASS / FAIL / PENDING)',
      'Record marks/score obtained',
      'Record result declaration date',
      'Upload score certificate'
    ],
    entryCondition: 'Candidate appeared for examination in Stage 8.',
    completionConditions: 'Official result recorded (PASS required for progression).',
    nextAction: 'Confirm overall eligibility for Advisor licensing.',
    transitionRule: 'IF PASS: STAGE 9 → STAGE 10. IF FAIL: Re-training / Re-examination (Do NOT create Advisor). IF PENDING: Remain in STAGE 9.'
  },
  {
    stage: 10,
    key: 'ELIGIBILITY_CONFIRMED',
    name: 'Eligibility Confirmed',
    purpose: 'Confirm that the candidate is eligible to become an advisor.',
    activities: [
      'Verify training completion',
      'Verify examination passed',
      'Verify documents collected',
      'Verify candidate not obsolete or already converted'
    ],
    entryCondition: 'Exam result = PASS and all previous prerequisites verified.',
    completionConditions: 'All mandatory eligibility rules satisfied.',
    nextAction: 'Convert candidate into an active Advisor record with unique code.',
    transitionRule: 'STAGE 10 → STAGE 11. If any eligibility condition fails: Remain BLOCKED at STAGE 10.'
  },
  {
    stage: 11,
    key: 'ADVISOR_CREATION',
    name: 'Advisor Creation',
    purpose: 'Convert the eligible candidate into an Advisor record.',
    activities: [
      'Open advisor creation form',
      'Pre-fill eligible candidate details',
      'Assign unique advisor code',
      'Link candidateId to advisor record',
      'Record conversion date and user'
    ],
    entryCondition: 'Candidate confirmed ELIGIBLE in Stage 10.',
    completionConditions: 'Advisor record created without duplicates.',
    nextAction: 'Complete formal IRDAI licensing numbers and validity dates.',
    transitionRule: 'STAGE 11 → STAGE 12. Do NOT create duplicate advisor records.'
  },
  {
    stage: 12,
    key: 'ADVISOR_CODE_DETAILS',
    name: 'Advisor Code & License',
    purpose: 'Complete formal advisor identification and license details.',
    activities: [
      'Confirm unique advisor code',
      'Enter license number',
      'Enter license issue date & expiry date',
      'Upload advisor license/registration document',
      'Validate uniqueness across carrier records'
    ],
    entryCondition: 'Advisor record created in Stage 11.',
    completionConditions: 'Advisor code and license info complete, unique, and valid.',
    nextAction: 'Assign advisor to Assistant Business Partner (ABP).',
    transitionRule: 'STAGE 12 → STAGE 13.'
  },
  {
    stage: 13,
    key: 'ABP_ASSIGNMENT',
    name: 'ABP Assignment',
    purpose: 'Assign the advisor to the appropriate Assistant Business Partner (ABP).',
    activities: [
      'Select ABP sponsor from registered partners',
      'Record assignment date',
      'Record assignment remarks'
    ],
    entryCondition: 'Advisor code and license complete in Stage 12.',
    completionConditions: 'Valid ABP is selected and stored.',
    nextAction: 'Assign advisor to Level-1 Manager under the chosen ABP.',
    transitionRule: 'STAGE 13 → STAGE 14.'
  },
  {
    stage: 14,
    key: 'L1_ASSIGNMENT',
    name: 'L1 Manager Assignment',
    purpose: 'Assign the advisor to the appropriate Level-1 Manager.',
    activities: [
      'Select Level-1 Supervisory Manager',
      'Validate that L1 belongs to selected ABP',
      'Record assignment date and remarks'
    ],
    entryCondition: 'ABP assigned in Stage 13.',
    completionConditions: 'Valid Level-1 Manager selected with verified ABP/L1 hierarchy.',
    nextAction: 'Officially activate advisor in CRM workspace.',
    transitionRule: 'STAGE 14 → STAGE 15. Do NOT allow invalid ABP/L1 combination.'
  },
  {
    stage: 15,
    key: 'ADVISOR_ACTIVATION',
    name: 'Advisor Activation',
    purpose: 'Make the advisor officially ACTIVE in the system.',
    activities: [
      'Verify candidate conversion, code, license, hierarchy, documents',
      'Set advisor status = ACTIVE',
      'Record activation date and activated-by user'
    ],
    entryCondition: 'Stages 1 through 14 complete with no blocking conditions.',
    completionConditions: 'Advisor status successfully changed to ACTIVE.',
    nextAction: 'Advisor is active and ready to book policy sales and onboard customers.',
    transitionRule: 'STAGE 15 → STAGE 16.'
  },
  {
    stage: 16,
    key: 'POLICY_BUSINESS',
    name: 'Customer & Policy Business',
    purpose: 'Track business generated by the active advisor.',
    activities: [
      'Associate customers with advisor',
      'Associate policies with advisor',
      'Track policy numbers, carriers, schemes, premium, renewals, commissions',
      'Update advisor statistics automatically'
    ],
    entryCondition: 'Advisor is ACTIVE in Stage 15.',
    completionConditions: 'Policies and customers booked and active.',
    nextAction: 'Continuously monitor commission earnings, renewals, and KPI growth.',
    transitionRule: 'STAGE 16 → STAGE 17. Ongoing operational stage.'
  },
  {
    stage: 17,
    key: 'COMMISSION_PERFORMANCE',
    name: 'Commission & Performance',
    purpose: 'Continuously monitor the advisor after activation.',
    activities: [
      'Calculate and display commission earnings & disbursements',
      'Track monthly and annual performance metrics',
      'Monitor policy renewals and retention rate',
      'Monitor license expiry (60d, 30d, 7d alerts)',
      'Generate advisor production reports'
    ],
    entryCondition: 'Advisor actively managing customer policies.',
    completionConditions: 'Continuous operational monitoring while advisor is active.',
    nextAction: 'Ongoing lifecycle management (status changes handled via Status Management).',
    transitionRule: 'Continuous stage. Advisor remains in Stage 17 while active.'
  }
];

export const REQUIRED_KYC_TYPES = [
  { key: 'Passport Size Photo', name: 'Passport-Size Photo / Profile Icon', required: true, icon: Camera },
  { key: 'Aadhaar Card (Front Side)', name: 'Aadhaar Card (Front Side)', required: true, icon: FileText },
  { key: 'Aadhaar Card (Back Side)', name: 'Aadhaar Card (Back Side)', required: true, icon: FileText },
  { key: 'PAN Card copy', name: 'PAN Card Copy', required: true, icon: FileText },
  { key: 'Bank Proof', name: 'Bank Passbook / Cancelled Cheque', required: true, icon: FileText },
  { key: 'Education Certificate', name: 'Highest Education Certificate / Marksheet', required: true, icon: Award },
  { key: 'Signature', name: 'Signature Specimen', required: false, icon: FileText }
];

export default function AdvisorMilestoneTimeline({
  candidate,
  advisor,
  onProgressMilestone,
  onOpenConversionModal,
  onOpenEditCandidateModal,
  onShowNotification
}) {
  const [selectedStageForModal, setSelectedStageForModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionRemarks, setActionRemarks] = useState('');
  const [stageFormData, setStageFormData] = useState({});
  const [pendingExamDecision, setPendingExamDecision] = useState(null);
  const [isDispatchingMeeting, setIsDispatchingMeeting] = useState(false);
  const [meetingDispatchResult, setMeetingDispatchResult] = useState(null);

  // Document upload state
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('');
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [existingDocPreview, setExistingDocPreview] = useState(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [localUploadedDocs, setLocalUploadedDocs] = useState({});
  const [isStageThreeDocumentsOpen, setIsStageThreeDocumentsOpen] = useState(false);

  // Local state for current stage number (ensures instant responsive UI transitions)
  const [currentStageNumber, setCurrentStageNumber] = useState(() => {
    if (advisor) return 10;
    return candidate?.stageNumber ? Math.min(Math.max(Number(candidate.stageNumber), 1), 10) : 1;
  });

  useEffect(() => {
    if (advisor) {
      setCurrentStageNumber(10);
    } else if (candidate) {
      const stg = Number(candidate.stageNumber) || 1;
      setCurrentStageNumber(Math.min(Math.max(stg, 1), 10));

      // Sync existing candidate & advisor documents
      const map = {};
      const collectDocs = (sourceObj) => {
        if (!sourceObj) return [];
        if (Array.isArray(sourceObj.documents)) return sourceObj.documents;
        if (typeof sourceObj.documents === 'string' && sourceObj.documents.trim()) {
          try {
            const parsed = JSON.parse(sourceObj.documents);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      const allDocs = [...collectDocs(candidate), ...collectDocs(advisor)];
      allDocs.forEach(d => {
        if (d && (d.category || d.name)) {
          map[d.category || d.name] = d;
        }
      });

      const cand = candidate || {};
      const adv = advisor || {};

      const photoPath = cand.photoUrl || cand.profilePicture || cand.passportPhoto || adv.photoUrl || adv.profilePicture || adv.passportPhoto;
      if (photoPath) {
        map['Passport Size Photo'] = {
          name: cand.photoFileName || adv.photoFileName || 'Passport Size Photo',
          fileName: cand.photoFileName || adv.photoFileName || 'Passport Size Photo',
          url: photoPath,
          path: photoPath,
          verificationStatus: 'PENDING'
        };
      }

      const aadhaarFrontPath = cand.aadhaarFrontUrl || cand.aadhaarFrontFile || adv.aadhaarFrontUrl || adv.aadhaarFrontFile;
      const aadhaarFrontName = cand.aadhaarFrontFileName || adv.aadhaarFrontFileName || 'Aadhaar Card (Front Side)';
      const aadhaarBackPath = cand.aadhaarBackUrl || cand.aadhaarBackFile || adv.aadhaarBackUrl || adv.aadhaarBackFile;
      const aadhaarBackName = cand.aadhaarBackFileName || adv.aadhaarBackFileName || 'Aadhaar Card (Back Side)';
      const aadhaarLegacyPath = cand.aadhaarUrl || cand.aadhaarFile || adv.aadhaarUrl || adv.aadhaarFile;
      const aadhaarLegacyName = cand.aadhaarFileName || adv.aadhaarFileName || 'Aadhaar Card (Front Side)';

      if (aadhaarFrontPath) {
        map['Aadhaar Card (Front Side)'] = {
          name: aadhaarFrontName,
          fileName: aadhaarFrontName,
          url: aadhaarFrontPath,
          path: aadhaarFrontPath,
          verificationStatus: 'PENDING'
        };
      } else if (aadhaarLegacyPath) {
        map['Aadhaar Card (Front Side)'] = {
          name: aadhaarLegacyName,
          fileName: aadhaarLegacyName,
          url: aadhaarLegacyPath,
          path: aadhaarLegacyPath,
          verificationStatus: 'PENDING'
        };
      }

      if (aadhaarBackPath) {
        map['Aadhaar Card (Back Side)'] = {
          name: aadhaarBackName,
          fileName: aadhaarBackName,
          url: aadhaarBackPath,
          path: aadhaarBackPath,
          verificationStatus: 'PENDING'
        };
      }

      const panPath = cand.panUrl || cand.panFile || adv.panUrl || adv.panFile;
      if (panPath) {
        map['PAN Card copy'] = {
          name: cand.panFileName || adv.panFileName || 'PAN Card copy',
          fileName: cand.panFileName || adv.panFileName || 'PAN Card copy',
          url: panPath,
          path: panPath,
          verificationStatus: 'PENDING'
        };
      }

      const bankPath = cand.bankProofUrl || cand.bankProofFile || adv.bankProofUrl || adv.bankProofFile;
      if (bankPath) {
        map['Bank Proof'] = {
          name: cand.bankProofFileName || adv.bankProofFileName || 'Bank Passbook / Cancelled Cheque',
          fileName: cand.bankProofFileName || adv.bankProofFileName || 'Bank Passbook / Cancelled Cheque',
          url: bankPath,
          path: bankPath,
          verificationStatus: 'PENDING'
        };
      }

      const marksheetPath = cand.marksheetUrl || cand.marksheetFile || adv.marksheetUrl || adv.marksheetFile;
      if (marksheetPath) {
        map['Education Certificate'] = {
          name: cand.marksheetFileName || adv.marksheetFileName || 'Highest Education Certificate / Marksheet',
          fileName: cand.marksheetFileName || adv.marksheetFileName || 'Highest Education Certificate / Marksheet',
          url: marksheetPath,
          path: marksheetPath,
          verificationStatus: 'PENDING'
        };
      }

      const signaturePath = cand.signatureUrl || cand.signatureFile || adv.signatureUrl || adv.signatureFile;
      if (signaturePath) {
        map['Signature'] = {
          name: cand.signatureFileName || adv.signatureFileName || 'Signature Specimen',
          fileName: cand.signatureFileName || adv.signatureFileName || 'Signature Specimen',
          url: signaturePath,
          path: signaturePath,
          verificationStatus: 'PENDING'
        };
      }
      setLocalUploadedDocs(map);

      // Initialize stage form data with candidate records and smart defaults
      const existingStageData = candidate.stageData?.[stg] || {};
      setStageFormData(prev => ({
        traineeId: candidate.traineeId || existingStageData.traineeId || '',
        // Stage 3 defaults
        trainingBatch: candidate.trainingBatch || existingStageData.trainingBatch || `BATCH-${new Date().getFullYear()}-01`,
        trainingStartDate: candidate.trainingStartDate || existingStageData.trainingStartDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        trainingEndDate: candidate.trainingEndDate || existingStageData.trainingEndDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        trainingMode: candidate.trainingMode || existingStageData.trainingMode || 'Classroom (Branch Center)',
        trainerName: candidate.trainerName || existingStageData.trainerName || 'M. Ramanathan (Senior Master Trainer)',
        trainingVenue: candidate.trainingVenue || existingStageData.trainingVenue || 'Aynkaran Training Center, Chennai',
        trainingHours: candidate.trainingHours || existingStageData.trainingHours || '25 Hours',

        // Stage 4 defaults
        trainingAttendanceHours: candidate.trainingAttendanceHours || existingStageData.trainingAttendanceHours || '25',
        trainingAttendancePercent: candidate.trainingAttendancePercent || existingStageData.trainingAttendancePercent || '100',
        trainingProgressStatus: candidate.trainingProgressStatus || existingStageData.trainingProgressStatus || 'In Progress',
        trainingNotes: candidate.trainingNotes || existingStageData.trainingNotes || 'All 25 hours regulatory syllabus covered satisfactorily.',

        // Stage 5 defaults
        trainingCompletionDate: candidate.trainingCompletionDate || existingStageData.trainingCompletionDate || new Date().toISOString().split('T')[0],
        finalAttendancePercent: candidate.finalAttendancePercent || existingStageData.finalAttendancePercent || '100%',
        trainingCertificateNo: candidate.trainingCertificateNo || existingStageData.trainingCertificateNo || `CERT-TR-${Date.now().toString().slice(-5)}`,

        // Stage 6 defaults
        examBody: candidate.examBody || existingStageData.examBody || 'Limited (IRDAI Testing Partner)',
        examRegNumber: candidate.examRegNumber || existingStageData.examRegNumber || '',
        urnNumber: candidate.urnNumber || existingStageData.urnNumber || '',
        examFeeStatus: candidate.examFeeStatus || existingStageData.examFeeStatus || 'Paid',
        examFeeRef: candidate.examFeeRef || existingStageData.examFeeRef || `UPI/TXN/${Date.now().toString().slice(-6)}`,
        targetExamWindow: candidate.targetExamWindow || existingStageData.targetExamWindow || new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],

        // Stage 7 defaults
        examScheduleDate: candidate.examScheduleDate || existingStageData.examScheduleDate || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        examScheduleTime: candidate.examScheduleTime || existingStageData.examScheduleTime || '10:30 AM',
        examCenter: candidate.examCenter || existingStageData.examCenter || 'NSEIT Examination Center, Mount Road, Chennai',
        hallTicketNumber: candidate.hallTicketNumber || existingStageData.hallTicketNumber || `HT-${Date.now().toString().slice(-6)}`,

        // Stage 8 defaults
        examAppearedDate: candidate.examAppearedDate || existingStageData.examAppearedDate || new Date().toISOString().split('T')[0],
        examAppearedStatus: candidate.examAppearedStatus || existingStageData.examAppearedStatus || 'Appeared',
        invigilatorRef: candidate.invigilatorRef || existingStageData.invigilatorRef || 'TERMINAL-LAB-04',

        // Stage 9 defaults
        result: candidate.result || existingStageData.result || candidate.examResultStatus || '',
        score: candidate.score || existingStageData.score || candidate.examScore || '',
        resultDate: candidate.resultDate || existingStageData.resultDate || candidate.examResultDate || '',
        examScore: candidate.examScore || existingStageData.examScore || '38 / 50',
        examResultStatus: candidate.examResultStatus || existingStageData.examResultStatus || candidate.result || 'Pass',
        examResultDate: candidate.examResultDate || existingStageData.examResultDate || new Date().toISOString().split('T')[0],

        // Stage 10 defaults
        eligibilityStatus: candidate.eligibilityStatus || existingStageData.eligibilityStatus || 'Eligible',
        backgroundClearance: candidate.backgroundClearance || existingStageData.backgroundClearance || 'Clear / Verified',
        complianceSignoff: candidate.complianceSignoff || existingStageData.complianceSignoff || 'Approved by Agency Compliance Dept.',

        // Stage 12 defaults
        licenseNumber: candidate.licenseNumber || existingStageData.licenseNumber || `IRDA/AG/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`,
        licenseIssueDate: candidate.licenseIssueDate || existingStageData.licenseIssueDate || new Date().toISOString().split('T')[0],
        licenseExpiryDate: candidate.licenseExpiryDate || existingStageData.licenseExpiryDate || new Date(Date.now() + 86400000 * 365 * 3).toISOString().split('T')[0],
        assignedAdvisorCode: candidate.advisorCode || existingStageData.assignedAdvisorCode || `ADV-${Date.now().toString().slice(-4)}`,

        // Stage 13 defaults
        assignedAbpName: candidate.abpName || existingStageData.assignedAbpName || 'Suresh Babu',
        abpTerritory: candidate.abpTerritory || existingStageData.abpTerritory || 'Chennai South & Central',
        abpEffectiveDate: candidate.abpEffectiveDate || existingStageData.abpEffectiveDate || new Date().toISOString().split('T')[0],

        // Stage 14 defaults
        assignedL1Name: candidate.level1ManagerName || existingStageData.assignedL1Name || 'Karthik M.',
        branchOffice: candidate.branchOffice || existingStageData.branchOffice || 'Aynkaran Mount Road Main Branch',
        l1EffectiveDate: candidate.l1EffectiveDate || existingStageData.l1EffectiveDate || new Date().toISOString().split('T')[0],

        // Stage 15 defaults
        welcomeKitSent: candidate.welcomeKitSent || existingStageData.welcomeKitSent || 'Dispatched',
        credentialsCreated: candidate.credentialsCreated || existingStageData.credentialsCreated || 'Active & Dispatched',
        advisorActiveDate: candidate.advisorActiveDate || existingStageData.advisorActiveDate || new Date().toISOString().split('T')[0],

        // Stage 16 defaults
        firstPolicyNumber: candidate.firstPolicyNumber || existingStageData.firstPolicyNumber || `POL-SBI-${Date.now().toString().slice(-4)}`,
        firstCustomerName: candidate.firstCustomerName || existingStageData.firstCustomerName || 'Muruganandam K.',
        firstPremiumAmount: candidate.firstPremiumAmount || existingStageData.firstPremiumAmount || '₹25,000',
        sourcingDate: candidate.sourcingDate || existingStageData.sourcingDate || new Date().toISOString().split('T')[0],

        // Stage 17 defaults
        annualTarget: candidate.annualTarget || existingStageData.annualTarget || '₹10,00,000',
        closedPoliciesCount: candidate.closedPoliciesCount || existingStageData.closedPoliciesCount || '1',
        totalPremiumSourced: candidate.totalPremiumSourced || existingStageData.totalPremiumSourced || '₹25,000',
        commissionEarned: candidate.commissionEarned || existingStageData.commissionEarned || '₹3,750',

        ...prev,
        ...existingStageData
      }));
    }
  }, [candidate, advisor]);

  const currentStageDef = OFFICIAL_10_MILESTONES.find(s => s.stage === currentStageNumber) || OFFICIAL_10_MILESTONES[0];

  // Evaluate blocking conditions on current stage
  let isBlocked = false;
  let blockReason = null;

  if (candidate) {
    if (currentStageNumber === 6 && candidate.trainingStatus !== 'Completed') {
      isBlocked = true;
      blockReason = 'Training completion is mandatory before Exam Registration. Complete Stage 5 first.';
    } else if (currentStageNumber === 9 && (candidate.examStatus === 'Failed' || candidate.result === 'Fail')) {
      isBlocked = true;
      blockReason = 'Exam Result recorded as FAIL. Candidate must re-train and re-appear for examination.';
    } else if (currentStageNumber === 10 && (candidate.trainingStatus !== 'Completed' || (candidate.examStatus !== 'Passed' && candidate.result !== 'Pass'))) {
      isBlocked = true;
      blockReason = 'Eligibility criteria incomplete: Both 100% Training Completion and Exam PASS are required.';
    }
  }

  // Handle stage completion
  const handleAdvanceCurrentStage = async () => {
    if (!candidate && !advisor) return;
    if (isBlocked) {
      if (onShowNotification) onShowNotification(`Cannot advance: ${blockReason}`);
      return;
    }

    if (currentStageNumber === 11 && onOpenConversionModal && candidate && !candidate.isConvertedToAdvisor) {
      onOpenConversionModal(candidate);
      return;
    }

    if (currentStageNumber === 2 && !String(stageFormData.traineeId || '').trim()) {
      onShowNotification?.('Enter the Trainee ID before completing Stage 2.');
      return;
    }

    if (currentStageNumber === 9) {
      const result = String(stageFormData.result || '').toLowerCase();
      if (!['passed', 'failed', 'pass', 'fail'].includes(result)) {
        onShowNotification?.('Select Passed or Failed before completing the certification result.');
        return;
      }
      if (result === 'failed' || result === 'fail') {
        setPendingExamDecision({ resultData: { ...stageFormData }, failedAt: new Date().toISOString() });
        return;
      }
    }

    const stageToComplete = currentStageNumber;
    const nextStage = Math.min(stageToComplete + 1, 10);

    // Immediately advance UI stage number
    setCurrentStageNumber(nextStage);
    setIsSubmitting(true);

    try {
      const targetId = advisor?.id || candidate?.id;
      const payload = {
        stageNumber: stageToComplete,
        status: 'COMPLETED',
        completedDate: new Date().toISOString().split('T')[0],
        remarks: actionRemarks.trim() || `Completed Stage ${stageToComplete}: ${currentStageDef.name}`,
        stageData: stageFormData
      };

      await advisorApi.updateAdvisorMilestone(targetId, stageToComplete, payload);

      if (onProgressMilestone) {
        await onProgressMilestone(stageToComplete, nextStage, currentStageDef.name, payload);
      }

      if (onShowNotification) {
        onShowNotification(`Stage ${stageToComplete} (${currentStageDef.name}) completed! Moved to Stage ${nextStage}.`);
      }
      setActionRemarks('');
      setStageFormData({});
    } catch (err) {
      console.error('[Advance Milestone Error]', err);
      if (onShowNotification) onShowNotification(`Failed to advance stage: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalizeFailedExamDecision = async (decision) => {
    if (!candidate || !pendingExamDecision) return;
    setIsSubmitting(true);
    const decisionDate = new Date().toISOString();
    const existingHistory = Array.isArray(candidate.examDecisionHistory) ? candidate.examDecisionHistory : [];
    const attempt = existingHistory.length + 1;
    const decisionRecord = {
      attempt,
      result: 'Failed',
      score: pendingExamDecision.resultData.score || '',
      resultDate: pendingExamDecision.resultData.resultDate || decisionDate.split('T')[0],
      decision,
      decisionDate
    };
    const updatedCandidateFields = {
      examDecision: decision,
      examDecisionDate: decisionDate,
      examDecisionHistory: [...existingHistory, decisionRecord],
      examRetakeCount: decision === 'RETAKE' ? Number(candidate.examRetakeCount || 0) + 1 : Number(candidate.examRetakeCount || 0),
      result: 'Fail',
      examStatus: 'Failed',
      stageData: {
        ...(candidate.stageData || {}),
        9: pendingExamDecision.resultData,
        examDecision: decision,
        examDecisionDate: decisionDate,
        examDecisionHistory: [...existingHistory, decisionRecord]
      }
    };
    const nextStage = decision === 'RETAKE' ? 8 : 10;
    if (decision === 'TERMINATE') {
      updatedCandidateFields.currentStage = 'Trainee Terminated - Exam Failed';
      updatedCandidateFields.onboardingStatus = 'TERMINATED';
      updatedCandidateFields.terminationReason = 'Failed certification exam';
      updatedCandidateFields.terminatedAt = decisionDate;
    }
    try {
      await advisorApi.updateAdvisorMilestone(candidate.id, 9, {
        stageNumber: 9,
        status: decision === 'RETAKE' ? 'FAILED_RETAKE' : 'FAILED_TERMINATED',
        completedDate: decisionDate.split('T')[0],
        remarks: `Certification failed. Decision: ${decision}.`,
        stageData: updatedCandidateFields.stageData
      });
      await onProgressMilestone?.(9, nextStage, decision === 'RETAKE' ? 'NSEIT Exam Registered - Retake Required' : 'Trainee Terminated - Exam Failed', {
        stageData: updatedCandidateFields.stageData,
        ...updatedCandidateFields
      });
      setCurrentStageNumber(nextStage);
      setPendingExamDecision(null);
      setStageFormData({});
      onShowNotification?.(decision === 'RETAKE' ? 'Exam failure recorded. Candidate moved back to Stage 8 for a retake.' : 'Exam failure recorded. Trainee was terminated.');
    } catch (err) {
      onShowNotification?.(`Unable to save exam decision: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignMeetingAppointment = async () => {
    const { meetingDate, meetingTime, meetingVenue } = stageFormData;
    if (!meetingDate || !meetingTime || !meetingVenue) {
      onShowNotification?.('Enter the meeting date, time, and venue before dispatching alerts.');
      return;
    }
    setIsDispatchingMeeting(true);
    try {
      const description = `Meeting scheduled for ${meetingDate} at ${meetingTime}. Venue: ${meetingVenue}.`;
      const reminder = await apiService.createReminder({
        title: 'Meeting Appointment Reminder',
        description,
        dueDate: meetingDate,
        targetDate: meetingDate,
        targetId: candidate.id,
        targetType: 'recruitment',
        candidateId: candidate.id,
        customerMobile: candidate.mobile,
        customerEmail: candidate.email,
        channels: { whatsapp: Boolean(candidate.mobile), sms: Boolean(candidate.mobile), email: Boolean(candidate.email) },
        completed: false
      });
      await apiService.updateCandidate(candidate.id, {
        appointmentDate: meetingDate,
        appointmentTime: meetingTime,
        appointmentVenue: meetingVenue
      });
      setMeetingDispatchResult(reminder.deliveryStatus || { whatsapp: candidate.mobile ? 'SENT' : 'NO MOBILE', sms: candidate.mobile ? 'SENT' : 'NO MOBILE', email: candidate.email ? 'SENT' : 'NO EMAIL' });
      onShowNotification?.('Meeting reminder created and notification delivery was requested.');
    } catch (err) {
      setMeetingDispatchResult({ whatsapp: 'FAILED', sms: 'FAILED', email: 'FAILED' });
      onShowNotification?.(`Unable to dispatch meeting alerts: ${err.message}`);
    } finally {
      setIsDispatchingMeeting(false);
    }
  };

  // Handle file picked for Stage 2 KYC
  const handleFilePicked = (e, categoryKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedUploadFile(file);
    setUploadCategory(categoryKey);
    setShowDocPreview(true);
    e.target.value = '';
  };

  // Confirm document upload
  const handleConfirmDocUpload = async (file, category) => {
    const targetId = advisor?.id || candidate?.id;
    if (!targetId) return;

    setIsUploadingDoc(true);
    try {
      const uploadRes = await advisorApi.uploadAdvisorDocument(
        file,
        category,
        targetId,
        advisor ? 'advisor' : 'candidate'
      );

      const docObj = uploadRes.document || {
        id: `doc-${Date.now()}`,
        name: file.name,
        fileName: file.name,
        category,
        path: uploadRes.url || uploadRes.path,
        url: uploadRes.url || uploadRes.path,
        verificationStatus: 'PENDING',
        uploadedAt: new Date().toISOString()
      };

      setLocalUploadedDocs(prev => ({
        ...prev,
        [category]: docObj
      }));

      if (onShowNotification) {
        onShowNotification(`${category} uploaded and synced with Document Vault!`);
      }

      setShowDocPreview(false);
      setSelectedUploadFile(null);

      // Refresh candidate/advisor state in parent console
      if (onProgressMilestone) {
        await onProgressMilestone(currentStageNumber, currentStageNumber, currentStageDef.name, {
          uploadedDocument: docObj,
          category
        });
      }
    } catch (err) {
      console.error('[Document Upload Error]', err);
      if (onShowNotification) onShowNotification(`Upload failed: ${err.message}`);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const completedCount = currentStageNumber > 10 ? 10 : currentStageNumber - 1;
  const progressPercent = Math.round((completedCount / 10) * 100);

  const candidateDocs = Array.isArray(candidate?.documents) ? candidate.documents : [];
  const candidateAvatar = candidate?.photoUrl || candidate?.profilePicture || candidate?.passportPhoto || null;

  return (
    <div className="relative space-y-6" id="onboarding-milestone-pipeline">
      {/* 1. Header Progress & Stage Banner */}
      <div className="p-6 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-blue-500/30 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Candidate / Advisor Profile Icon */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                  {candidateAvatar ? (
                    <img
                      src={candidateAvatar}
                      alt={candidate?.name || advisor?.fullName || 'Profile'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-black text-white font-mono">
                      {(candidate?.name || advisor?.fullName || 'A').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold">
                ✓
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
                  Onboarding Milestone Progress
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {progressPercent}% Complete ({completedCount} of 10 Milestones)
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                <span>Current: Stage {currentStageNumber} — {currentStageDef.name}</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentStageNumber === 11 && candidate && !candidate.isConvertedToAdvisor && (
              <button
                type="button"
                onClick={() => onOpenConversionModal && onOpenConversionModal(candidate)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Convert to Advisor</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAdvanceCurrentStage}
              disabled={isSubmitting || isBlocked}
              className="px-4 py-2.5 bg-[#0078d4] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-900/30 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Advancing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{currentStageNumber === 10 ? 'Complete Final Milestone' : `Complete Milestone ${currentStageNumber} & Proceed`}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Blocking Alert (if blocked) */}
        {isBlocked && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/40 rounded-2xl flex items-start gap-3 text-xs text-rose-300 animate-shake">
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-300 uppercase tracking-wide">Stage Transition Blocked</p>
              <p className="text-[11px] text-rose-200 mt-0.5">{blockReason}</p>
            </div>
          </div>
        )}

        {/* Active Stage Details Summary */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Purpose & Next Action:</span>
            <p className="text-slate-200 font-medium mt-0.5">{currentStageDef.purpose}</p>
            <p className="text-blue-400 font-semibold mt-1">👉 Next: {currentStageDef.nextAction}</p>
          </div>

          <div className="text-[11px] text-slate-400 font-mono shrink-0">
            Rule: <span className="text-slate-300">{currentStageDef.transitionRule}</span>
          </div>
        </div>
      </div>

      {currentStageNumber === 1 && (
        <section className="p-5 bg-[#1e293b] border border-blue-500/40 rounded-3xl shadow-xl space-y-4">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Meeting Appointment Reminder</h4>
            <p className="text-xs text-slate-400 mt-1">Set the confirmed meeting schedule before completing this milestone.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Meeting date<input type="date" min="1900-01-01" max="2099-12-31" value={stageFormData.meetingDate || ''} onChange={(e) => setStageFormData(prev => ({ ...prev, meetingDate: e.target.value }))} className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500" /></label>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Meeting time<input type="time" value={stageFormData.meetingTime || ''} onChange={(e) => setStageFormData(prev => ({ ...prev, meetingTime: e.target.value }))} className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500" /></label>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Meeting venue<input value={stageFormData.meetingVenue || ''} onChange={(e) => setStageFormData(prev => ({ ...prev, meetingVenue: e.target.value }))} placeholder="Office / venue" className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500" /></label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={handleAssignMeetingAppointment} disabled={isDispatchingMeeting} className="px-4 py-2.5 bg-[#0078d4] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-black">{isDispatchingMeeting ? 'Dispatching Alerts...' : 'Assign Date & Dispatch Alerts'}</button>
            {meetingDispatchResult && <span className="text-[11px] text-emerald-300">WhatsApp: {meetingDispatchResult.whatsapp} · SMS: {meetingDispatchResult.sms} · Email: {meetingDispatchResult.email}</span>}
          </div>
        </section>
      )}

      {candidate && currentStageNumber !== 3 && (
        <div className="flex justify-end">
          <button type="button" onClick={() => setIsStageThreeDocumentsOpen(open => !open)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider">
            {isStageThreeDocumentsOpen ? 'Close Stage 3 Documents' : 'Open Stage 3 Documents'}
          </button>
        </div>
      )}

      {/* Stage 3 document hub stays available throughout recruitment. */}
      {(currentStageNumber === 3 || isStageThreeDocumentsOpen) && candidate && (
        <div className="p-6 bg-[#1e293b] border border-blue-500/40 rounded-3xl shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Stage 3: Candidate KYC Documents Collection Hub
                </h4>
                <p className="text-xs text-slate-400">
                  Upload documents here. All uploaded files are automatically stored in the <strong>Consolidated Document Vault</strong> and linked to the candidate.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {REQUIRED_KYC_TYPES.map(kyc => {
              const matchedDoc = localUploadedDocs[kyc.key] || candidateDocs.find(
                d => (d.category || '').toLowerCase().includes(kyc.key.toLowerCase().split(' ')[0]) ||
                     (d.name || '').toLowerCase().includes(kyc.key.toLowerCase().split(' ')[0])
              );
              const isUploaded = !!matchedDoc;
              const isVerified = matchedDoc?.verificationStatus === 'VERIFIED';
              const isRejected = matchedDoc?.verificationStatus === 'REJECTED';

              const Icon = kyc.icon;

              return (
                <div
                  key={kyc.key}
                  className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition ${
                    isUploaded
                      ? 'bg-slate-900 border-slate-700 text-white shadow'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isUploaded ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-500'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white leading-tight">{kyc.name}</h5>
                        <span className="text-[10px] font-mono text-slate-500">
                          {kyc.required ? 'Mandatory' : 'Optional'}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      isVerified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      isRejected ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      isUploaded ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-slate-800 text-slate-500'
                    }`}>
                      {isVerified ? 'Verified' : isRejected ? 'Rejected' : isUploaded ? 'Uploaded' : 'Not Uploaded'}
                    </span>
                  </div>

                  {isUploaded && (
                    <div className="text-[11px] font-mono text-slate-300 truncate bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                      <span className="truncate max-w-[180px]">{matchedDoc.fileName || matchedDoc.name}</span>
                      {(matchedDoc.url || matchedDoc.path) && (
                        <button
                          type="button"
                          onClick={(event) => {
                            setExistingDocPreview(matchedDoc);
                          }}
                          className="text-blue-400 hover:text-blue-300 ml-1 p-0.5"
                          title="View document file"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition shadow">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploaded ? 'Replace File' : 'Upload File'}</span>
                      <input
                        type="file"
                        onChange={(e) => handleFilePicked(e, kyc.key)}
                        className="hidden"
                        accept="image/*,application/pdf"
                      />
                    </label>

                    {isUploaded && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ready
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current milestone activities and action fields must be available for every milestone. */}
      {currentStageNumber < 10 && <StageActivityPanel
        currentStageNumber={currentStageNumber}
        candidate={candidate}
        advisor={advisor}
        stageDef={currentStageDef}
        formData={stageFormData}
        onChange={(field, val) => setStageFormData(prev => ({ ...prev, [field]: val }))}
        onSubmit={handleAdvanceCurrentStage}
        isSubmitting={isSubmitting}
        isBlocked={isBlocked}
        blockReason={blockReason}
        onOpenEditModal={onOpenEditCandidateModal}
        onOpenConversionModal={onOpenConversionModal}
        localUploadedDocs={localUploadedDocs}
        candidateDocs={candidateDocs}
        handleFilePicked={handleFilePicked}
      />}

      {/* 3. Interactive 17-Stage Step Grid */}
      <div className="p-6 bg-[#1e293b] border border-slate-800 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>Official 10-Milestone Onboarding Progression</span>
          </h4>
          <span className="text-[10px] text-slate-500 font-mono">Click any stage to inspect complete details</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {OFFICIAL_10_MILESTONES.map((s) => {
            const isCurrent = s.stage === currentStageNumber;
            const isCompleted = s.stage < currentStageNumber;
            const isPending = s.stage > currentStageNumber;

            return (
              <div
                key={s.stage}
                onClick={() => setSelectedStageForModal(s)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group ${
                  isCurrent
                    ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                    : isCompleted
                    ? 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                    : 'bg-slate-900/40 border-slate-800/80 opacity-70 hover:opacity-100 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-black ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow'
                          : isCompleted
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.stage}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white tracking-tight leading-tight group-hover:text-blue-400 transition">
                        {s.name}
                      </h5>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      isCurrent
                        ? 'bg-blue-500 text-white animate-pulse font-mono'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono'
                        : 'bg-slate-800 text-slate-500 font-mono'
                    }`}
                  >
                    {isCurrent ? 'Current' : isCompleted ? 'Completed' : 'Pending'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {s.purpose}
                </p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Entry: {s.entryCondition.slice(0, 22)}...</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Single Stage Inspection Modal */}
      {selectedStageForModal && typeof document !== 'undefined' && ReactDOM.createPortal((
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] bg-[#0f172a] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 bg-[#1e293b] border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-mono font-bold">
                  {selectedStageForModal.stage}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Stage {selectedStageForModal.stage} — {selectedStageForModal.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Key: {selectedStageForModal.key}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStageForModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-1 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Purpose:</span>
                <p className="text-slate-200 text-xs leading-relaxed">{selectedStageForModal.purpose}</p>
              </div>

              <div className="space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Activities to be Completed:</span>
                <ul className="space-y-1.5 text-slate-300">
                  {selectedStageForModal.activities.map((act, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Entry Condition:</span>
                  <p className="text-slate-300">{selectedStageForModal.entryCondition}</p>
                </div>
                <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Completion Condition:</span>
                  <p className="text-slate-300">{selectedStageForModal.completionConditions}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Transition Rule:</span>
                <p className="text-slate-300 font-mono">{selectedStageForModal.transitionRule}</p>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#1e293b] border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStageForModal(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {pendingExamDecision && typeof document !== 'undefined' && ReactDOM.createPortal((
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0f172a] border border-rose-500/40 rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-5 bg-[#1e293b] border-b border-slate-800">
              <h3 className="text-base font-black text-white">Certification Exam Failed</h3>
              <p className="mt-1 text-xs text-slate-400">Choose what should happen to this trainee. This decision will be saved in the recruitment report.</p>
            </div>
            <div className="p-6 space-y-3">
              <button
                type="button"
                onClick={() => finalizeFailedExamDecision('RETAKE')}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-left text-xs font-bold text-blue-200 hover:bg-blue-500/20 disabled:opacity-50"
              >
                Retake Exam
                <span className="mt-1 block text-[10px] font-normal text-slate-400">Record the failure and move the trainee back to Stage 8.</span>
              </button>
              <button
                type="button"
                onClick={() => finalizeFailedExamDecision('TERMINATE')}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-left text-xs font-bold text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
              >
                Terminate Trainee
                <span className="mt-1 block text-[10px] font-normal text-slate-400">Close the recruitment process and keep the failure report.</span>
              </button>
            </div>
            <div className="flex justify-end border-t border-slate-800 bg-[#1e293b] px-6 py-4">
              <button type="button" onClick={() => setPendingExamDecision(null)} disabled={isSubmitting} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 disabled:opacity-50">Cancel</button>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* 5. Document Preview Modal (Uses ReactDOM.createPortal for guaranteed centered popup) */}
      <DocumentPreviewModal
        isOpen={showDocPreview}
        file={selectedUploadFile}
        category={uploadCategory}
        targetId={candidate?.id || advisor?.id}
        targetType={candidate ? 'candidate' : 'advisor'}
        onClose={() => {
          setShowDocPreview(false);
          setSelectedUploadFile(null);
        }}
        onConfirm={handleConfirmDocUpload}
        isUploading={isUploadingDoc}
      />

      {existingDocPreview && typeof document !== 'undefined' && ReactDOM.createPortal((
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative flex w-full max-w-3xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-3xl border border-slate-700 bg-[#0f172a] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#1e293b] px-4 py-3">
              <div className="min-w-0"><h3 className="truncate text-sm font-bold text-white">{existingDocPreview.fileName || existingDocPreview.name || 'Document Preview'}</h3><p className="text-[11px] text-slate-400">{existingDocPreview.category || 'Candidate document'}</p></div>
              <button type="button" onClick={() => setExistingDocPreview(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex h-[70vh] items-center justify-center bg-slate-950 p-3">
              {/\.pdf($|\?)/i.test(resolveDocumentUrl(existingDocPreview.url || existingDocPreview.path) || '') ? (
                <iframe src={resolveDocumentUrl(existingDocPreview.url || existingDocPreview.path)} title="Document preview" className="h-full w-full rounded-xl bg-white" />
              ) : (
                <img src={resolveDocumentUrl(existingDocPreview.url || existingDocPreview.path)} alt={existingDocPreview.fileName || existingDocPreview.name || 'Document'} className="max-h-full max-w-full object-contain" />
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 bg-[#1e293b] px-4 py-3"><a href={resolveDocumentUrl(existingDocPreview.url || existingDocPreview.path)} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white">Open Document File</a><a href={resolveDocumentUrl(existingDocPreview.url || existingDocPreview.path)} download className="rounded-xl bg-[#0078d4] px-4 py-2 text-xs font-bold text-white">Download</a></div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}
