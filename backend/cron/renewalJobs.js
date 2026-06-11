/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { sendSMSNotification } from '../utils/smsService.js';
import { sendEmailReceipt } from '../utils/emailService.js';

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
      const renewalDateObj = new Date(policy.renewalDate);
      const renewalMidnight = Date.UTC(renewalDateObj.getFullYear(), renewalDateObj.getMonth(), renewalDateObj.getDate());
      const nowMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      const daysToRenewal = Math.round((renewalMidnight - nowMidnight) / (1000 * 3600 * 24));

      // Define exact required trigger offsets: 1 month (30), 3 weeks (21), 2 weeks (14), 1 week (7), 3 days (3), 1 day (1)
      const allowedOffsets = [30, 21, 14, 7, 3, 1];

      if (allowedOffsets.includes(daysToRenewal)) {
        console.log(`[Policy Renewal Warning] Policy ${policy.issuedPolicyNumber} is due in ${daysToRenewal} days.`);

        const policyIdStr = policy.id || policy._id.toString();
        
        const offsetLabels = {
          30: '1 month before',
          21: '3 weeks before',
          14: '2 weeks before',
          7: '1 week before',
          3: '3 days before',
          1: '1 day before'
        };
        const triggerTypeStr = offsetLabels[daysToRenewal];

        // Check for duplicates in MongoDB to prevent duplicate tracker cards
        const hasDuplicate = await db.collection('reminders').findOne({
          targetId: policyIdStr,
          triggerType: triggerTypeStr
        });

        if (!hasDuplicate) {
          // Dynamically resolve real customer parameters from profile database
          const customer = await db.collection('customers').findOne({
            $or: [
              { id: policy.customerId },
              { name: policy.customerName }
            ]
          });

          const targetMobile = customer ? (customer.mobileNumber || customer.mobile || '') : '';
          const targetEmail = customer ? (customer.emailId || customer.email || '') : '';

          const remId = `rem-ren-${Date.now().toString().slice(-4)}`;
          await db.collection('reminders').insertOne({
            id: remId,
            title: `Policy Renewal Reminder: ${policy.customerName}`,
            description: `The premium for policy ${policy.policyType} (#${policy.issuedPolicyNumber}) is due in ${daysToRenewal} days. Amount: Rs. ${policy.premiumAmount}`,
            dueDate: policy.renewalDate,
            targetId: policyIdStr,
            targetType: 'renewal',
            triggerType: triggerTypeStr,
            completed: false,
            channels: { desktop: true, whatsapp: !!targetMobile, email: !!targetEmail, sms: !!targetMobile },
            customerMobile: targetMobile,
            customerEmail: targetEmail,
            createdAt: now.toISOString()
          });

          // Dispatch alert communications
          const subject = `LIC Policy Renewal Reminder - Policy #${policy.issuedPolicyNumber}`;
          const message = `Aynkaran Consultants Urgent renewal: Dear customer ${policy.customerName}, your insurance policy ${policy.policyType} (#${policy.issuedPolicyNumber}) renewal premium Rs. ${policy.premiumAmount} is due in ${daysToRenewal} days on ${policy.renewalDate}. Please clear to maintain your active live coverage.`;
          
          if (targetMobile) {
            await sendSMSNotification(targetMobile, message).catch(e => console.error('MongoDB cron SMS failed:', e));
            await sendSMSNotification(`whatsapp:${targetMobile}`, message).catch(e => console.error('MongoDB cron WhatsApp failed:', e));
          } else {
            console.log(`[SMS Alert Skipped] No mobile phone found for customer: ${policy.customerName}`);
          }

          if (targetEmail) {
            await sendEmailReceipt(targetEmail, subject, message).catch(e => console.error('MongoDB cron Email failed:', e));
          } else {
            console.log(`[Email Alert Skipped] No email address found for customer: ${policy.customerName}`);
          }
        } else {
          console.log(`[Policy Renewal Skip] Duplicate reminder already generated for ${policy.customerName} - ${triggerTypeStr}`);
        }
      }
    }
  } catch (err) {
    console.error('[Cron Job Error] Failed executing policy renewal analysis:', err);
  }
}
