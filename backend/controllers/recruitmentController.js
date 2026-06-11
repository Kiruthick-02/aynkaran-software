/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { sendSMSNotification } from '../utils/smsService.js';
import { sendEmailReceipt } from '../utils/emailService.js';

// Controller matching high density recruited/candidate files using MongoDB Atlas
export class RecruitmentController {
  constructor(db) {
    this.db = db;
  }

  getAll = async (req, res) => {
    try {
      const rows = await this.db.collection('candidates').find().sort({ pendingStageSince: -1 }).toArray();
      const formatted = rows.map(r => ({
        ...r,
        id: r.id || r._id.toString(),
        _id: undefined,
        stageHistory: typeof r.stageHistory === 'string' ? JSON.parse(r.stageHistory || '[]') : (r.stageHistory || []),
        documents: typeof r.documents === 'string' ? JSON.parse(r.documents || '[]') : (r.documents || []),
        fees: typeof r.fees === 'string' ? JSON.parse(r.fees || '{}') : (r.fees || {}),
        exam: typeof r.exam === 'string' ? JSON.parse(r.exam || '{}') : (r.exam || {}),
      }));
      res.json(formatted);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  create = async (req, res) => {
    try {
      const data = { ...req.body };
      data.id = data.id || `cand-${Date.now().toString().slice(-5)}`;
      data.pendingStageSince = data.pendingStageSince || new Date().toISOString().split('T')[0];

      // Safeguard collections
      data.stageHistory = data.stageHistory || [];
      data.documents = data.documents || [];
      data.fees = data.fees || {};
      data.exam = data.exam || {};

      await this.db.collection('candidates').insertOne(data);

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

      let oldCandidate = null;
      try {
        oldCandidate = await this.db.collection('candidates').findOne({ id });
      } catch (err) {
        console.error('[Backend Find Candidate error]', err);
      }

      // Capture changes to trigger alerts
      const scheduleChanged = data.appointmentDate && (!oldCandidate || oldCandidate.appointmentDate !== data.appointmentDate);
      const codeGeneratedJustNow = data.exam?.agentCodeGenerated && (!oldCandidate || !oldCandidate.exam?.agentCodeGenerated);

      // If schedule changed, trigger notification
      if (scheduleChanged) {
        const mobile = data.mobile;
        const email = data.email;
        if (mobile || email) {
          const text = `Aynkaran Consultants: Dear candidate ${data.name}, your recruitment meeting has been confirmed / scheduled for ${data.appointmentDate}. Location: Aynkaran Head Office. We look forward to meeting you.`;
          if (mobile) {
            sendSMSNotification(mobile, text).catch(e => console.error('[Backend Candidate Rec SMS failed]', e));
            sendSMSNotification(`whatsapp:${mobile}`, text).catch(e => console.error('[Backend Candidate Rec WA failed]', e));
          }
          if (email && email !== 'no-email@aynakaran.com') {
            sendEmailReceipt(email, `Recruitment Meeting Scheduled - ${data.name}`, text).catch(e => console.error('[Backend Candidate Rec Email failed]', e));
          }
        }
      }

      // If code generated, trigger notification
      if (codeGeneratedJustNow) {
        const mobile = data.mobile;
        const email = data.email;
        const agentCode = data.exam?.agentCodeGenerated;
        if (mobile || email) {
          const text = `Aynkaran Consultants: Congratulations ${data.name}! Your IRDAI Agent Code has been generated successfully. Agent ID: ${agentCode}. You are requested to attend the compulsory One-day Induction Program at Aynkaran Consultants to activate your active insurance sales workspace.`;
          if (mobile) {
            sendSMSNotification(mobile, text).catch(e => console.error('[Backend Candidate Induction SMS failed]', e));
            sendSMSNotification(`whatsapp:${mobile}`, text).catch(e => console.error('[Backend Candidate Induction WA failed]', e));
          }
          if (email && email !== 'no-email@aynakaran.com') {
            sendEmailReceipt(email, `Agent License Generated - Induction Program Session`, text).catch(e => console.error('[Backend Candidate Induction Email failed]', e));
          }
        }
      }

      await this.db.collection('candidates').updateOne({ id }, { $set: data });
      res.json({ id, ...data });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      await this.db.collection('candidates').deleteOne({ id });
      res.json({ success: true, message: 'Trainee candidate profile cleared securely.' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };
}
