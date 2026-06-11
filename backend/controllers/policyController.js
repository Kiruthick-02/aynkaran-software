/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { sendSMSNotification } from '../utils/smsService.js';
import { sendEmailReceipt } from '../utils/emailService.js';

// Controller matching policy pipeline applications using MongoDB Atlas
export class PolicyController {
  constructor(db) {
    this.db = db;
  }

  getAll = async (req, res) => {
    try {
      const rows = await this.db.collection('policies').find().sort({ pendingStageSince: -1 }).toArray();
      const formatted = rows.map(r => ({
        ...r,
        id: r.id || r._id.toString(),
        _id: undefined,
        quotes: typeof r.quotes === 'string' ? JSON.parse(r.quotes || '[]') : (r.quotes || []),
      }));
      res.json(formatted);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  create = async (req, res) => {
    try {
      const data = { ...req.body };
      data.id = data.id || `pol-${Date.now().toString().slice(-5)}`;
      data.pendingStageSince = data.pendingStageSince || new Date().toISOString().split('T')[0];

      // Safeguard collections
      data.quotes = data.quotes || [];

      await this.db.collection('policies').insertOne(data);

      if (data.currentStage === 'Renewal Date Assigned' && data.renewalDate) {
        await this.processRenewalReminder(data);
      }

      const responseData = { ...data };
      delete responseData._id;
      res.status(201).json(responseData);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  };

  update = async (req, res) => {
    try {
      const { id } = req.params;
      const data = { ...req.body };
      delete data._id; // _id must be immutable

      const existingPolicy = await this.db.collection('policies').findOne({ id });
      const wasAlreadyAssigned = existingPolicy && existingPolicy.currentStage === 'Renewal Date Assigned';
      const isNowAssigned = data.currentStage === 'Renewal Date Assigned';

      await this.db.collection('policies').updateOne({ id }, { $set: data });

      // Automatically complete related reminders of the old renewal date because a new/updated renewal date is now being scheduled.
      if (existingPolicy && existingPolicy.renewalDate && data.renewalDate && existingPolicy.renewalDate !== data.renewalDate) {
        console.log(`[Automatic Completion] Renewal date changed from ${existingPolicy.renewalDate} to ${data.renewalDate}. Completing corresponding reminders.`);
        await this.db.collection('reminders').updateMany(
          {
            targetId: id,
            targetType: 'renewal',
            completed: false
          },
          { $set: { completed: true, completedAt: new Date().toISOString() } }
        );
      }

      if (isNowAssigned && !wasAlreadyAssigned && data.renewalDate) {
        await this.processRenewalReminder({ ...existingPolicy, ...data, id });
      }

      res.json({ id, ...data });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      await this.db.collection('policies').deleteOne({ id });
      res.json({ success: true, message: 'Policy pipeline item removed successfully.' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  processRenewalReminder = async (policy) => {
    try {
      const id = policy.id;
      
      // 1. Check if a reminder for this policy's current renewal date is already created
      const existingReminder = await this.db.collection('reminders').findOne({
        targetId: id,
        targetType: 'renewal',
        dueDate: policy.renewalDate
      });
      
      if (existingReminder) {
        console.log(`[Automatic Reminder] Reminder already exists for policy ${policy.customerName} on ${policy.renewalDate}. Skipping duplication.`);
        return;
      }

      // 2. Resolve customer information for mobile/email
      const customer = await this.db.collection('customers').findOne({
        $or: [
          { id: policy.customerId },
          { name: policy.customerName }
        ]
      });

      const targetMobile = customer ? (customer.mobileNumber || customer.mobile || '') : '';
      const targetEmail = customer ? (customer.emailId || customer.email || '') : '';

      // 3. Create the reminder text message
      const reminderTitle = `Policy Renewal Date Assigned: ${policy.customerName}`;
      const reminderDesc = `Dear Customer ${policy.customerName}, your insurance policy ${policy.policyType} (#${policy.issuedPolicyNumber || 'N/A'}) renewal date is assigned on ${policy.renewalDate}. Premium Amount: Rs. ${policy.premiumAmount || 'N/A'}. Please process payment to secure continuous coverage.`;

      // 4. Insert into the reminders collection
      const remId = `rem-ren-auto-${Date.now().toString().slice(-5)}`;
      const newReminder = {
        id: remId,
        title: reminderTitle,
        description: reminderDesc,
        dueDate: policy.renewalDate,
        targetId: id,
        targetType: 'renewal',
        triggerType: 'Immediate Assigned',
        completed: false,
        channels: { desktop: true, whatsapp: !!targetMobile, email: !!targetEmail, sms: !!targetMobile },
        customerMobile: targetMobile,
        customerEmail: targetEmail,
        createdAt: new Date().toISOString()
      };

      await this.db.collection('reminders').insertOne(newReminder);
      console.log(`[Automatic Reminder] Successfully registered new reminder ${remId} in Database.`);

      // 5. Send notifications via SMS, WhatsApp, and Email
      if (targetMobile) {
        console.log(`[Automatic Reminder] Sending SMS to ${targetMobile}...`);
        await sendSMSNotification(targetMobile, reminderDesc).catch(e => console.error('[Automatic Reminder] SMS dispatch failed:', e));
        
        console.log(`[Automatic Reminder] Sending WhatsApp to ${targetMobile}...`);
        await sendSMSNotification(`whatsapp:${targetMobile}`, reminderDesc).catch(e => console.error('[Automatic Reminder] WhatsApp dispatch failed:', e));
      } else {
        console.log(`[Automatic Reminder] No mobile phone found for customer: ${policy.customerName}. Skipping SMS & WhatsApp.`);
      }

      if (targetEmail) {
        const subject = `Policy Renewal Schedule Confirmed - Policy #${policy.issuedPolicyNumber || 'N/A'}`;
        console.log(`[Automatic Reminder] Sending Email to ${targetEmail}...`);
        await sendEmailReceipt(targetEmail, subject, reminderDesc).catch(e => console.error('[Automatic Reminder] Email dispatch failed:', e));
      } else {
        console.log(`[Automatic Reminder] No email found for customer: ${policy.customerName}. Skipping Email.`);
      }

    } catch (e) {
      console.error('[Automatic Reminder] Error processing assignment reminder:', e);
    }
  };
}
