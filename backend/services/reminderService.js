/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NotificationService } from './notificationService.js';

// Configurable reminder schedule offsets (in days relative to target date)
export const REMINDER_OFFSETS = {
  TRAINING: [7, 3, 1, 0], // 7 days, 3 days, 1 day, and on training start day
  EXAM: [7, 3, 1, 0], // 7 days, 3 days, 1 day, and on exam day
  LICENSE_EXPIRY: [60, 30, 7, 0], // 60, 30, 7 days before license expiry
  DOCUMENTS_PENDING_DAYS: 3, // Reminder if documents are pending for 3+ days
  ADVISOR_CREATION_PENDING_DAYS: 2 // Reminder if candidate is eligible but advisor not created for 2+ days
};

export class ReminderService {
  constructor(db) {
    this.db = db;
    this.notificationService = new NotificationService(db);
  }

  getMidnightTimestamp(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  }

  getCurrentMidnightTimestamp() {
    const now = new Date();
    return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  }

  async runDailyMilestoneScan() {
    if (!this.db?.collection) return { scannedCandidates: 0, scannedAdvisors: 0, newRemindersCount: 0 };
    console.log('[Reminder Engine] Executing date-based milestone scan across candidates & advisors...');

    let newRemindersCount = 0;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMidnight = this.getCurrentMidnightTimestamp();

    // 1. Candidate Milestones
    const candidates = await this.db.collection('candidates').find({
      status: { $ne: 'Inactive' }
    }).toArray();

    for (const cand of candidates) {
      const candId = cand.id || cand._id.toString();
      const mobile = cand.mobile;
      const email = cand.email;

      // 1.1 Training Start Reminders (7d, 3d, 1d, 0d)
      const trainingDateStr = cand.trainingStartDate || cand.trainingScheduledDate;
      if (trainingDateStr && cand.trainingStatus !== 'Completed') {
        const trnMidnight = this.getMidnightTimestamp(trainingDateStr);
        if (trnMidnight) {
          const daysRemaining = Math.round((trnMidnight - currentMidnight) / (1000 * 3600 * 24));
          if (REMINDER_OFFSETS.TRAINING.includes(daysRemaining) && daysRemaining >= 0) {
            const milestoneKey = `TRAINING_${daysRemaining}D`;
            const remId = `rem-cand-trn-${candId}-${daysRemaining}d`;

            const existingRem = await this.db.collection('reminders').findOne({
              $or: [
                { id: remId },
                { targetId: candId, milestoneType: milestoneKey, targetDate: trainingDateStr }
              ]
            });

            if (!existingRem) {
              const daysText = daysRemaining === 0 ? 'today' : `in ${daysRemaining} days`;
              const msg = `Dear ${cand.name}, your licensing training is scheduled ${daysText} on ${trainingDateStr}. Please attend the session on time.`;
              
              const newRem = {
                id: remId,
                candidateId: candId,
                targetId: candId,
                targetType: 'candidate_training',
                milestoneType: milestoneKey,
                targetDate: trainingDateStr,
                reminderDate: todayStr,
                title: `Training Reminder (${daysText}): ${cand.name}`,
                description: msg,
                message: msg,
                channel: 'WHATSAPP',
                channels: { whatsapp: true, sms: true, email: !!email },
                customerMobile: mobile,
                customerEmail: email,
                status: 'PENDING',
                priority: daysRemaining <= 1 ? 'HIGH' : 'NORMAL',
                completed: false,
                createdAt: now.toISOString()
              };

              await this.db.collection('reminders').insertOne(newRem);
              newRemindersCount++;

              if (mobile) {
                await this.notificationService.dispatch({
                  reminderId: remId,
                  candidateId: candId,
                  recipient: mobile,
                  channel: 'WHATSAPP',
                  subject: `Licensing Training Reminder - ${cand.name}`,
                  messageBody: msg,
                  variables: { candidateName: cand.name, trainingDate: trainingDateStr }
                }).catch(e => console.error('[Reminder Auto Dispatch Error]', e));
              }
            }
          }
        }
      }

      // 1.2 Exam Scheduled Reminders (7d, 3d, 1d, 0d)
      const examDateStr = cand.examScheduledDate || cand.exam?.scheduledDate;
      if (examDateStr && cand.examStatus !== 'Passed') {
        const examMidnight = this.getMidnightTimestamp(examDateStr);
        if (examMidnight) {
          const daysRemaining = Math.round((examMidnight - currentMidnight) / (1000 * 3600 * 24));
          if (REMINDER_OFFSETS.EXAM.includes(daysRemaining) && daysRemaining >= 0) {
            const milestoneKey = `EXAM_${daysRemaining}D`;
            const remId = `rem-cand-exm-${candId}-${daysRemaining}d`;

            const existingRem = await this.db.collection('reminders').findOne({
              $or: [
                { id: remId },
                { targetId: candId, milestoneType: milestoneKey, targetDate: examDateStr }
              ]
            });

            if (!existingRem) {
              const daysText = daysRemaining === 0 ? 'today' : `in ${daysRemaining} days`;
              const msg = `Dear ${cand.name}, your IRDA Certification Exam is scheduled ${daysText} on ${examDateStr}. Best wishes for your examination.`;

              const newRem = {
                id: remId,
                candidateId: candId,
                targetId: candId,
                targetType: 'candidate_exam',
                milestoneType: milestoneKey,
                targetDate: examDateStr,
                reminderDate: todayStr,
                title: `IRDA Exam Reminder (${daysText}): ${cand.name}`,
                description: msg,
                message: msg,
                channel: 'WHATSAPP',
                channels: { whatsapp: true, sms: true, email: !!email },
                customerMobile: mobile,
                customerEmail: email,
                status: 'PENDING',
                priority: daysRemaining <= 1 ? 'URGENT' : 'HIGH',
                completed: false,
                createdAt: now.toISOString()
              };

              await this.db.collection('reminders').insertOne(newRem);
              newRemindersCount++;

              if (mobile) {
                await this.notificationService.dispatch({
                  reminderId: remId,
                  candidateId: candId,
                  recipient: mobile,
                  channel: 'WHATSAPP',
                  subject: `IRDA Exam Reminder - ${cand.name}`,
                  messageBody: msg,
                  variables: { candidateName: cand.name, examDate: examDateStr }
                }).catch(e => console.error('[Reminder Auto Dispatch Error]', e));
              }
            }
          }
        }
      }

      // 1.3 Missing Documents Reminder
      const docsCount = Array.isArray(cand.documents) ? cand.documents.length : 0;
      if (docsCount === 0 && cand.pendingStageSince) {
        const pendingMidnight = this.getMidnightTimestamp(cand.pendingStageSince);
        if (pendingMidnight) {
          const daysPending = Math.round((currentMidnight - pendingMidnight) / (1000 * 3600 * 24));
          if (daysPending >= REMINDER_OFFSETS.DOCUMENTS_PENDING_DAYS) {
            const remId = `rem-cand-doc-${candId}`;
            const existingRem = await this.db.collection('reminders').findOne({ id: remId });

            if (!existingRem) {
              const msg = `Dear ${cand.name}, your KYC documents are still pending submission. Please submit your Aadhaar, PAN, and certificates to proceed.`;
              const newRem = {
                id: remId,
                candidateId: candId,
                targetId: candId,
                targetType: 'candidate_documents',
                milestoneType: 'DOCUMENT_PENDING',
                targetDate: todayStr,
                reminderDate: todayStr,
                title: `Missing KYC Documents: ${cand.name}`,
                description: msg,
                message: msg,
                channel: 'WHATSAPP',
                channels: { whatsapp: true, sms: true, email: !!email },
                customerMobile: mobile,
                customerEmail: email,
                status: 'PENDING',
                priority: 'NORMAL',
                completed: false,
                createdAt: now.toISOString()
              };

              await this.db.collection('reminders').insertOne(newRem);
              newRemindersCount++;
            }
          }
        }
      }

      // 1.4 Eligible Candidate Pending Advisor Conversion
      if (cand.eligibility === 'Eligible' && !cand.isConvertedToAdvisor && cand.eligibilityDate) {
        const eligMidnight = this.getMidnightTimestamp(cand.eligibilityDate);
        if (eligMidnight) {
          const daysPending = Math.round((currentMidnight - eligMidnight) / (1000 * 3600 * 24));
          if (daysPending >= REMINDER_OFFSETS.ADVISOR_CREATION_PENDING_DAYS) {
            const remId = `rem-cand-conv-${candId}`;
            const existingRem = await this.db.collection('reminders').findOne({ id: remId });

            if (!existingRem) {
              const msg = `Internal Notice: Candidate ${cand.name} is ELIGIBLE with exam passed. Advisor creation and code generation is pending.`;
              const newRem = {
                id: remId,
                candidateId: candId,
                targetId: candId,
                targetType: 'candidate_conversion',
                milestoneType: 'ADVISOR_CREATION_PENDING',
                targetDate: todayStr,
                reminderDate: todayStr,
                title: `Ready for Advisor Creation: ${cand.name}`,
                description: msg,
                message: msg,
                channel: 'DESKTOP',
                channels: { desktop: true },
                status: 'PENDING',
                priority: 'HIGH',
                completed: false,
                createdAt: now.toISOString()
              };

              await this.db.collection('reminders').insertOne(newRem);
              newRemindersCount++;
            }
          }
        }
      }
    }

    // 2. Advisor License Expiry Reminders
    const advisors = await this.db.collection('advisors').find({
      status: { $in: ['ACTIVE', 'SUSPENDED'] }
    }).toArray();

    for (const adv of advisors) {
      const advId = adv.id || adv._id.toString();
      const expiryDateStr = adv.licenseExpiryDate;

      if (expiryDateStr) {
        const expiryMidnight = this.getMidnightTimestamp(expiryDateStr);
        if (expiryMidnight) {
          const daysRemaining = Math.round((expiryMidnight - currentMidnight) / (1000 * 3600 * 24));
          if (REMINDER_OFFSETS.LICENSE_EXPIRY.includes(daysRemaining) && daysRemaining >= 0) {
            const milestoneKey = `LICENSE_EXPIRY_${daysRemaining}D`;
            const remId = `rem-adv-lic-${advId}-${daysRemaining}d`;

            const existingRem = await this.db.collection('reminders').findOne({
              $or: [
                { id: remId },
                { targetId: advId, milestoneType: milestoneKey, targetDate: expiryDateStr }
              ]
            });

            if (!existingRem) {
              const daysText = daysRemaining === 0 ? 'today' : `in ${daysRemaining} days`;
              const msg = `Notice: Advisor ${adv.fullName} (Code: ${adv.advisorCode}) license #${adv.licenseNumber} expires ${daysText} on ${expiryDateStr}. Renewal required.`;

              const newRem = {
                id: remId,
                advisorId: advId,
                targetId: advId,
                targetType: 'advisor_license',
                milestoneType: milestoneKey,
                targetDate: expiryDateStr,
                reminderDate: todayStr,
                title: `License Expiry Alert (${daysText}): ${adv.fullName}`,
                description: msg,
                message: msg,
                channel: 'WHATSAPP',
                channels: { whatsapp: true, sms: true, email: !!adv.email },
                customerMobile: adv.mobile,
                customerEmail: adv.email,
                status: 'PENDING',
                priority: daysRemaining <= 7 ? 'URGENT' : 'HIGH',
                completed: false,
                createdAt: now.toISOString()
              };

              await this.db.collection('reminders').insertOne(newRem);
              newRemindersCount++;

              if (adv.mobile) {
                await this.notificationService.dispatch({
                  reminderId: remId,
                  advisorId: advId,
                  recipient: adv.mobile,
                  channel: 'WHATSAPP',
                  subject: `Insurance License Expiry Notice - ${adv.fullName}`,
                  messageBody: msg,
                  variables: {
                    advisorName: adv.fullName,
                    advisorCode: adv.advisorCode,
                    licenseNumber: adv.licenseNumber,
                    licenseExpiryDate: expiryDateStr
                  }
                }).catch(e => console.error('[Advisor License Notification Error]', e));
              }
            }
          }
        }
      }
    }

    console.log(`[Reminder Engine] Scan completed. Scanned ${candidates.length} candidates, ${advisors.length} advisors. New reminders generated: ${newRemindersCount}.`);
    return {
      scannedCandidates: candidates.length,
      scannedAdvisors: advisors.length,
      newRemindersCount
    };
  }
}

export default ReminderService;
