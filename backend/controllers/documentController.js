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
      const base64Data = req.file.buffer.toString('base64');
      const fileUrl = `data:${req.file.mimetype};base64,${base64Data}`;

      const newDoc = {
        id: `doc-${Date.now().toString().slice(-5)}`,
        name: req.file.originalname,
        category: category || 'Miscellaneous',
        url: fileUrl,
        uploadedAt: new Date().toISOString()
      };

      if (targetType === 'recruitment') {
        if (this.db && typeof this.db.collection === 'function') {
          const candidate = await this.db.collection('candidates').findOne({ id: targetId });
          if (!candidate) return res.status(404).json({ error: 'Candidate file target not found.' });

          const docs = typeof candidate.documents === 'string' ? JSON.parse(candidate.documents || '[]') : (candidate.documents || []);
          docs.push(newDoc);

          const updateData = { documents: docs };
          if (category === 'profilePicture') {
            updateData.profilePicture = fileUrl;
          }

          await this.db.collection('candidates').updateOne(
            { id: targetId },
            { $set: updateData }
          );
        } else {
          const candidate = this.db.candidates?.find(c => c.id === targetId);
          if (!candidate) return res.status(404).json({ error: 'Candidate file target not found.' });
          candidate.documents = candidate.documents || [];
          candidate.documents.push(newDoc);
          if (category === 'profilePicture') {
            candidate.profilePicture = fileUrl;
          }
          try {
            const fs = await import('fs');
            const path = await import('path');
            fs.writeFileSync(path.join(process.cwd(), 'database.json'), JSON.stringify(this.db, null, 2), 'utf-8');
          } catch (e) {
            console.error('Failed to write database file', e);
          }
        }
      } else if (targetType === 'customers') {
        if (this.db && typeof this.db.collection === 'function') {
          const customer = await this.db.collection('customers').findOne({ id: targetId });
          if (!customer) return res.status(404).json({ error: 'Customer ledger target not found.' });

          const kyc = typeof customer.kycDocuments === 'string' ? JSON.parse(customer.kycDocuments || '{}') : (customer.kycDocuments || {});
          kyc[category || 'other'] = fileUrl;

          const uploadDates = typeof customer.kycUploadDates === 'string' ? JSON.parse(customer.kycUploadDates || '{}') : (customer.kycUploadDates || {});
          uploadDates[category || 'other'] = new Date().toISOString().split('T')[0];

          await this.db.collection('customers').updateOne(
            { id: targetId },
            { $set: { kycDocuments: kyc, kycUploadDates: uploadDates } }
          );
        } else {
          const customer = this.db.customers?.find(c => c.id === targetId);
          if (!customer) return res.status(404).json({ error: 'Customer ledger target not found.' });
          
          customer.kycDocuments = customer.kycDocuments || {};
          customer.kycDocuments[category || 'other'] = fileUrl;

          customer.kycUploadDates = customer.kycUploadDates || {};
          customer.kycUploadDates[category || 'other'] = new Date().toISOString().split('T')[0];
          try {
            const fs = await import('fs');
            const path = await import('path');
            fs.writeFileSync(path.join(process.cwd(), 'database.json'), JSON.stringify(this.db, null, 2), 'utf-8');
          } catch (e) {
            console.error('Failed to write database file', e);
          }
        }
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
