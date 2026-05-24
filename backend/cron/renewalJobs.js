/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { sendSMSNotification } from '../utils/smsService.js';

// Executed daily to check Policy Renewal Dates and trigger alerts using MongoDB Atlas
export async function executeDailyPolicyRenewalJobs(db) {
  console.log('[Cron Job] Processing Policy Renewal and Expire status queues via MongoDB...');

  try {
    const upcomingRenewals = await db.collection('policies').find({
      renewalDate: { $ne: null },
      currentStage: { $ne: 'Policy Lapsed' }
    }).toArray();

    const now = new Date();
    for (const policy of upcomingRenewals) {
      const renewal = new Date(policy.renewalDate);
      const timeDiff = renewal.getTime() - now.getTime();
      const daysToRenewal = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Trigger reminder if there is exactly 7, 3, or 1 days left
      if (daysToRenewal === 7 || daysToRenewal === 3 || daysToRenewal === 1) {
        console.log(`[Policy Renewal Warning] Policy ${policy.issuedPolicyNumber} is due in ${daysToRenewal} days.`);

        const remId = `rem-ren-${Date.now().toString().slice(-4)}`;
        await db.collection('reminders').insertOne({
          id: remId,
          title: `Policy Renewal Reminder: ${policy.customerName}`,
          description: `The premium for policy ${policy.policyType} (#${policy.issuedPolicyNumber}) is due in ${daysToRenewal} days. Amount: Rs. ${policy.premiumAmount}`,
          dueDate: policy.renewalDate,
          targetId: policy.id || policy._id.toString(),
          targetType: 'renewal',
          triggerType: `${daysToRenewal} days before`,
          completed: false,
          channels: { desktop: true, whatsapp: true, email: true, sms: true },
          createdAt: now.toISOString()
        });

        // Dispatch alert communication
        const message = `Aynkaran Consultants Urgent renewal: Dear customer ${policy.customerName}, your insurance policy ${policy.policyType} (#${policy.issuedPolicyNumber}) renewal premium Rs. ${policy.premiumAmount} is due on ${policy.renewalDate}. Please clear to maintain your active live coverage.`;
        await sendSMSNotification('+91 94472 83011', message); // Utilizing secure sandbox routing
      }
    }
  } catch (err) {
    console.error('[Cron Job Error] Failed executing policy renewal analysis:', err);
  }
}
