/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_MESSAGE_TEMPLATES = [
  {
    id: 'tmpl-cand-welcome',
    name: 'Candidate Welcome & KYC Submission',
    channel: 'WHATSAPP',
    eventKey: 'CANDIDATE_REGISTERED',
    subject: 'Welcome to Aynkaran Consultants',
    body: 'Dear {{candidateName}}, welcome to Aynkaran Consultants! We have registered your application for insurance licensing. Please submit your KYC documents (Aadhaar, PAN, Education certificates) to begin training.',
    variables: ['candidateName']
  },
  {
    id: 'tmpl-trn-start-7d',
    name: 'Training Start (7 Days Notice)',
    channel: 'WHATSAPP',
    eventKey: 'TRAINING_7D',
    subject: 'Upcoming Training Schedule (7 Days)',
    body: 'Dear {{candidateName}}, your Insurance Licensing Training session is scheduled to begin in 7 days on {{trainingDate}}. Please ensure your attendance.',
    variables: ['candidateName', 'trainingDate']
  },
  {
    id: 'tmpl-trn-start-3d',
    name: 'Training Start (3 Days Notice)',
    channel: 'WHATSAPP',
    eventKey: 'TRAINING_3D',
    subject: 'Upcoming Training Schedule (3 Days)',
    body: 'Dear {{candidateName}}, reminder: your licensing training starts in 3 days on {{trainingDate}}. Venue/Link details will be shared shortly.',
    variables: ['candidateName', 'trainingDate']
  },
  {
    id: 'tmpl-trn-start-1d',
    name: 'Training Start (Tomorrow)',
    channel: 'WHATSAPP',
    eventKey: 'TRAINING_1D',
    subject: 'Training Starts Tomorrow',
    body: 'Dear {{candidateName}}, your insurance licensing training session begins tomorrow ({{trainingDate}}). Please join promptly.',
    variables: ['candidateName', 'trainingDate']
  },
  {
    id: 'tmpl-exam-sched-7d',
    name: 'IRDA Exam Scheduled (7 Days)',
    channel: 'WHATSAPP',
    eventKey: 'EXAM_7D',
    subject: 'IRDA Licensing Exam in 7 Days',
    body: 'Dear {{candidateName}}, your IRDA Licensing Examination is scheduled in 7 days on {{examDate}}. Best wishes for your preparation.',
    variables: ['candidateName', 'examDate']
  },
  {
    id: 'tmpl-exam-sched-1d',
    name: 'IRDA Exam Scheduled (Tomorrow)',
    channel: 'WHATSAPP',
    eventKey: 'EXAM_1D',
    subject: 'IRDA Licensing Exam Tomorrow',
    body: 'Dear {{candidateName}}, reminder: your IRDA Exam is scheduled for tomorrow ({{examDate}}). Carry your hall ticket and original Photo ID.',
    variables: ['candidateName', 'examDate']
  },
  {
    id: 'tmpl-exam-pass',
    name: 'Exam Result Passed',
    channel: 'WHATSAPP',
    eventKey: 'EXAM_PASS',
    subject: 'Congratulations on Passing your IRDA Exam',
    body: 'Congratulations {{candidateName}}! You have successfully passed your IRDA Certification Exam. We are generating your Advisor Code.',
    variables: ['candidateName']
  },
  {
    id: 'tmpl-adv-activation',
    name: 'Advisor Code & Activation',
    channel: 'WHATSAPP',
    eventKey: 'ADVISOR_ACTIVATED',
    subject: 'Insurance Advisor Activation Notice',
    body: 'Congratulations {{advisorName}}! Your Insurance Advisor Code {{advisorCode}} is now active with {{insuranceCompany}}. Welcome to the sales force!',
    variables: ['advisorName', 'advisorCode', 'insuranceCompany']
  },
  {
    id: 'tmpl-lic-exp-60d',
    name: 'Advisor License Expiry (60 Days)',
    channel: 'WHATSAPP',
    eventKey: 'LICENSE_EXPIRY_60D',
    subject: 'License Renewal Notice (60 Days)',
    body: 'Notice: Advisor {{advisorName}} (Code: {{advisorCode}}), your IRDA License #{{licenseNumber}} is due for renewal on {{expiryDate}} (60 days remaining).',
    variables: ['advisorName', 'advisorCode', 'licenseNumber', 'expiryDate']
  },
  {
    id: 'tmpl-lic-exp-30d',
    name: 'Advisor License Expiry (30 Days)',
    channel: 'WHATSAPP',
    eventKey: 'LICENSE_EXPIRY_30D',
    subject: 'Urgent: License Renewal (30 Days)',
    body: 'Urgent Notice: Advisor {{advisorName}} (Code: {{advisorCode}}), your insurance license expires in 30 days on {{expiryDate}}. Submit renewal documentation immediately.',
    variables: ['advisorName', 'advisorCode', 'licenseNumber', 'expiryDate']
  }
];

export class MessageTemplate {
  static getDefaultTemplates() {
    return DEFAULT_MESSAGE_TEMPLATES;
  }
}
