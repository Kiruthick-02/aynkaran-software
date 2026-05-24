/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Controller matching high density corporate client records using MongoDB Atlas
export class CustomerController {
  constructor(db) {
    this.db = db;
  }

  getAll = async (req, res) => {
    try {
      const rows = await this.db.collection('customers').find().sort({ createdAt: -1 }).toArray();
      const formatted = rows.map(r => ({
        ...r,
        id: r.id || r._id.toString(),
        _id: undefined,
        kycDocuments: typeof r.kycDocuments === 'string' ? JSON.parse(r.kycDocuments || '{}') : (r.kycDocuments || {}),
        nominee: typeof r.nominee === 'string' ? JSON.parse(r.nominee || '{}') : (r.nominee || {}),
        work: typeof r.work === 'string' ? JSON.parse(r.work || '{}') : (r.work || {}),
      }));
      res.json(formatted);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  create = async (req, res) => {
    try {
      const data = { ...req.body };
      data.id = data.id || `cust-${Date.now().toString().slice(-5)}`;
      data.createdAt = data.createdAt || new Date().toISOString();

      // Clean base64 strings if necessary or save objects natively
      data.kycDocuments = data.kycDocuments || {};
      data.nominee = data.nominee || {};
      data.work = data.work || {};

      await this.db.collection('customers').insertOne(data);

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
      delete data._id; // _id must not be modified in update

      await this.db.collection('customers').updateOne({ id }, { $set: data });
      res.json({ id, ...data });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      await this.db.collection('customers').deleteOne({ id });
      res.json({ success: true, message: 'Customer profile cleared securely.' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };
}
