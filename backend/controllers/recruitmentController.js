/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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