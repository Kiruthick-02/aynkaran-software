// backend/routes/policyRoutes.js
import express from 'express';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import { uploadCompanyMedia } from '../middleware/uploadMiddleware.js';
import { uploadBufferToStorage, toPublicHttpsUrl } from '../utils/storageService.js';

function parseJsonArray(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizePoints(arr) {
  return (Array.isArray(arr) ? arr : [])
    .filter((p) => p && String(p.text || p).trim())
    .map((p, i) => ({
      text: String(typeof p === 'string' ? p : p.text).trim(),
      order: typeof p?.order === 'number' ? p.order : i,
    }));
}

export function policyRoutes(db) {
  const router = express.Router();
  const collection = db.collection('insurance_companies');
  const typesCollection = db.collection('insurance_types');

  // Seed default insurance types once
  (async () => {
    try {
      const count = await typesCollection.countDocuments();
      if (count === 0) {
        await typesCollection.insertMany([
          { name: 'Life Insurance', isDefault: true, createdAt: new Date() },
          { name: 'Health Insurance', isDefault: true, createdAt: new Date() },
          { name: 'General Insurance', isDefault: true, createdAt: new Date() },
        ]);
        console.log('[System] Default insurance types seeded');
      }
    } catch (e) {
      console.error('[System] Failed to seed insurance types', e.message);
    }
  })();

  // Multer only when multipart (so JSON Stop Control still works)
  function optionalCompanyUpload(req, res, next) {
    const ct = req.headers['content-type'] || '';
    if (ct.includes('multipart/form-data')) {
      return uploadCompanyMedia(req, res, next);
    }
    next();
  }

  // ==================== INSURANCE TYPES ====================
  router.get('/insurance-types', async (req, res) => {
    try {
      const types = await typesCollection.find({}).sort({ name: 1 }).toArray();
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/insurance-types', async (req, res) => {
    try {
      const name = (req.body.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Name is required' });

      const exists = await typesCollection.findOne({
        name: {
          $regex: new RegExp(
            `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
            'i'
          ),
        },
      });
      if (exists) {
        return res.status(400).json({ error: `Type "${name}" already exists` });
      }

      const doc = { name, isDefault: false, createdAt: new Date() };
      const result = await typesCollection.insertOne(doc);
      res.status(201).json({ _id: result.insertedId, ...doc });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== LIST COMPANIES ====================
  router.get('/companies', async (req, res) => {
    try {
      const companies = await collection.find({}).sort({ createdAt: -1 }).toArray();
      res.json(companies);
      const shaped = companies.map(c => ({
        ...c,
        logo: toPublicHttpsUrl(c.logo),
        backgroundImage: toPublicHttpsUrl(c.backgroundImage),
        policies: (c.policies || []).map(p => ({
          ...p,
          brochurePath: toPublicHttpsUrl(p.brochurePath)
        }))
      }));
      res.json(shaped);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== CREATE COMPANY ====================
  router.post('/companies', uploadCompanyMedia, async (req, res) => {
    try {
      const body = req.body || {};
      const logoFile = req.files?.logo?.[0];
      const bgFile = req.files?.backgroundImage?.[0];

      const name = (body.name || '').trim();
      if (!name) {
        return res.status(400).json({ error: 'Company name is required' });
      }

      const existing = await collection.findOne({
        name: {
          $regex: new RegExp(
            `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
            'i'
          ),
        },
      });
      if (existing) {
        return res.status(400).json({
          error: `Duplicate company name. "${name}" already exists in the system.`,
        });
      }

      let insuranceTypes = [];
      try {
        insuranceTypes =
          typeof body.insuranceTypes === 'string'
            ? JSON.parse(body.insuranceTypes || '[]')
            : body.insuranceTypes || [];
      } catch {
        insuranceTypes = body.type ? [body.type] : [];
      }

      if (!Array.isArray(insuranceTypes) || insuranceTypes.length === 0) {
        return res.status(400).json({ error: 'Select at least one Insurance Type' });
      }

      const status = body.status || 'Active';
      const websiteVisibility =
        status === 'Active' ? 'show' : body.websiteVisibility || 'show';

      const descriptionPoints = normalizePoints(
        parseJsonArray(body.descriptionPoints, [])
      );

      let logoUrl = null;
      if (logoFile) {
        try {
          const buffer = fs.readFileSync(logoFile.path);
          const storageRes = await uploadBufferToStorage(buffer, logoFile.filename, 'companies', logoFile.mimetype);
          logoUrl = storageRes.publicUrl;
        } catch (e) {
          logoUrl = toPublicHttpsUrl(`/uploads/companies/${logoFile.filename}`);
        }
      }

      let bgUrl = null;
      if (bgFile) {
        try {
          const buffer = fs.readFileSync(bgFile.path);
          const storageRes = await uploadBufferToStorage(buffer, bgFile.filename, 'companies', bgFile.mimetype);
          bgUrl = storageRes.publicUrl;
        } catch (e) {
          bgUrl = toPublicHttpsUrl(`/uploads/companies/${bgFile.filename}`);
        }
      }

      const newCompany = {
        name,
        registrationCode: (body.registrationCode || 'N/A').trim(),
        type: insuranceTypes[0],
        insuranceTypes,
        address: (body.address || 'N/A').trim(),
        contact: (body.contact || 'N/A').trim(),
        status,
        websiteVisibility,
        consultationEnabled: status === 'Active',
        descriptionPoints,
        logo: logoFile ? `/uploads/companies/${logoFile.filename}` : null,
        backgroundImage: bgFile
          ? `/uploads/companies/${bgFile.filename}`
          : null,
        logo: logoUrl,
        backgroundImage: bgUrl,
        stopStartDate:
          status === 'Temporarily Stopped' ? body.stopStartDate || null : null,
        stopEndDate:
          status === 'Temporarily Stopped' ? body.stopEndDate || null : null,
        stopReason:
          status === 'Temporarily Stopped' ? body.stopReason || null : null,
        policies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(newCompany);
      res.status(201).json({ _id: result.insertedId, ...newCompany });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== UPDATE COMPANY ====================
  router.put('/companies/:id', optionalCompanyUpload, async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid company id' });
      }

      const body = req.body || {};
      const logoFile = req.files?.logo?.[0];
      const bgFile = req.files?.backgroundImage?.[0];
      const updateData = { updatedAt: new Date() };

      if (body.name !== undefined) {
        const name = String(body.name).trim();
        if (!name) {
          return res.status(400).json({ error: 'Company name is required' });
        }

        const existing = await collection.findOne({
          _id: { $ne: new ObjectId(id) },
          name: {
            $regex: new RegExp(
              `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
              'i'
            ),
          },
        });
        if (existing) {
          return res.status(400).json({
            error: `Duplicate company name. "${name}" already exists in the system.`,
          });
        }
        updateData.name = name;
      }

      if (body.registrationCode !== undefined) {
        updateData.registrationCode =
          String(body.registrationCode).trim() || 'N/A';
      }
      if (body.address !== undefined) {
        updateData.address = String(body.address).trim() || 'N/A';
      }
      if (body.contact !== undefined) {
        updateData.contact = String(body.contact).trim() || 'N/A';
      }
      if (body.status !== undefined) updateData.status = body.status;
      if (body.websiteVisibility !== undefined) {
        updateData.websiteVisibility = body.websiteVisibility;
      }
      if (body.consultationEnabled !== undefined) {
        updateData.consultationEnabled =
          body.consultationEnabled === true ||
          body.consultationEnabled === 'true';
      }
      if (body.stopStartDate !== undefined) {
        updateData.stopStartDate = body.stopStartDate || null;
      }
      if (body.stopEndDate !== undefined) {
        updateData.stopEndDate = body.stopEndDate || null;
      }
      if (body.stopReason !== undefined) {
        updateData.stopReason = body.stopReason || null;
      }

      if (body.insuranceTypes !== undefined) {
        try {
          updateData.insuranceTypes =
            typeof body.insuranceTypes === 'string'
              ? JSON.parse(body.insuranceTypes)
              : body.insuranceTypes;
        } catch {
          updateData.insuranceTypes = Array.isArray(body.insuranceTypes)
            ? body.insuranceTypes
            : [body.insuranceTypes];
        }
        if (updateData.insuranceTypes?.length) {
          updateData.type = updateData.insuranceTypes[0];
        }
      } else if (body.type !== undefined) {
        updateData.type = body.type;
      }

      if (body.descriptionPoints !== undefined) {
        updateData.descriptionPoints = normalizePoints(
          parseJsonArray(body.descriptionPoints, [])
        );
      }

      if (logoFile) updateData.logo = `/uploads/companies/${logoFile.filename}`;
      if (logoFile) {
        try {
          const buffer = fs.readFileSync(logoFile.path);
          const storageRes = await uploadBufferToStorage(buffer, logoFile.filename, 'companies', logoFile.mimetype);
          updateData.logo = storageRes.publicUrl;
        } catch (e) {
          updateData.logo = toPublicHttpsUrl(`/uploads/companies/${logoFile.filename}`);
        }
      }

      if (bgFile) {
        updateData.backgroundImage = `/uploads/companies/${bgFile.filename}`;
        try {
          const buffer = fs.readFileSync(bgFile.path);
          const storageRes = await uploadBufferToStorage(buffer, bgFile.filename, 'companies', bgFile.mimetype);
          updateData.backgroundImage = storageRes.publicUrl;
        } catch (e) {
          updateData.backgroundImage = toPublicHttpsUrl(`/uploads/companies/${bgFile.filename}`);
        }
      }

      // Fully Active
      if (updateData.status === 'Active') {
        updateData.consultationEnabled = true;
        updateData.websiteVisibility = 'show';
        updateData.stopStartDate = null;
        updateData.stopEndDate = null;
        updateData.stopReason = null;
      }

      // Paused → always disable consultation
      if (updateData.status === 'Temporarily Stopped') {
        updateData.consultationEnabled = false;
        if (!updateData.websiteVisibility) {
          updateData.websiteVisibility = 'show';
        }
      }

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) {
        return res.status(404).json({ error: 'Company not found' });
      }

      res.json(result);
      res.json({
        ...result,
        logo: toPublicHttpsUrl(result.logo),
        backgroundImage: toPublicHttpsUrl(result.backgroundImage)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== POLICY SCHEMES ====================
  router.post('/companies/:id/policies', async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid company id' });
      }

      const name = (req.body.name || '').trim();
      if (!name) {
        return res.status(400).json({ error: 'Scheme name is required' });
      }

      const brochureRaw = req.body.brochurePath || req.body.filePath || null;
      const newPolicy = {
        id: `pol_${Date.now()}`,
        name,
        keyFeatures: normalizePoints(req.body.keyFeatures),
        eligibilityCriteria: normalizePoints(req.body.eligibilityCriteria),
        brochurePath:
          req.body.brochurePath || req.body.filePath || null,
        brochurePath: brochureRaw ? toPublicHttpsUrl(brochureRaw) : null,
        brochureFileName:
          req.body.brochureFileName || req.body.fileName || null,
        websiteVisibility: req.body.websiteVisibility || 'show',
        consultationEnabled: req.body.consultationEnabled !== false,
        createdAt: new Date(),
      };

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $push: { policies: newPolicy },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        return res.status(404).json({ error: 'Company not found' });
      }

      res.status(201).json(newPolicy);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/companies/:id/policies/:policyId', async (req, res) => {
    try {
      const { id, policyId } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid company id' });
      }

      const setFields = {
        'policies.$.updatedAt': new Date(),
      };

      if (req.body.name !== undefined) {
        setFields['policies.$.name'] = String(req.body.name).trim();
      }
      if (req.body.websiteVisibility !== undefined) {
        setFields['policies.$.websiteVisibility'] = req.body.websiteVisibility;
      }
      if (req.body.consultationEnabled !== undefined) {
        setFields['policies.$.consultationEnabled'] =
          req.body.consultationEnabled;
      }
      if (req.body.keyFeatures !== undefined) {
        setFields['policies.$.keyFeatures'] = normalizePoints(req.body.keyFeatures);
      }
      if (req.body.eligibilityCriteria !== undefined) {
        setFields['policies.$.eligibilityCriteria'] = normalizePoints(
          req.body.eligibilityCriteria
        );
      }
      if (req.body.brochurePath !== undefined || req.body.filePath !== undefined) {
        setFields['policies.$.brochurePath'] =
          req.body.brochurePath || req.body.filePath || null;
        const raw = req.body.brochurePath || req.body.filePath || null;
        setFields['policies.$.brochurePath'] = raw ? toPublicHttpsUrl(raw) : null;
      }
      if (
        req.body.brochureFileName !== undefined ||
        req.body.fileName !== undefined
      ) {
        setFields['policies.$.brochureFileName'] =
          req.body.brochureFileName || req.body.fileName || null;
      }

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id), 'policies.id': policyId },
        { $set: setFields },
        { returnDocument: 'after' }
      );

      if (!result) {
        return res.status(404).json({ error: 'Company or scheme not found' });
      }

      const updatedBrochure = req.body.brochurePath || req.body.filePath;
      res.json({
        id: policyId,
        name: req.body.name,
        keyFeatures: normalizePoints(req.body.keyFeatures),
        eligibilityCriteria: normalizePoints(req.body.eligibilityCriteria),
        brochurePath:
          req.body.brochurePath || req.body.filePath || null,
        brochurePath: updatedBrochure ? toPublicHttpsUrl(updatedBrochure) : null,
        brochureFileName:
          req.body.brochureFileName || req.body.fileName || null,
        websiteVisibility: req.body.websiteVisibility,
        consultationEnabled: req.body.consultationEnabled,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/companies/:id/policies/:policyId', async (req, res) => {
    try {
      const { id, policyId } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid company id' });
      }

      await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $pull: { policies: { id: policyId } },
          $set: { updatedAt: new Date() },
        }
      );
      res.json({ message: 'Policy scheme removed successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== PUBLIC CATALOG ====================
  // ==================== PUBLIC CATALOG (GET /api/public/catalog) ====================
  router.get('/public/catalog', async (req, res) => {
    try {
      const companies = await collection
        .find({
          $or: [
            { status: 'Active' },
            { status: 'Temporarily Stopped', websiteVisibility: 'show' },
          ],
        })
        .toArray();

      const websiteCompanies = companies.map((c) => {
        const isFullyActive = c.status === 'Active';

        return {
          id: c._id.toString(),
          name: c.name,
          shortDescription:
            c.address || `${c.name} – trusted partner of Aynkaran Consultants.`,
          description:
            c.address ||
            `${c.name} offers reliable insurance solutions through Aynkaran Consultants.`,
          descriptionPoints: Array.isArray(c.descriptionPoints)
            ? c.descriptionPoints
            : [],
          logo: c.logo || null,
          backgroundImage: c.backgroundImage || null,
          logo: toPublicHttpsUrl(c.logo),
          backgroundImage: toPublicHttpsUrl(c.backgroundImage),
          categories: c.insuranceTypes?.length
            ? c.insuranceTypes.map((t) =>
                String(t).replace(/ Insurance$/i, '')
              )
            : [String(c.type || 'Life').replace(/ Insurance$/i, '')],
          claimRatio: c.claimRatio || '98%',
          rating: 4.8,
          isActive: isFullyActive,
          consultationEnabled: isFullyActive,
          websiteVisibility: c.websiteVisibility || 'show',
          status: c.status,
        };
      });

      const websiteProducts = [];
      companies.forEach((c) => {
        const isFullyActive = c.status === 'Active';

        (c.policies || [])
          .filter((p) => p.websiteVisibility !== 'hide')
          .forEach((p) => {
            const features = normalizePoints(p.keyFeatures).map((x) => x.text);
            const eligibilityCriteria = normalizePoints(
              p.eligibilityCriteria
            ).map((x) => x.text);

            websiteProducts.push({
              id: p.id || `${c._id}-${p.name}`,
              title: p.name,
              category: String(
                c.insuranceTypes?.[0] || c.type || 'Life'
              ).replace(/ Insurance$/i, ''),
              description: `Policy scheme under ${c.name}.`,
              features: features.length ? features : [`Offered by ${c.name}`],
              keyFeatures: features,
              benefits: ['Partner product via Aynkaran Consultants'],
              eligibilityCriteria,
              eligibility:
                eligibilityCriteria.join(' · ') || 'As per insurer guidelines',
              docsRequired: ['KYC documents as required by insurer'],
              claimProcess: ['Contact Aynkaran Claims Desk for assistance'],
              partnerId: c._id.toString(),
              partnerName: c.name,
              consultationEnabled: isFullyActive,
              logo: c.logo || null,
              brochurePath: p.brochurePath || null,
              logo: toPublicHttpsUrl(c.logo),
              brochurePath: toPublicHttpsUrl(p.brochurePath),
              brochureFileName: p.brochureFileName || null,
            });
          });
      });

      res.json({ companies: websiteCompanies, products: websiteProducts });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}