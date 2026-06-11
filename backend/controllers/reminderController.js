/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { sendSMSNotification } from '../utils/smsService.js';
import { sendEmailReceipt } from '../utils/emailService.js';

// Controller matching system and automated communication reminders using MongoDB Atlas
export class ReminderController {
  constructor(db) {
    this.db = db;
  }

  getAll = async (req, res) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      // Automatically complete all outstanding reminders where the renewal date / due date is in the past (over)
      await this.db.collection('reminders').updateMany(
        {
          dueDate: { $lt: todayStr },
          completed: false
        },
        {
          $set: {
            completed: true,
            completedAt: new Date().toISOString(),
            autoCompletedReason: 'Passed due date'
          }
        }
      );

      const rows = await this.db.collection('reminders').find().sort({ dueDate: 1 }).toArray();
      const formatted = rows.map(r => ({
        ...r,
        id: r.id || r._id.toString(),
        _id: undefined,
        completed: Boolean(r.completed),
        channels: typeof r.channels === 'string' ? JSON.parse(r.channels || '{}') : (r.channels || {}),
      }));
      res.json(formatted);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  create = async (req, res) => {
    try {
      const data = { ...req.body };
      data.id = data.id || `rem-${Date.now().toString().slice(-5)}`;
      data.completed = Boolean(data.completed);
      data.createdAt = data.createdAt || new Date().toISOString();

      data.channels = data.channels || {};

      // Auto Dispatch Automated SMS, WhatsApp, and Email instantly on backend
      if (data.customerMobile || data.customerEmail) {
        const mobile = data.customerMobile;
        const email = data.customerEmail;
        const title = data.title || 'Aynkaran Notification';
        const desc = data.description || '';
        const text = `${title} - ${desc}`;

        if (mobile) {
          // 1. Cellular SMS
          sendSMSNotification(mobile, text).catch(e => console.error('[Backend SMS error]', e));
          // 2. WhatsApp Simulation (Prefix with whatsapp:)
          sendSMSNotification(`whatsapp:${mobile}`, text).catch(e => console.error('[Backend WhatsApp error]', e));
        }

        if (email && email !== 'no-email@aynakaran.com') {
          // 3. Corporate Email
          sendEmailReceipt(email, title, text).catch(e => console.error('[Backend Email error]', e));
        }
      }

      await this.db.collection('reminders').insertOne(data);

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
      delete data._id; // immutable _id
      data.completed = Boolean(data.completed);

      const existing = await this.db.collection('reminders').findOne({ id });

      if (data.channels && existing) {
        const existChannels = typeof existing.channels === 'string' ? JSON.parse(existing.channels || '{}') : (existing.channels || {});
        const checkWhatsapp = data.channels.whatsapp && !existChannels.whatsapp;
        const checkEmail = data.channels.email && !existChannels.email;
        const checkSms = data.channels.sms && !existChannels.sms;

        const messageText = data.description || existing.description || '';
        const emailSubject = data.title || existing.title || 'Notification Update';

        // Resolve real destination parameters on demand
        let targetMobile = data.customerMobile || existing.customerMobile || '';
        let targetEmail = data.customerEmail || existing.customerEmail || '';

        if (!targetMobile || !targetEmail) {
          if (existing.targetType === 'recruitment' || data.targetType === 'recruitment') {
            const candId = data.targetId || existing.targetId;
            const cand = await this.db.collection('candidates').findOne({ id: candId });
            if (cand) {
              targetMobile = targetMobile || cand.mobile || '';
              targetEmail = targetEmail || cand.email || '';
            }
          } else if (existing.targetType === 'renewal' || data.targetType === 'renewal') {
            const policyId = data.targetId || existing.targetId;
            const policy = await this.db.collection('policies').findOne({ id: policyId });
            if (policy) {
              const customer = await this.db.collection('customers').findOne({
                $or: [
                  { id: policy.customerId },
                  { name: policy.customerName }
                ]
              });
              if (customer) {
                targetMobile = targetMobile || customer.mobileNumber || customer.mobile || '';
                targetEmail = targetEmail || customer.emailId || customer.email || '';
              }
            }
          }
        }

        if (checkWhatsapp && targetMobile) {
          console.log(`[Manual Broadcast] Dispatching live WhatsApp alert to: ${targetMobile}`);
          await sendSMSNotification(`whatsapp:${targetMobile}`, messageText).catch(e => console.error('Manual WhatsApp failed:', e));
        }
        if (checkSms && targetMobile) {
          console.log(`[Manual Broadcast] Dispatching live SMS alert to: ${targetMobile}`);
          await sendSMSNotification(targetMobile, messageText).catch(e => console.error('Manual SMS failed:', e));
        }
        if (checkEmail && targetEmail) {
          console.log(`[Manual Broadcast] Dispatching live Email alert to: ${targetEmail}`);
          await sendEmailReceipt(targetEmail, emailSubject, messageText).catch(e => console.error('Manual Email failed:', e));
        }
      }

      await this.db.collection('reminders').updateOne({ id }, { $set: data });
      res.json({ id, ...data });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      await this.db.collection('reminders').deleteOne({ id });
      res.json({ success: true, message: 'System reminder removed successfully.' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  triggerCron = async (req, res) => {
    try {
      const { executeDailyPolicyRenewalJobs } = await import('../cron/renewalJobs.js');
      const { executeDailyReminderJobs } = await import('../cron/reminderJobs.js');

      const beforeCount = await this.db.collection('reminders').countDocuments();

      await executeDailyPolicyRenewalJobs(this.db);
      await executeDailyReminderJobs(this.db);

      const afterCount = await this.db.collection('reminders').countDocuments();
      const newlyCreated = afterCount - beforeCount;

      const todayStr = new Date().toISOString().split('T')[0];
      // Automatically complete all outstanding reminders where the renewal date / due date is in the past (over)
      await this.db.collection('reminders').updateMany(
        {
          dueDate: { $lt: todayStr },
          completed: false
        },
        {
          $set: {
            completed: true,
            completedAt: new Date().toISOString(),
            autoCompletedReason: 'Passed due date'
          }
        }
      );

      const list = await this.db.collection('reminders').find().toArray();
      const formatted = list.map(r => ({
        ...r,
        id: r.id || r._id.toString(),
        _id: undefined,
        completed: Boolean(r.completed),
        channels: typeof r.channels === 'string' ? JSON.parse(r.channels || '{}') : (r.channels || {}),
      }));

      res.json({
        success: true,
        message: 'Automated alerts engine executed successfully on MongoDB database!',
        newRemindersCreated: newlyCreated,
        reminders: formatted
      });
    } catch (e) {
      console.error('[Trigger Cron Error]', e);
      res.status(500).json({ error: e.message });
    }
  };
}
