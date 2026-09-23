// backend/routes/contentRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import { uploadBufferToStorage, toPublicHttpsUrl } from '../utils/storageService.js';

const uploadDir = path.join(process.cwd(), 'uploads', 'content');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

function publicPath(filename) {
  return `/uploads/content/${filename}`;
}

function shapeNews(doc) {
  const imgUrl = toPublicHttpsUrl(doc.coverImage || doc.image);
  return {
    id: doc.id || doc._id?.toString(),
    title: doc.title,
    description: doc.description,
    category: doc.category,
    coverImage: doc.coverImage || doc.image,
    image: doc.coverImage || doc.image,
    coverImage: imgUrl,
    image: imgUrl,
    publishDate: doc.publishDate,
    readTime: doc.readTime || '4 min read',
    author: doc.author || 'Aynkaran Team',
    content: doc.content || doc.description,
    tags: doc.tags || [],
  };
}

function shapeGallery(doc) {
  const url = doc.url || doc.image || '';
  const rawUrl = doc.url || doc.image || '';
  const publicMediaUrl = toPublicHttpsUrl(rawUrl);
  const type =
    doc.type ||
    (/\.(mp4|webm|mov|m4v|ogg)$/i.test(url) ? 'video' : 'image');
    (/\.(mp4|webm|mov|m4v|ogg)$/i.test(rawUrl) ? 'video' : 'image');
  return {
    id: doc.id || doc._id?.toString(),
    title: doc.title,
    category: doc.category,
    description: doc.description || '',
    url,
    image: doc.image || doc.url || url,
    url: publicMediaUrl,
    image: publicMediaUrl,
    type,
  };
}

function shapePoster(doc) {
  return {
    id: doc.id || doc._id?.toString(),
    audience: doc.audience || 'customers',
    order: typeof doc.order === 'number' ? doc.order : 0,
    url: doc.url,
    url: toPublicHttpsUrl(doc.url),
    fileName: doc.fileName || '',
    updatedAt: doc.updatedAt,
  };
}

function shapeAnnouncement(doc) {
  return {
    id: doc.id || doc._id?.toString(),
    audience: doc.audience || 'customers',
    text: doc.text || '',
    label: doc.label || '',
    order: typeof doc.order === 'number' ? doc.order : 0,
    createdAt: doc.createdAt,
  };
}

function shapeCompany(doc) {
  return {
    id: doc.id || doc._id?.toString(),
    companyName: doc.companyName || '',
    companyProfileImage: doc.companyProfileImage || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function shapeProcedure(doc) {
  return {
    id: doc.id || doc._id?.toString(),
    companyId: doc.companyId ? doc.companyId.toString() : null,
    text: doc.text || '',
    order: typeof doc.order === 'number' ? doc.order : 0,
    createdAt: doc.createdAt,
  };
}

function shapeHelpline(doc) {
  return {
    id: doc.id || doc._id?.toString(),
    companyId: doc.companyId ? doc.companyId.toString() : null,
    number: doc.number || '',
    order: typeof doc.order === 'number' ? doc.order : 0,
    createdAt: doc.createdAt,
  };
}

function validHelpline(number) {
  return /^\d{10}$/.test(String(number || '').trim());
}

export function contentRoutes(db) {
  const router = express.Router();
  const postersCol = db.collection('content_posters');
  const newsCol = db.collection('content_news');
  const galleryCol = db.collection('content_gallery');
  const announcementsCol = db.collection('content_announcements');
  const categoriesCol = db.collection('content_categories');
  const claimHelpCol = db.collection('content_claimhelp');
  const proceduresCol = db.collection('content_claimhelp_procedures');
  const helplinesCol = db.collection('content_claimhelp_helplines');

  // Build a single company's full view (image + name + ordered procedures + helplines)
  async function shapeCompanyFull(id) {
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const config = await claimHelpCol.findOne(filter);
    if (!config) return null;
    const cid = config._id.toString();
    const [procDocs, helpDocs] = await Promise.all([
      proceduresCol.find({ companyId: config._id }).sort({ order: 1 }).toArray(),
      helplinesCol.find({ companyId: config._id }).sort({ order: 1 }).toArray(),
    ]);
    return {
      ...shapeCompany(config),
      procedures: procDocs.map(shapeProcedure),
      helplineNumbers: helpDocs.map(shapeHelpline),
    };
  }

  // Build every company with their procedures + helplines (used by the aggregate + list endpoint)
  async function shapeClaimHelp() {
    const [companyDocs, procDocs, helpDocs] = await Promise.all([
      claimHelpCol.find({}).sort({ createdAt: -1 }).toArray(),
      proceduresCol.find({}).sort({ order: 1 }).toArray(),
      helplinesCol.find({}).sort({ order: 1 }).toArray(),
    ]);
    const proceduresByCompany = {};
    const helplinesByCompany = {};
    procDocs.forEach((p) => {
      const cid = p.companyId ? p.companyId.toString() : '';
      if (!proceduresByCompany[cid]) proceduresByCompany[cid] = [];
      proceduresByCompany[cid].push(shapeProcedure(p));
    });
    helpDocs.forEach((h) => {
      const cid = h.companyId ? h.companyId.toString() : '';
      if (!helplinesByCompany[cid]) helplinesByCompany[cid] = [];
      helplinesByCompany[cid].push(shapeHelpline(h));
    });
    const companies = companyDocs.map((c) => {
      const cid = c._id.toString();
      return {
        ...shapeCompany(c),
        procedures: proceduresByCompany[cid] || [],
        helplineNumbers: helplinesByCompany[cid] || [],
      };
    });
    return { companies };
  }

  // ---------- ALL CONTENT ----------
  // ---------- ALL CONTENT (GET /api/content) ----------
  router.get('/', async (_req, res) => {
    try {
      const posterDocs = await postersCol.find({}).sort({ order: 1, updatedAt: -1 }).toArray();
      const customers = [];
      const advisors = [];

      for (const d of posterDocs) {
        const shaped = shapePoster(d);
        if (d.slot) {
          if (d.slot.startsWith('left')) {
            shaped.audience = 'customers';
            customers.push(shaped);
          } else {
            shaped.audience = 'advisors';
            advisors.push(shaped);
          }
        } else if (d.audience === 'advisors') {
          advisors.push(shaped);
        } else {
          customers.push(shaped);
        }
      }
      customers.sort((a, b) => a.order - b.order);
      advisors.sort((a, b) => a.order - b.order);

      const news = await newsCol.find({}).sort({ createdAt: -1 }).toArray();
      const gallery = await galleryCol.find({}).sort({ createdAt: -1 }).toArray();

      const annDocs = await announcementsCol.find({}).sort({ order: 1, createdAt: -1 }).toArray();
      const annCustomers = [];
      const annAdvisors = [];
      for (const d of annDocs) {
        const s = shapeAnnouncement(d);
        if (s.audience === 'advisors') annAdvisors.push(s);
        else annCustomers.push(s);
      }
      annCustomers.sort((a, b) => a.order - b.order);
      annAdvisors.sort((a, b) => a.order - b.order);

      // Categories
      const catDocs = await categoriesCol.find({}).toArray();
      const newsCats = ['Educational', 'Industry Updates', 'Tips & Guide', 'Recruitment'];
      const galCats = ['Events', 'Training', 'Meetings', 'Awards', 'Office'];
      catDocs.forEach((c) => {
        if (c.type === 'news' && !newsCats.includes(c.name)) newsCats.push(c.name);
        if (c.type === 'gallery' && !galCats.includes(c.name)) galCats.push(c.name);
      });

      res.json({
        posters: { customers, advisors },
        news: news.map(shapeNews),
        gallery: gallery.map(shapeGallery),
        announcements: { customers: annCustomers, advisors: annAdvisors },
        categories: { news: newsCats, gallery: galCats },
        claimHelp: await shapeClaimHelp(),
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------- CATEGORIES ----------
  router.get('/categories', async (_req, res) => {
    try {
      const docs = await categoriesCol.find({}).toArray();
      const news = ['Educational', 'Industry Updates', 'Tips & Guide', 'Recruitment'];
      const gallery = ['Events', 'Training', 'Meetings', 'Awards', 'Office'];
      docs.forEach((c) => {
        if (c.type === 'news' && !news.includes(c.name)) news.push(c.name);
        if (c.type === 'gallery' && !gallery.includes(c.name)) gallery.push(c.name);
      });
      res.json({ news, gallery });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/categories', async (req, res) => {
    try {
      const name = (req.body.name || '').trim();
      const type = req.body.type;
      if (!name || !['news', 'gallery'].includes(type)) {
        return res.status(400).json({ error: 'name and type (news|gallery) are required' });
      }
      await categoriesCol.updateOne(
        { type, name },
        { $setOnInsert: { type, name, createdAt: new Date() } },
        { upsert: true }
      );
      res.status(201).json({ success: true, name, type });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------- POSTERS ----------
  // ---------- POSTERS (GET /api/content/posters) ----------
  router.get('/posters', async (_req, res) => {
    try {
      const docs = await postersCol.find({}).sort({ order: 1 }).toArray();
      const customers = [];
      const advisors = [];
      for (const d of docs) {
        const s = shapePoster(d);
        if (d.slot?.startsWith('left') || d.audience === 'customers') customers.push(s);
        else advisors.push(s);
      }
      customers.sort((a, b) => a.order - b.order);
      advisors.sort((a, b) => a.order - b.order);
      res.json({ customers, advisors });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/posters', upload.single('file'), async (req, res) => {
    try {
      const audience = (req.body.audience || 'customers').toLowerCase();
      if (!['customers', 'advisors'].includes(audience)) {
        return res.status(400).json({ error: 'audience must be customers or advisors' });
      }
      if (!req.file) return res.status(400).json({ error: 'file is required' });

      // Save to persistent storage
      const buffer = fs.readFileSync(req.file.path);
      const storageResult = await uploadBufferToStorage(buffer, req.file.filename, 'content', req.file.mimetype);
      const url = storageResult.publicUrl || toPublicHttpsUrl(`/uploads/content/${req.file.filename}`);

      const count = await postersCol.countDocuments({ audience });
      const doc = {
        audience,
        order: count,
        url,
        fileName: req.file.originalname,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      const result = await postersCol.insertOne(doc);
      res.status(201).json({ poster: shapePoster({ ...doc, _id: result.insertedId }) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/posters/reorder', async (req, res) => {
    try {
      const { audience, orderedIds } = req.body;
      if (!audience || !Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'audience and orderedIds required' });
      }
      const bulk = orderedIds.map((id, index) => ({
        updateOne: {
          filter: ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id },
          update: { $set: { order: index, updatedAt: new Date() } },
        },
      }));
      if (bulk.length) await postersCol.bulkWrite(bulk);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete('/posters/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
      const existing = await postersCol.findOne(filter);
      if (existing?.url) {
        const file = path.join(process.cwd(), existing.url.replace(/^\//, ''));
        if (fs.existsSync(file)) {
          try { fs.unlinkSync(file); } catch (_) {}
        }
      }
      await postersCol.deleteOne(filter);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------- ANNOUNCEMENTS ----------
  router.get('/announcements', async (_req, res) => {
    try {
      const docs = await announcementsCol.find({}).sort({ order: 1 }).toArray();
      const customers = [];
      const advisors = [];
      for (const d of docs) {
        const s = shapeAnnouncement(d);
        if (s.audience === 'advisors') advisors.push(s);
        else customers.push(s);
      }
      res.json({ customers, advisors });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/announcements', async (req, res) => {
    try {
      const audience = (req.body.audience || 'customers').toLowerCase();
      const text = (req.body.text || '').trim();
      if (!text) return res.status(400).json({ error: 'text is required' });
      if (!['customers', 'advisors'].includes(audience)) {
        return res.status(400).json({ error: 'invalid audience' });
      }
      const count = await announcementsCol.countDocuments({ audience });
      const doc = {
        audience,
        text,
        label: (req.body.label || '').trim() || (audience === 'advisors' ? 'Advisors' : 'Customers'),
        order: count,
        createdAt: new Date(),
      };
      const result = await announcementsCol.insertOne(doc);
      res.status(201).json({ item: shapeAnnouncement({ ...doc, _id: result.insertedId }) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/announcements/reorder', async (req, res) => {
    try {
      const { audience, orderedIds } = req.body;
      if (!audience || !Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'audience and orderedIds required' });
      }
      const bulk = orderedIds.map((id, index) => ({
        updateOne: {
          filter: ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id },
          update: { $set: { order: index } },
        },
      }));
      if (bulk.length) await announcementsCol.bulkWrite(bulk);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete('/announcements/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
      await announcementsCol.deleteOne(filter);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------- NEWS ----------
  // ---------- NEWS (GET /api/content/news) ----------
  router.get('/news', async (_req, res) => {
    try {
      const rows = await newsCol.find({}).sort({ createdAt: -1 }).toArray();
      res.json(rows.map(shapeNews));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/news', upload.single('file'), async (req, res) => {
    try {
      const title = (req.body.title || '').trim();
      if (!title) return res.status(400).json({ error: 'title is required' });
      if (!req.file) return res.status(400).json({ error: 'cover image is required' });

      // Save to persistent storage
      const buffer = fs.readFileSync(req.file.path);
      const storageResult = await uploadBufferToStorage(buffer, req.file.filename, 'content', req.file.mimetype);
      const coverImage = storageResult.publicUrl || toPublicHttpsUrl(`/uploads/content/${req.file.filename}`);

      const description = (req.body.description || '').trim();
      if (!description) return res.status(400).json({ error: 'description is required' });

      const doc = {
        title,
        description,
        category: req.body.category || 'Educational',
        coverImage,
        image: coverImage,
        publishDate: new Date().toISOString().slice(0, 10),
        readTime: '4 min read',
        author: 'Aynkaran Team',
        content: description,
        tags: [],
        createdAt: new Date(),
      };
      const result = await newsCol.insertOne(doc);
      res.status(201).json({ post: shapeNews({ ...doc, _id: result.insertedId }) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete('/news/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
      const existing = await newsCol.findOne(filter);
      if (existing?.coverImage) {
        const file = path.join(process.cwd(), existing.coverImage.replace(/^\//, ''));
        if (fs.existsSync(file)) {
          try { fs.unlinkSync(file); } catch (_) {}
        }
      }
      await newsCol.deleteOne(filter);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------- GALLERY ----------
  // ---------- GALLERY (GET /api/content/gallery) ----------
  router.get('/gallery', async (_req, res) => {
    try {
      const rows = await galleryCol.find({}).sort({ createdAt: -1 }).toArray();
      res.json(rows.map(shapeGallery));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/gallery', upload.single('file'), async (req, res) => {
    try {
      const title = (req.body.title || '').trim();
      if (!title) return res.status(400).json({ error: 'title is required' });
      if (!req.file) return res.status(400).json({ error: 'file is required' });

      // Save to persistent storage
      const buffer = fs.readFileSync(req.file.path);
      const storageResult = await uploadBufferToStorage(buffer, req.file.filename, 'content', req.file.mimetype);
      const url = storageResult.publicUrl || toPublicHttpsUrl(`/uploads/content/${req.file.filename}`);

      const isVideo =
        (req.file.mimetype && req.file.mimetype.startsWith('video/')) ||
        /\.(mp4|webm|mov|m4v|ogg)$/i.test(req.file.originalname || '');
      const type = req.body.type === 'video' || isVideo ? 'video' : 'image';

      const doc = {
        title,
        category: req.body.category || 'Events',
        description: (req.body.description || '').trim(),
        url,
        image: url,
        type,
        createdAt: new Date(),
      };
      const result = await galleryCol.insertOne(doc);
      res.status(201).json({ item: shapeGallery({ ...doc, _id: result.insertedId }) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete('/gallery/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
      const existing = await galleryCol.findOne(filter);
      if (existing?.url) {
        const file = path.join(process.cwd(), existing.url.replace(/^\//, ''));
        if (fs.existsSync(file)) {
          try { fs.unlinkSync(file); } catch (_) {}
        }
      }
      await galleryCol.deleteOne(filter);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------- CLAIM HELP (multi-company) ----------
  // All companies, each with its profile image + name + ordered procedures + helplines.
  // This is surfaced on the aggregate `GET /api/content` as `claimHelp`.
  router.get('/claimhelp', async (_req, res) => {
    try {
      res.json(await shapeClaimHelp());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  function companyObjId(id) {
    if (!ObjectId.isValid(id)) return null;
    return new ObjectId(id);
  }

  // Create a new company (multipart: file = profile image, companyName = text)
  router.post('/claimhelp/company', upload.single('file'), async (req, res) => {
    try {
      const companyName = (req.body.companyName || '').trim();
      if (!companyName) {
        return res.status(400).json({ error: 'companyName is required' });
      }
      const parseList = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        try {
          return JSON.parse(value);
        } catch (_err) {
          return null;
        }
      };
      const procedures = parseList(req.body.procedures);
      const helplineNumbers = parseList(req.body.helplineNumbers);
      if (procedures === null || helplineNumbers === null) {
        return res.status(400).json({ error: 'Invalid procedures or helpline numbers' });
      }
      if (!Array.isArray(procedures) || !Array.isArray(helplineNumbers)) {
        return res.status(400).json({ error: 'Procedures and helpline numbers must be arrays' });
      }
      const normalizedProcedures = procedures.map((text) => String(text || '').trim()).filter(Boolean);
      const normalizedHelplineNumbers = helplineNumbers.map((number) => String(number || '').trim()).filter(Boolean);
      if (normalizedHelplineNumbers.some((number) => !validHelpline(number))) {
        return res.status(400).json({ error: 'Helpline number must be exactly 10 digits' });
      }
      const doc = { companyName, companyProfileImage: null, createdAt: new Date(), updatedAt: new Date() };
      if (req.file) {
        const buffer = fs.readFileSync(req.file.path);
        const storageResult = await uploadBufferToStorage(buffer, req.file.filename, 'content', req.file.mimetype);
        doc.companyProfileImage = storageResult.publicUrl || toPublicHttpsUrl(`/uploads/content/${req.file.filename}`);
      }
      const result = await claimHelpCol.insertOne(doc);
      try {
        if (normalizedProcedures.length) {
          await proceduresCol.insertMany(normalizedProcedures.map((text, order) => ({
            companyId: result.insertedId,
            text,
            order,
            createdAt: new Date(),
          })));
        }
        if (normalizedHelplineNumbers.length) {
          await helplinesCol.insertMany(normalizedHelplineNumbers.map((number, order) => ({
            companyId: result.insertedId,
            number,
            order,
            createdAt: new Date(),
          })));
        }
      } catch (error) {
        await Promise.all([
          claimHelpCol.deleteOne({ _id: result.insertedId }),
          proceduresCol.deleteMany({ companyId: result.insertedId }),
          helplinesCol.deleteMany({ companyId: result.insertedId }),
        ]);
        throw error;
      }
      res.status(201).json(await shapeCompanyFull(result.insertedId));
    } catch (e) {
      console.error('[Claim Help] Failed to create company:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Single company full view
  router.get('/claimhelp/company/:companyId', async (req, res) => {
    try {
      const cid = companyObjId(req.params.companyId);
      if (!cid) return res.status(400).json({ error: 'Invalid company id' });
      const full = await shapeCompanyFull(req.params.companyId);
      if (!full) return res.status(404).json({ error: 'Company not found' });
      res.json(full);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update a company profile (multipart: file?, companyName?, removeImage?)
  router.put('/claimhelp/company/:companyId', upload.single('file'), async (req, res) => {
    try {
      const cid = companyObjId(req.params.companyId);
      if (!cid) return res.status(400).json({ error: 'Invalid company id' });
      const companyName = (req.body.companyName || '').trim();
      if (!companyName) {
        return res.status(400).json({ error: 'companyName is required' });
      }
      const removeImage = req.body.removeImage === 'true' || req.body.removeImage === true;
      const setFields = { companyName, updatedAt: new Date() };
      if (removeImage) {
        setFields.companyProfileImage = null;
      } else if (req.file) {
        const buffer = fs.readFileSync(req.file.path);
        const storageResult = await uploadBufferToStorage(buffer, req.file.filename, 'content', req.file.mimetype);
        setFields.companyProfileImage = storageResult.publicUrl || toPublicHttpsUrl(`/uploads/content/${req.file.filename}`);
      }
      const result = await claimHelpCol.updateOne({ _id: cid }, { $set: setFields });
      if (result.matchedCount === 0) return res.status(404).json({ error: 'Company not found' });
      res.json(await shapeCompanyFull(req.params.companyId));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete a company + cascade its procedures & helplines
  router.delete('/claimhelp/company/:companyId', async (req, res) => {
    try {
      const cid = companyObjId(req.params.companyId);
      if (!cid) return res.status(400).json({ error: 'Invalid company id' });
      await proceduresCol.deleteMany({ companyId: cid });
      await helplinesCol.deleteMany({ companyId: cid });
      const result = await claimHelpCol.deleteOne({ _id: cid });
      if (result.deletedCount === 0) return res.status(404).json({ error: 'Company not found' });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------- PROCEDURES (per company) ----------
  router.get('/claimhelp/company/:companyId/procedures', async (req, res) => {
    try {
      const cid = companyObjId(req.params.companyId);
      if (!cid) return res.status(400).json({ error: 'Invalid company id' });
      const docs = await proceduresCol.find({ companyId: cid }).sort({ order: 1 }).toArray();
      res.json(docs.map(shapeProcedure));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/claimhelp/company/:companyId/procedures', async (req, res) => {
    try {
      const cid = companyObjId(req.params.companyId);
      if (!cid) return res.status(400).json({ error: 'Invalid company id' });
      const text = (req.body.text || '').trim();
      if (!text) return res.status(400).json({ error: 'text is required' });
      const count = await proceduresCol.countDocuments({ companyId: cid });
      const doc = { companyId: cid, text, order: count, createdAt: new Date() };
      const result = await proceduresCol.insertOne(doc);
      res.status(201).json({ item: shapeProcedure({ ...doc, _id: result.insertedId }) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch('/claimhelp/company/:companyId/procedures/:procId', async (req, res) => {
    try {
      const cid = companyObjId(req.params.companyId);
      if (!cid) return res.status(400).json({ error: 'Invalid company id' });
      const pid = req.params.procId;
      const text = (req.body.text || '').trim();
      if (!text) return res.status(400).json({ error: 'text is required' });
      const pfilter = ObjectId.isValid(pid) ? { _id: new ObjectId(pid) } : { id: pid };
      const result = await proceduresCol.updateOne({ companyId: cid, ...pfilter }, { $set: { text } });
      if (result.matchedCount === 0) return res.status(404).json({ error: 'procedure not found' });
      const updated = await proceduresCol.findOne(pfilter);
      res.json({ item: shapeProcedure(updated) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/claimhelp/company/:companyId/procedures/reorder', async (req, res) => {
    try {
      const cid = companyObjId(req.params.companyId);
      if (!cid) return res.status(400).json({ error: 'Invalid company id' });
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'orderedIds is required' });
      }
      const bulk = orderedIds.map((id, index) => ({
        updateOne: {
          filter: { companyId: cid, ...(ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }) },
          update: { $set: { order: index } },
        },
      }));
      if (bulk.length) await proceduresCol.bulkWrite(bulk);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete('/claimhelp/company/:companyId/procedures/:procId', async (req, res) => {
    try {
      const cid = companyObjId(req.params.companyId);
      if (!cid) return res.status(400).json({ error: 'Invalid company id' });
      const pid = req.params.procId;
      const pfilter = ObjectId.isValid(pid) ? { _id: new ObjectId(pid) } : { id: pid };
      const result = await proceduresCol.deleteOne({ companyId: cid, ...pfilter });
      if (result.deletedCount === 0) return res.status(404).json({ error: 'procedure not found' });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------- HELPLINE NUMBERS (per company) ----------
  router.get('/claimhelp/company/:companyId/helplines', async (req, res) => {
    try {
      const cid = companyObjId(req.params.companyId);
      if (!cid) return res.status(400).json({ error: 'Invalid company id' });
      const docs = await helplinesCol.find({ companyId: cid }).sort({ order: 1 }).toArray();
      res.json(docs.map(shapeHelpline));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/claimhelp/company/:companyId/helplines', async (req, res) => {
    try {
      const cid = companyObjId(req.params.companyId);
      if (!cid) return res.status(400).json({ error: 'Invalid company id' });
      const number = (req.body.number || '').trim();
      if (!validHelpline(number)) {
        return res.status(400).json({ error: 'Helpline number must be exactly 10 digits' });
      }
      const count = await helplinesCol.countDocuments({ companyId: cid });
      const doc = { companyId: cid, number, order: count, createdAt: new Date() };
      const result = await helplinesCol.insertOne(doc);
      res.status(201).json({ item: shapeHelpline({ ...doc, _id: result.insertedId }) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch('/claimhelp/company/:companyId/helplines/:helpId', async (req, res) => {
    try {
      const cid = companyObjId(req.params.companyId);
      if (!cid) return res.status(400).json({ error: 'Invalid company id' });
      const hid = req.params.helpId;
      const number = (req.body.number || '').trim();
      if (!validHelpline(number)) {
        return res.status(400).json({ error: 'Helpline number must be exactly 10 digits' });
      }
      const hfilter = ObjectId.isValid(hid) ? { _id: new ObjectId(hid) } : { id: hid };
      const result = await helplinesCol.updateOne({ companyId: cid, ...hfilter }, { $set: { number } });
      if (result.matchedCount === 0) return res.status(404).json({ error: 'helpline not found' });
      const updated = await helplinesCol.findOne(hfilter);
      res.json({ item: shapeHelpline(updated) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/claimhelp/company/:companyId/helplines/reorder', async (req, res) => {
    try {
      const cid = companyObjId(req.params.companyId);
      if (!cid) return res.status(400).json({ error: 'Invalid company id' });
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'orderedIds is required' });
      }
      const bulk = orderedIds.map((id, index) => ({
        updateOne: {
          filter: { companyId: cid, ...(ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }) },
          update: { $set: { order: index } },
        },
      }));
      if (bulk.length) await helplinesCol.bulkWrite(bulk);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete('/claimhelp/company/:companyId/helplines/:helpId', async (req, res) => {
    try {
      const cid = companyObjId(req.params.companyId);
      if (!cid) return res.status(400).json({ error: 'Invalid company id' });
      const hid = req.params.helpId;
      const hfilter = ObjectId.isValid(hid) ? { _id: new ObjectId(hid) } : { id: hid };
      const result = await helplinesCol.deleteOne({ companyId: cid, ...hfilter });
      if (result.deletedCount === 0) return res.status(404).json({ error: 'helpline not found' });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}