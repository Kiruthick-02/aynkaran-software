/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** The single, authoritative advisor/candidate onboarding pipeline. */
export const MILESTONE_STAGES = [
  ['MEETING_APPOINTMENT', 'Meeting Appointment', 'Schedule and record the candidate meeting.', 'Record a meeting outcome before progressing.'],
  ['ONBOARDING_COMMITMENT_SIGN', 'Onboarding Commitment Sign', 'Record the candidate commitment to proceed.', 'Commitment must be signed.'],
  ['DOSSIER_KYC_COMPLETED', 'Dossier Scans and KYC Completed', 'Collect and verify all mandatory KYC documents.', 'All required documents must be present and verified.'],
  ['PRL_APPLICATION_DONE', 'PRL Application Done', 'Record the PRL application and its reference.', 'PRL application must be completed.'],
  ['PRL_VERIFICATION_FEE_CLEARED', 'PRL Verification Fee Cleared', 'Record the PRL verification fee payment.', 'Payment status must be Paid.'],
  ['IRDAI_PORTALS_TRAINING_ENROLLED', 'IRDAI Portals Training Enrolled', 'Record IRDAI portal training enrollment.', 'Training enrollment must be completed.'],
  ['TRAINING_LICENSE_FEE_PAID', 'Training License Fee Paid', 'Record the training/license fee payment.', 'Payment status must be Paid.'],
  ['NSEIT_EXAM_REGISTERED', 'NSEIT Exam Registered', 'Record NSEIT exam registration and fee payment.', 'Registration details and required fee payment must be complete.'],
  ['IRDAI_CARRIER_CERTIFICATION_PASSED', 'IRDAI Carrier Certification Passed', 'Record the certification result and evidence.', 'Result must be Passed.'],
  ['ACTIVE_AYNKARAN_LICENSE_GENERATED', 'Active Aynkaran License Generated', 'Generate and save the active Aynkaran advisor license/code.', 'Active advisor license/code must be generated.']
].map(([key, name, purpose, completionConditions], index) => ({
  stage: index + 1, key, name, purpose, activities: [],
  entryCondition: index === 0 ? 'Candidate record exists.' : `Milestone ${index} is completed.`,
  completionConditions,
  nextAction: index === 9 ? 'Onboarding is complete.' : 'Complete the next unlocked milestone.',
  transitionRule: index === 9 ? 'Final onboarding milestone.' : `Milestone ${index + 1} must be explicitly completed before milestone ${index + 2} unlocks.`
}));

/* Legacy 17-stage workflow removed from the active application.
  {
    stage: 1,
    key: 'CANDIDATE_REGISTERED',
    name: 'Candidate Registered',
    purpose: 'Create initial advisor candidate record in CRM.',
    activities: [
      'Enter candidate personal information',
      'Enter contact information',
      'Record qualification and occupation',
      'Record referral person details',
      'Record source of candidate',
      'Assign candidate number',
      'Set candidate status to ACTIVE'
    ],
    entryCondition: 'Candidate initiates recruitment or walk-in registration.',
    completionConditions: 'Mandatory candidate information is completed, saved, and candidate number is generated.',
    nextAction: 'Collect mandatory KYC documents (Aadhaar, PAN, Photo, Passbook, Certificates).',
    transitionRule: 'STAGE 1 → STAGE 2. If mandatory information is missing: Remain in STAGE 1.'
  },
  {
    stage: 2,
    key: 'DOCUMENT_COLLECTION',
    name: 'Document Collection',
    purpose: 'Collect all required candidate KYC documents into Document Vault.',
    activities: [
      'Select document type (Passport Photo, Aadhaar, PAN, Passbook, Certificates, Marksheet, Signature)',
      'Upload file and view document preview',
      'User confirms using "Confirm & Use File"',
      'Store and link document to candidate record and Document Vault'
    ],
    entryCondition: 'Candidate is registered in CRM.',
    completionConditions: 'Mandatory documents are uploaded and linked without incomplete uploads.',
    nextAction: 'Assign candidate to regulatory training batch and schedule dates.',
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
      'Record trainer name and batch ID',
      'Assign candidate to training batch'
    ],
    entryCondition: 'Candidate documents collected in Stage 2.',
    completionConditions: 'Candidate is assigned to a valid training batch with schedule recorded.',
    nextAction: 'Commence training sessions and track daily attendance.',
    transitionRule: 'STAGE 3 → STAGE 4. Generate training schedule reminders (7d, 3d, 1d, 0d).'
  },
  {
    stage: 4,
    key: 'TRAINING_IN_PROGRESS',
    name: 'Training In Progress',
    purpose: 'Track the candidate while training is taking place.',
    activities: [
      'Record daily attendance',
      'Track each training session & module coverage',
      'Record absences or pending attendance',
      'Send date-based training reminders'
    ],
    entryCondition: 'Training start date has arrived.',
    completionConditions: 'Training sessions completed and required attendance condition is satisfied.',
    nextAction: 'Issue training certificate and confirm official completion.',
    transitionRule: 'STAGE 4 → STAGE 5. If attendance is incomplete: Remain in STAGE 4.'
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
      'Update candidate milestone to completed'
    ],
    entryCondition: '100% attendance & session requirement met in Stage 4.',
    completionConditions: 'Training is officially marked COMPLETED.',
    nextAction: 'Register candidate for the official IRDA examination.',
    transitionRule: 'STAGE 5 → STAGE 6. Do NOT allow exam registration before training completion.'
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
      'Upload registration receipt/documents'
    ],
    entryCondition: 'Training successfully completed in Stage 5.',
    completionConditions: 'Examination registration is successfully created.',
    nextAction: 'Record confirmed examination schedule date, time, and exam center.',
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
    completionConditions: 'Exam date and scheduling info present.',
    nextAction: 'Candidate appears for examination on scheduled date.',
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
      'Verify required documents collected',
      'Verify candidate is not obsolete or already converted'
    ],
    entryCondition: 'Exam result = PASS and all previous prerequisites verified.',
    completionConditions: 'All mandatory eligibility rules are satisfied.',
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
      'Record conversion date and converted-by user'
    ],
    entryCondition: 'Candidate confirmed ELIGIBLE in Stage 10.',
    completionConditions: 'Advisor record successfully created without duplicates.',
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
    completionConditions: 'Advisor code and license information complete, unique, and valid.',
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
*/

export class AdvisorMilestone {
  static getStages() {
    return MILESTONE_STAGES;
  }

  static getStageByNumber(stageNumber) {
    return MILESTONE_STAGES.find(s => s.stage === Number(stageNumber));
  }

  static getStageByKey(stageKey) {
    return MILESTONE_STAGES.find(s => s.key === stageKey);
  }

  static buildMilestonePayload(advisorOrCandidateId, stageNumber, data = {}) {
    const stageDef = this.getStageByNumber(stageNumber);
    if (!stageDef) throw new Error(`Invalid stage number: ${stageNumber}`);

    return {
      advisorId: advisorOrCandidateId,
      candidateId: advisorOrCandidateId,
      stageNumber: stageDef.stage,
      milestoneKey: stageDef.key,
      milestoneName: stageDef.name,
      status: data.status || 'PENDING',
      plannedDate: data.plannedDate || null,
      actualDate: data.actualDate || null,
      completedDate: data.completedDate || (data.status === 'COMPLETED' ? new Date().toISOString().split('T')[0] : null),
      lastUpdatedAt: new Date().toISOString(),
      nextActionDate: data.nextActionDate || null,
      completedBy: data.completedBy || 'System Admin',
      remarks: data.remarks || '',
      blockingReason: data.blockingReason || null,
      stageData: data.stageData || {},
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          status: data.status || 'PENDING',
          updatedBy: data.completedBy || 'System Admin',
          remarks: data.remarks || 'Initial milestone creation'
        }
      ]
    };
  }
}
