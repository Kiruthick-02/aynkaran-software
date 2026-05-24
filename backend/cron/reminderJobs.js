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
      const pendingSince = new Date(cand.pendingStageSince);
      const daysDiff = Math.floor((now.getTime() - pendingSince.getTime()) / (1000 * 3600 * 24));

      if (daysDiff >= 4) {
        console.log(`[Alert Triggered] Candidate: ${cand.name} is stuck at "${cand.currentStage}" for ${daysDiff} days.`);
        
        const remId = `rem-auto-${Date.now().toString().slice(-4)}`;
        await db.collection('reminders').insertOne({
          id: remId,
          title: `Stuck Candidate Alert: ${cand.name}`,
          description: `Trainee is stuck in step "${cand.currentStage}" for ${daysDiff} days. Immediate intervention required.`,
          dueDate: new Date(now.getTime() + (2 * 24 * 3600 * 1000)).toISOString().split('T')[0],
          targetId: cand.id || cand._id.toString(),
          targetType: 'recruitment',
          triggerType: 'Immediate',
          completed: false,
          channels: { desktop: true, whatsapp: true, email: false },
          createdAt: now.toISOString()
        });

        // Dispatches WhatsApp/SMS ping dynamically
        if (cand.mobile) {
          await sendSMSNotification(
            cand.mobile,
            `Aynkaran Desk Trainee Notice: Dear ${cand.name}, we notice your Licensing onboarding registration file is pending. Our trainers will reach out to help you step forward.`
          );
        }
      }
    }
  } catch (err) {
    console.error('[Cron Job Error] Failed executing reminder jobs:', err);
  }
}
