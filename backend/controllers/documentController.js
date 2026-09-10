// backend/controllers/documentController.js
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_UPLOADS = path.join(__dirname, '..', 'uploads');

/**
 * Map frontend category → fields stored on the customer document
 * so Documents vault + Customers module can read them.
 */
const CATEGORY_FIELD_MAP = {
  aadhaar: { url: 'aadhaarUrl', fileName: 'aadhaarFileName', kycKey: 'aadhaar' },
  aadhaarcard: { url: 'aadhaarUrl', fileName: 'aadhaarFileName', kycKey: 'aadhaar' },
  photo: { url: 'photoUrl', fileName: 'photoFileName', kycKey: 'passportSizePhoto' },
  passportphoto: { url: 'photoUrl', fileName: 'photoFileName', kycKey: 'passportSizePhoto' },
  passportsizphoto: { url: 'photoUrl', fileName: 'photoFileName', kycKey: 'passportSizePhoto' },
  passportsizepicture: { url: 'photoUrl', fileName: 'photoFileName', kycKey: 'passportSizePhoto' },
  pan: { url: 'panUrl', fileName: 'panFileName', kycKey: 'pan' },
  pancard: { url: 'panUrl', fileName: 'panFileName', kycKey: 'pan' },
  marksheet: { url: 'marksheetUrl', fileName: 'marksheetFileName', kycKey: 'educationCertificate' },
  educationcertificate: { url: 'marksheetUrl', fileName: 'marksheetFileName', kycKey: 'educationCertificate' },
  bankproof: { url: 'bankProofUrl', fileName: 'bankProofFileName', kycKey: 'bankProof' },
  bank_proof: { url: 'bankProofUrl', fileName: 'bankProofFileName', kycKey: 'bankProof' },
  bankpassbook: { url: 'bankProofUrl', fileName: 'bankProofFileName', kycKey: 'bankProof' },
  signature: { url: 'signatureUrl', fileName: 'signatureFileName', kycKey: 'signatureCopy' },
  incomeproof: { url: 'incomeProofUrl', fileName: 'incomeProofFileName', kycKey: 'incomeProof' },
  income_proof: { url: 'incomeProofUrl', fileName: 'incomeProofFileName', kycKey: 'incomeProof' },
  profilepicture: { url: 'photoUrl', fileName: 'photoFileName', kycKey: 'passportSizePhoto' },
  license: { url: 'licenseDocumentUrl', fileName: 'licenseFileName', kycKey: 'licenseDocument' },
};

function normalizeCategory(category) {
  return String(category || 'other')
    .toLowerCase()
    .replace(/[\s-]+/g, '');
}

function resolveFolder(targetType) {
  const t = String(targetType || 'misc').toLowerCase();
  if (t === 'customer' || t === 'customers') return 'customers';
  if (t === 'candidate' || t === 'candidates' || t === 'recruitment') return 'candidates';
  if (t === 'advisor' || t === 'advisors') return 'advisors';
  if (
    t === 'company' ||
    t === 'companies' ||
    t === 'policy' ||
    t === 'policies'
  )
    return 'companies';
  return 'misc';
}

function isCandidateTarget(targetType) {
  return ['candidate', 'candidates', 'recruitment'].includes(String(targetType || '').toLowerCase());
}

function isAdvisorTarget(targetType) {
  return ['advisor', 'advisors'].includes(String(targetType || '').toLowerCase());
}

export class DocumentController {
  constructor(db) {
    this.db = db;
  }

  // Keep the vault consistent with advisor deletion, including records created
  // before the cascade-delete behaviour was introduced.
  getAll = async (req, res) => {
    try {
      const advisors = await this.db.collection('advisors').find({}, { projection: { id: 1, advisorCode: 1, candidateId: 1 } }).toArray();
      const advisorDocumentIds = new Set(
        advisors.flatMap(advisor => [advisor.id, advisor._id, advisor.advisorCode])
          .filter(Boolean)
          .map(value => String(value))
      );
      const advisorCandidateIds = new Set(advisors.map(a => String(a.candidateId || '')).filter(Boolean));
      const convertedCandidates = await this.db.collection('candidates').find({ isConvertedToAdvisor: true }).toArray();
      const orphanCandidateIds = convertedCandidates
        .filter(candidate => !advisorCandidateIds.has(String(candidate.id || candidate._id)))
        .map(candidate => String(candidate.id || candidate._id));

      if (orphanCandidateIds.length) {
        await this.db.collection('documents').deleteMany({ targetId: { $in: orphanCandidateIds } });
        await this.db.collection('candidates').updateMany(
          { $or: [{ id: { $in: orphanCandidateIds } }, { _id: { $in: orphanCandidateIds } }] },
          { $set: { documents: [], aadhaarUrl: null, panUrl: null, photoUrl: null, profilePicture: null, passportPhoto: null, marksheetUrl: null, bankProofUrl: null, signatureUrl: null, licenseDocumentUrl: null } }
        );
      }

      // Remove advisor uploads whose owner no longer exists.  This also
      // clears vault entries left behind by records deleted before the
      // cascade-delete flow was added.
      const advisorDocuments = await this.db.collection('documents')
        .find({ targetType: { $in: ['advisor', 'advisors'] } }, { projection: { targetId: 1 } })
        .toArray();
      const orphanAdvisorTargetIds = [...new Set(
        advisorDocuments
          .map(document => String(document.targetId || ''))
          .filter(targetId => targetId && !advisorDocumentIds.has(targetId))
      )];
      if (orphanAdvisorTargetIds.length) {
        await this.db.collection('documents').deleteMany({
          targetType: { $in: ['advisor', 'advisors'] },
          targetId: { $in: orphanAdvisorTargetIds }
        });
      }

      const candidates = await this.db.collection('candidates').find({}, { projection: { id: 1, name: 1, fullName: 1 } }).toArray();
      const candidateById = new Map(candidates.flatMap(candidate => [
        [String(candidate.id || ''), candidate],
        [String(candidate._id || ''), candidate]
      ]).filter(([id]) => id));
      const advisorById = new Map(advisors.flatMap(advisor => [
        [String(advisor.id || ''), advisor],
        [String(advisor._id || ''), advisor],
        [String(advisor.advisorCode || ''), advisor]
      ]).filter(([id]) => id));
      const storedDocuments = await this.db.collection('documents', { projection: { fileData: 0 } }).find({}, { projection: { fileData: 0 } }).sort({ uploadedAt: -1 }).toArray();
      // Some older recruitment saves store the document only in the trainee
      // record. Expose those mirrored records too, so the Vault and the
      // Recruitment screen never disagree about a successfully uploaded file.
      const candidateDocumentFallbacks = candidates.flatMap(candidate => {
        const entries = Array.isArray(candidate.documents)
          ? candidate.documents
          : typeof candidate.documents === 'string'
          ? (() => { try { return JSON.parse(candidate.documents || '[]'); } catch { return []; } })()
          : [];
        const targetId = String(candidate.id || candidate._id || '');
        return entries.filter(entry => entry && (entry.path || entry.url)).map((entry, index) => ({
          id: entry.id || `candidate-${targetId}-document-${index}`,
          name: entry.name || entry.fileName || 'Candidate Document',
          fileName: entry.fileName || entry.name || 'Candidate Document',
          category: entry.category || entry.label || 'Candidate Document',
          path: entry.path || entry.url,
          url: entry.url || entry.path,
          targetId,
          targetType: 'candidate',
          verificationStatus: entry.verificationStatus || 'PENDING',
          rejectionReason: entry.rejectionReason || null,
          uploadedAt: entry.uploadedAt || candidate.updatedAt || candidate.createdAt || new Date().toISOString()
        }));
      });
      const storedKeys = new Set(storedDocuments.map(document => `${document.targetId}|${document.path || document.url}|${document.category || ''}`));
      const documents = [
        ...storedDocuments,
        ...candidateDocumentFallbacks.filter(document => !storedKeys.has(`${document.targetId}|${document.path || document.url}|${document.category || ''}`))
      ];
      const liveDocuments = documents.filter(document => {
        const type = String(document.targetType || '').toLowerCase();
        const targetId = String(document.targetId || '');
        if (type === 'advisor' || type === 'advisors') return advisorById.has(targetId);
        if (type === 'candidate' || type === 'candidates' || type === 'recruitment') return candidateById.has(targetId);
        return true;
      }).map(document => {
        const type = String(document.targetType || '').toLowerCase();
        const owner = (type === 'advisor' || type === 'advisors')
          ? advisorById.get(String(document.targetId || ''))
          : (type === 'candidate' || type === 'candidates' || type === 'recruitment')
          ? candidateById.get(String(document.targetId || ''))
          : null;
        return {
          ...document,
          _id: undefined,
          ownerName: owner?.fullName || owner?.name || null
        };
      });
      res.json({ success: true, documents: liveDocuments });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  upload = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded. Send multipart field name "file".',
        });
      }

      const category = req.body.category || 'Miscellaneous';
      const targetId = req.body.targetId || '';
      const targetType = req.body.targetType || 'misc';
      const folder = resolveFolder(targetType);
      const binaryData = fs.readFileSync(req.file.path);

      // Public path served by express.static('/uploads')
      const originalName = req.file.originalname || req.file.filename;
      const documentId = `doc-${Date.now().toString().slice(-6)}`;
      const publicPath = this.db?.collection
        ? `/api/documents/file/${documentId}`
        : `/uploads/${folder}/${req.file.filename}`;

      const newDoc = {
        id: documentId,
        name: originalName,
        fileName: originalName,
        category,
        path: publicPath,
        url: publicPath,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fileData: this.db?.collection ? binaryData : undefined,
        targetId,
        targetType,
        verificationStatus: 'PENDING',
        rejectionReason: null,
        uploadedAt: new Date().toISOString(),
      };

      // A replacement is one logical document, not an extra vault entry.
      // Remove the prior entry for this owner/category before writing the new
      // source record and the canonical vault record.
      if (this.db?.collection) {
        await this.db.collection('documents').deleteMany({
          targetId,
          targetType: { $in: targetType === 'candidate' || targetType === 'recruitment' || targetType === 'candidates'
            ? ['candidate', 'candidates', 'recruitment']
            : targetType === 'advisor' || targetType === 'advisors'
            ? ['advisor', 'advisors']
            : [targetType] },
          category
        });
        await this.db.collection('documents').insertOne(newDoc).catch(e => console.warn('[Doc Record Insert]', e.message));
      }

      // ---------- Update customer record ----------
      if (
        (targetType === 'customer' || targetType === 'customers') &&
        targetId &&
        this.db?.collection
      ) {
        const catKey = normalizeCategory(category);
        const fieldMap = CATEGORY_FIELD_MAP[catKey];

        const customer = await this.db.collection('customers').findOne({
          $or: [{ id: targetId }, { _id: targetId }],
        });

        if (customer) {
          const kyc =
            typeof customer.kycDocuments === 'string'
              ? JSON.parse(customer.kycDocuments || '{}')
              : customer.kycDocuments || {};
          const uploadDates =
            typeof customer.kycUploadDates === 'string'
              ? JSON.parse(customer.kycUploadDates || '{}')
              : customer.kycUploadDates || {};

          const kycKey = fieldMap?.kycKey || catKey || 'other';
          kyc[kycKey] = publicPath;
          uploadDates[kycKey] = new Date().toISOString().split('T')[0];

          const $set = {
            kycDocuments: kyc,
            kycUploadDates: uploadDates,
          };

          if (fieldMap) {
            $set[fieldMap.url] = publicPath;
            $set[fieldMap.fileName] = originalName;
          }

          const docs = Array.isArray(customer.documents)
            ? [...customer.documents]
            : [];
          const syncedDoc = {
            id: newDoc.id,
            label: category,
            category,
            path: publicPath,
            fileName: originalName,
            url: publicPath,
            uploadedAt: newDoc.uploadedAt,
          };
          $set.documents = [
            ...docs.filter(doc => String(doc.category || doc.label || '') !== String(category)),
            syncedDoc
          ];

          await this.db.collection('customers').updateOne(
            { id: customer.id || targetId },
            { $set }
          );
        }
      }

      // ---------- Update candidate / recruitment record ----------
      if (
        (targetType === 'recruitment' ||
          targetType === 'candidate' ||
          targetType === 'candidates') &&
        targetId &&
        this.db?.collection
      ) {
        const candidate = await this.db.collection('candidates').findOne({
          $or: [{ id: targetId }, { _id: targetId }],
        });

        if (candidate) {
          const docs = Array.isArray(candidate.documents)
            ? [...candidate.documents]
            : typeof candidate.documents === 'string'
            ? JSON.parse(candidate.documents || '[]')
            : [];

          const syncedDoc = {
            id: newDoc.id,
            name: originalName,
            fileName: originalName,
            category,
            path: publicPath,
            url: publicPath,
            verificationStatus: 'PENDING',
            rejectionReason: null,
            uploadedAt: newDoc.uploadedAt,
          };
          const filteredDocs = docs.filter(doc => String(doc.category || doc.label || '') !== String(category));
          filteredDocs.push(syncedDoc);

          const $set = {
            documents: filteredDocs,
            documentCollectionDate: new Date().toISOString().split('T')[0],
          };

          const catKey = normalizeCategory(category);
          if (catKey.includes('photo') || catKey.includes('profile') || catKey.includes('passport')) {
            $set.profilePicture = publicPath;
            $set.photoUrl = publicPath;
            $set.passportPhoto = publicPath;
            $set.passportPhotoUrl = publicPath;
            $set.photoFileName = originalName;
          }
          if (catKey.includes('aadhaar')) {
            $set.aadhaarUrl = publicPath;
            $set.aadhaarFile = publicPath;
            $set.aadhaarDocUrl = publicPath;
            $set.aadhaarFileName = originalName;
          }
          if (catKey.includes('pan')) {
            $set.panUrl = publicPath;
            $set.panFile = publicPath;
            $set.panDoc = publicPath;
            $set.panFileName = originalName;
          }
          if (catKey.includes('bank') || catKey.includes('cheque') || catKey.includes('passbook')) {
            $set.bankProofUrl = publicPath;
            $set.bankProofFile = publicPath;
            $set.bankProofDoc = publicPath;
            $set.bankProofFileName = originalName;
          }
          if (catKey.includes('education') || catKey.includes('marksheet') || catKey.includes('certificate')) {
            $set.marksheetUrl = publicPath;
            $set.marksheetFile = publicPath;
            $set.marksheetDoc = publicPath;
            $set.marksheetFileName = originalName;
          }
          if (catKey.includes('signature')) {
            $set.signatureUrl = publicPath;
            $set.signatureFile = publicPath;
            $set.signatureDoc = publicPath;
            $set.signatureFileName = originalName;
          }

          await this.db.collection('candidates').updateOne(
            { $or: [{ id: targetId }, { _id: targetId }, { id: candidate.id }, { _id: candidate._id }] },
            { $set }
          );
        }
      }

      // ---------- Update advisor record ----------
      if (
        (targetType === 'advisor' || targetType === 'advisors') &&
        targetId &&
        this.db?.collection
      ) {
        const advisor = await this.db.collection('advisors').findOne({
          $or: [{ id: targetId }, { advisorCode: targetId }],
        });

        if (advisor) {
          const docs = Array.isArray(advisor.documents)
            ? [...advisor.documents]
            : [];

          const syncedDoc = {
            id: newDoc.id,
            name: originalName,
            fileName: originalName,
            category,
            path: publicPath,
            url: publicPath,
            verificationStatus: 'PENDING',
            rejectionReason: null,
            uploadedAt: newDoc.uploadedAt,
          };
          const filteredDocs = docs.filter(doc => String(doc.category || doc.label || '') !== String(category));
          filteredDocs.push(syncedDoc);

          await this.db.collection('advisors').updateOne(
            { $or: [{ id: targetId }, { advisorCode: targetId }, { id: advisor.id }, { _id: advisor._id }] },
            { $set: { documents: filteredDocs, updatedAt: new Date().toISOString() } }
          );
        }
      }

      const responseDocument = { ...newDoc };
      delete responseDocument.fileData;

      // Response shape expected by caller
      res.status(201).json({
        success: true,
        path: publicPath,
        url: publicPath,
        filePath: publicPath,
        fileName: originalName,
        name: originalName,
        document: responseDocument,
      });
    } catch (e) {
      console.error('[DocumentController.upload]', e);
      res.status(500).json({ error: e.message });
    }
  };

  file = async (req, res) => {
    try {
      const document = await this.db.collection('documents').findOne({ id: req.params.id });
      if (!document) return res.status(404).json({ error: 'Document not found.' });

      if (document.fileData) {
        const buffer = Buffer.isBuffer(document.fileData)
          ? document.fileData
          : document.fileData.buffer;
        res.setHeader('Content-Type', document.mimetype || 'application/octet-stream');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Content-Disposition', `inline; filename="${String(document.fileName || document.name || 'document').replace(/"/g, '')}"`);
        return res.send(buffer);
      }

      const folder = resolveFolder(document.targetType);
      const legacyPath = path.join(ROOT_UPLOADS, folder, document.filename || path.basename(document.path || document.url || ''));
      if (fs.existsSync(legacyPath)) return res.sendFile(legacyPath);
      return res.status(404).json({ error: 'Document binary is unavailable.' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  download = async (req, res) => {
    try {
      const { filename, targetType } = req.params;
      const folder = resolveFolder(targetType);
      const filePath = path.join(ROOT_UPLOADS, folder, filename);

      if (fs.existsSync(filePath)) {
        return res.download(filePath);
      }
      return res.status(404).json({ error: 'Requested file does not exist.' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  /** Delete a vault record and its mirrored source-record entry. */
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const document = await this.db.collection('documents').findOne({ id });
      if (!document) return res.status(404).json({ error: 'Document not found.' });

      const targetId = String(document.targetId || '');
      const targetType = String(document.targetType || '').toLowerCase();
      const category = document.category;
      const sourceCollection = isCandidateTarget(targetType)
        ? 'candidates'
        : isAdvisorTarget(targetType)
        ? 'advisors'
        : targetType === 'customer' || targetType === 'customers'
        ? 'customers'
        : null;

      if (sourceCollection && targetId) {
        const idQuery = sourceCollection === 'advisors'
          ? { $or: [{ id: targetId }, { advisorCode: targetId }] }
          : { $or: [{ id: targetId }, { _id: targetId }] };
        const source = await this.db.collection(sourceCollection).findOne(idQuery);
        if (source) {
          const docs = Array.isArray(source.documents)
            ? source.documents
            : typeof source.documents === 'string' ? JSON.parse(source.documents || '[]') : [];
          const retained = docs.filter(item => String(item.id || '') !== String(id));
          await this.db.collection(sourceCollection).updateOne(idQuery, {
            $set: { documents: retained, updatedAt: new Date().toISOString() }
          });
        }
      }

      await this.db.collection('documents').deleteOne({ id });
      res.json({ success: true, id, category });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * Verify an uploaded document
   */
  verify = async (req, res) => {
    try {
      const { id } = req.params;
      const { targetId, targetType, verifiedBy = 'admin' } = req.body;
      const now = new Date().toISOString();

      await this.db.collection('documents').updateOne(
        { id },
        {
          $set: {
            verificationStatus: 'VERIFIED',
            verifiedBy,
            verifiedAt: now,
            rejectionReason: null
          }
        }
      );

      // Also update nested array in target
      if (targetType === 'advisor' && targetId) {
        await this.db.collection('advisors').updateOne(
          { id: targetId, 'documents.id': id },
          {
            $set: {
              'documents.$.verificationStatus': 'VERIFIED',
              'documents.$.verifiedBy': verifiedBy,
              'documents.$.verifiedAt': now,
              'documents.$.rejectionReason': null
            }
          }
        );
      } else if ((targetType === 'candidate' || targetType === 'recruitment') && targetId) {
        await this.db.collection('candidates').updateOne(
          { id: targetId, 'documents.id': id },
          {
            $set: {
              'documents.$.verificationStatus': 'VERIFIED',
              'documents.$.verifiedBy': verifiedBy,
              'documents.$.verifiedAt': now,
              'documents.$.rejectionReason': null
            }
          }
        );
      }

      res.json({ success: true, message: 'Document marked as verified.', verifiedAt: now });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * Reject an uploaded document with mandatory reason
   */
  reject = async (req, res) => {
    try {
      const { id } = req.params;
      const { targetId, targetType, reason, rejectedBy = 'admin' } = req.body;

      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'A specific rejection reason is required.' });
      }

      const now = new Date().toISOString();

      await this.db.collection('documents').updateOne(
        { id },
        {
          $set: {
            verificationStatus: 'REJECTED',
            rejectionReason: reason.trim(),
            rejectedBy,
            rejectedAt: now
          }
        }
      );

      if (targetType === 'advisor' && targetId) {
        await this.db.collection('advisors').updateOne(
          { id: targetId, 'documents.id': id },
          {
            $set: {
              'documents.$.verificationStatus': 'REJECTED',
              'documents.$.rejectionReason': reason.trim(),
              'documents.$.rejectedBy': rejectedBy,
              'documents.$.rejectedAt': now
            }
          }
        );
      } else if ((targetType === 'candidate' || targetType === 'recruitment') && targetId) {
        await this.db.collection('candidates').updateOne(
          { id: targetId, 'documents.id': id },
          {
            $set: {
              'documents.$.verificationStatus': 'REJECTED',
              'documents.$.rejectionReason': reason.trim(),
              'documents.$.rejectedBy': rejectedBy,
              'documents.$.rejectedAt': now
            }
          }
        );
      }

      res.json({ success: true, message: 'Document marked as rejected.', rejectionReason: reason.trim() });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };
}
