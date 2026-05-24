/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

      await this.db.collection('policies').updateOne({ id }, { $set: data });
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
}
