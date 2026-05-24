/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Controller matching system and automated communication reminders using MongoDB Atlas
export class ReminderController {
  constructor(db) {
    this.db = db;
  }

  getAll = async (req, res) => {
    try {
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
}
