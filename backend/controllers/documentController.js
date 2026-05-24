/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import fs from 'fs';

// Trainee Candidate and Customer Dossier PDF and KYC document uploads controller using MongoDB Atlas
export class DocumentController {
  constructor(db) {
    this.db = db;
  }

  upload = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No transaction document file attachment uploaded.' });
      }

      const { category, targetId, targetType } = req.body;
      const fileUrl = `/uploads/${targetType}/${req.file.filename}`;

      const newDoc = {
        id: `doc-${Date.now().toString().slice(-5)}`,
        name: req.file.originalname,
        category: category || 'Miscellaneous',
        url: fileUrl,
        uploadedAt: new Date().toISOString()
      };

      if (targetType === 'recruitment') {
        const candidate = await this.db.collection('candidates').findOne({ id: targetId });
        if (!candidate) return res.status(404).json({ error: 'Candidate file target not found.' });

        const docs = typeof candidate.documents === 'string' ? JSON.parse(candidate.documents || '[]') : (candidate.documents || []);
        docs.push(newDoc);

        await this.db.collection('candidates').updateOne(
          { id: targetId },
          { $set: { documents: docs } }
        );
      } else if (targetType === 'customers') {
        const customer = await this.db.collection('customers').findOne({ id: targetId });
        if (!customer) return res.status(404).json({ error: 'Customer ledger target not found.' });

        const kyc = typeof customer.kycDocuments === 'string' ? JSON.parse(customer.kycDocuments || '{}') : (customer.kycDocuments || {});
        kyc[category || 'other'] = fileUrl;

        await this.db.collection('customers').updateOne(
          { id: targetId },
          { $set: { kycDocuments: kyc } }
        );
      }

      res.status(201).json({ success: true, document: newDoc });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  download = async (req, res) => {
    try {
      const { filename, targetType } = req.params;
      const filePath = path.join(process.cwd(), 'uploads', targetType, filename);

      if (fs.existsSync(filePath)) {
        res.download(filePath);
      } else {
        res.status(404).json({ error: 'Requested resource file does not exist.' });
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };
}