// backend/scripts/migrateMediaToPersistentStorage.js
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { setupDatabase } from '../config/db.js';
import { initStorage, uploadLocalFileToStorage, toPublicHttpsUrl } from '../utils/storageService.js';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getUploadDirectories() {
  const dirs = [
    path.join(__dirname, '..', 'uploads'),
    path.join(__dirname, '..', '..', 'uploads'),
    path.join(process.cwd(), 'backend', 'uploads'),
    path.join(process.cwd(), 'uploads'),
  ];
  return dirs.filter(d => fs.existsSync(d));
}

function collectAllFiles(dir, folderName = 'misc', results = []) {
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      collectAllFiles(full, item, results);
    } else {
      results.push({
        fullPath: full,
        filename: item,
        folder: folderName,
      });
    }
  }
  return results;
}

async function runMigration() {
  console.log('====================================================');
  console.log('  MIGRATING LOCAL MEDIA TO PERSISTENT STORAGE (GridFS)');
  console.log('====================================================');

  const db = await setupDatabase();
  initStorage(db);

  const uploadDirs = getUploadDirectories();
  console.log('Discovered upload directories:', uploadDirs);

  const discoveredFilesMap = new Map();
  for (const rootDir of uploadDirs) {
    const files = collectAllFiles(rootDir);
    for (const f of files) {
      const key = `${f.folder}/${f.filename}`;
      if (!discoveredFilesMap.has(key)) {
        discoveredFilesMap.set(key, f);
      }
    }
  }

  console.log(`Found ${discoveredFilesMap.size} unique media files on disk.`);

  let uploadedCount = 0;
  for (const [key, fileInfo] of discoveredFilesMap.entries()) {
    try {
      const res = await uploadLocalFileToStorage(fileInfo.fullPath, fileInfo.folder, fileInfo.filename);
      uploadedCount++;
      console.log(`[+ Uploaded] (${uploadedCount}/${discoveredFilesMap.size}) ${key} -> ${res.publicUrl}`);
    } catch (err) {
      console.error(`[! Failed] ${key}:`, err.message);
    }
  }

  console.log('\n----------------------------------------------------');
  console.log('  UPDATING MONGODB DATABASE RECORDS TO PUBLIC HTTPS');
  console.log('----------------------------------------------------');

  // 1. content_posters
  const posters = await db.collection('content_posters').find().toArray();
  for (const p of posters) {
    if (p.url) {
      const updatedUrl = toPublicHttpsUrl(p.url);
      await db.collection('content_posters').updateOne(
        { _id: p._id },
        { $set: { url: updatedUrl, updatedAt: new Date() } }
      );
      console.log(`[Posters] Updated poster ${p._id}: ${updatedUrl}`);
    }
  }

  // 2. content_news
  const news = await db.collection('content_news').find().toArray();
  for (const n of news) {
    const raw = n.coverImage || n.image;
    if (raw) {
      const updatedUrl = toPublicHttpsUrl(raw);
      await db.collection('content_news').updateOne(
        { _id: n._id },
        { $set: { coverImage: updatedUrl, image: updatedUrl } }
      );
      console.log(`[News] Updated news ${n._id}: ${updatedUrl}`);
    }
  }

  // 3. content_gallery
  const gallery = await db.collection('content_gallery').find().toArray();
  for (const g of gallery) {
    const raw = g.url || g.image;
    if (raw) {
      const updatedUrl = toPublicHttpsUrl(raw);
      await db.collection('content_gallery').updateOne(
        { _id: g._id },
        { $set: { url: updatedUrl, image: updatedUrl } }
      );
      console.log(`[Gallery] Updated gallery ${g._id}: ${updatedUrl}`);
    }
  }

  // 4. insurance_companies
  const companies = await db.collection('insurance_companies').find().toArray();
  for (const c of companies) {
    const updates = {};
    if (c.logo) updates.logo = toPublicHttpsUrl(c.logo);
    if (c.backgroundImage) updates.backgroundImage = toPublicHttpsUrl(c.backgroundImage);
    if (Array.isArray(c.policies)) {
      updates.policies = c.policies.map(p => ({
        ...p,
        brochurePath: p.brochurePath ? toPublicHttpsUrl(p.brochurePath) : p.brochurePath,
      }));
    }
    if (Object.keys(updates).length > 0) {
      await db.collection('insurance_companies').updateOne(
        { _id: c._id },
        { $set: updates }
      );
      console.log(`[Company] Updated company "${c.name}": logo=${updates.logo}`);
    }
  }

  console.log('\n====================================================');
  console.log('  PERSISTENT MEDIA STORAGE MIGRATION COMPLETE');
  console.log('====================================================\n');
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('Migration failed with error:', err);
  process.exit(1);
});

