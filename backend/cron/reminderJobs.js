/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReminderService } from '../services/reminderService.js';
import { NotificationService } from '../services/notificationService.js';

// Executes daily checking on active and near-overdue trainee tasks and advisor milestones using MongoDB Atlas
export async function executeDailyReminderJobs(db) {
  console.log('[Cron Job] Checking candidate follow-ups, milestone schedules, and advisor license expiry...');
  
  try {
    const reminderService = new ReminderService(db);
    const notificationService = new NotificationService(db);

    // 1. Run date-based milestone scan (7d/3d/1d training, exam, license expiry)
    await reminderService.runDailyMilestoneScan();

    // 2. Candidate stuck stage check
    const activeCandidates = await db.collection('candidates').find({
      currentStage: { $nin: ['Generate Agent Code', 'Meeting Appointment', 'Advisor Active'] }
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
          const candidateMessage = `Aynkaran Desk Trainee Notice: Dear ${cand.name}, we notice your Licensing onboarding registration file is pending. Our trainers will reach out to help you step forward.`;

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

          // Dispatches through NotificationService
          if (parentMobile) {
            await notificationService.dispatch({
              reminderId: remId,
              candidateId: candidateIdStr,
              recipient: parentMobile,
              channel: 'WHATSAPP',
              subject: 'Licensing Onboarding Notice',
              messageBody: candidateMessage
            }).catch(e => console.error('Cron target WhatsApp/SMS failed for stuck candidate:', e));
          }
        }
      }
    }
  } catch (err) {
    console.error('[Cron Job Error] Failed executing reminder jobs:', err);
  }
}
