/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { sendSMSNotification } from '../utils/smsService.js';

// Executes daily checking on active and near-overdue trainee tasks using MongoDB Atlas
export async function executeDailyReminderJobs(db) {
  console.log('[Cron Job] Checking candidate follow-ups and stage delay indicators via MongoDB...');
  
  try {
    const activeCandidates = await db.collection('candidates').find({
      currentStage: { $nin: ['Generate Agent Code', 'Meeting Appointment'] }
    }).toArray();

    const now = new Date();
    for (const cand of activeCandidates) {
      if (!cand.pendingStageSince) continue;
      const pendingSinceObj = new Date(cand.pendingStageSince);
      const pendingMidnight = Date.UTC(pendingSinceObj.getFullYear(), pendingSinceObj.getMonth(), pendingSinceObj.getDate());
      const nowMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      const daysDiff = Math.round((nowMidnight - pendingMidnight) / (1000 * 3600 * 24));

      if (daysDiff >= 4) {
        const candidateIdStr = cand.id || cand._id.toString();
        const hasDuplicate = await db.collection('reminders').findOne({
          targetId: candidateIdStr,
          triggerType: 'Immediate'
        });

        if (!hasDuplicate) {
          console.log(`[Alert Triggered] Candidate: ${cand.name} is stuck at "${cand.currentStage}" for ${daysDiff} days.`);
          
          const remId = `rem-auto-${Date.now().toString().slice(-4)}`;
          const parentMobile = cand.mobile || '';
          const parentEmail = cand.email || '';

          await db.collection('reminders').insertOne({
            id: remId,
            title: `Stuck Candidate Alert: ${cand.name}`,
            description: `Trainee is stuck in step "${cand.currentStage}" for ${daysDiff} days. Immediate intervention required.`,
            dueDate: new Date(now.getTime() + (2 * 24 * 3600 * 1000)).toISOString().split('T')[0],
            targetId: candidateIdStr,
            targetType: 'recruitment',
            triggerType: 'Immediate',
            completed: false,
            channels: { desktop: true, whatsapp: true, email: false },
            customerMobile: parentMobile,
            customerEmail: parentEmail,
            createdAt: now.toISOString()
          });

          // Dispatches WhatsApp/SMS ping dynamically
          if (cand.mobile) {
            const candidateMessage = `Aynkaran Desk Trainee Notice: Dear ${cand.name}, we notice your Licensing onboarding registration file is pending. Our trainers will reach out to help you step forward.`;
            await sendSMSNotification(cand.mobile, candidateMessage).catch(e => console.error('Cron target SMS failed for stuck candidate:', e));
            await sendSMSNotification(`whatsapp:${cand.mobile}`, candidateMessage).catch(e => console.error('Cron target WhatsApp failed for stuck candidate:', e));
          }
        } else {
          console.log(`[Recruitment Alert Skip] Duplicate reminder already exists for candidate: ${cand.name}`);
        }
      }
    }
  } catch (err) {
    console.error('[Cron Job Error] Failed executing reminder jobs:', err);
  }
}
