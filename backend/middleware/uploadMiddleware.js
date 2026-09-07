// backend/middleware/uploadMiddleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_UPLOADS = path.join(process.cwd(), 'uploads');

// Ensure base folders exist
['companies', 'customers', 'candidates', 'recruitment', 'advisors', 'misc'].forEach((folder) => {
  const dir = path.join(ROOT_UPLOADS, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/** Map targetType from frontend → folder name */
function resolveFolder(targetType) {
  const t = String(targetType || 'misc').toLowerCase();
  if (t === 'customer' || t === 'customers') return 'customers';
  if (t === 'candidate' || t === 'candidates' || t === 'recruitment') return 'candidates';
  if (t === 'advisor' || t === 'advisors') return 'advisors';
  if (t === 'company' || t === 'companies') return 'companies';
  return 'misc';
}

// ---------- Document upload (customers / candidates) – disk storage ----------
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = resolveFolder(req.body?.targetType);
    const dir = path.join(ROOT_UPLOADS, folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    cb(null, `${unique}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage: documentStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
  fileFilter: (req, file, cb) => {
    const ok =
      (file.mimetype &&
        (file.mimetype.startsWith('image/') ||
          file.mimetype === 'application/pdf')) ||
      /\.(jpe?g|png|gif|webp|pdf)$/i.test(file.originalname || '');
    if (ok) cb(null, true);
    else cb(new Error('Only images (JPG/PNG/WebP) or PDF are allowed'));
  },
});

// ---------- Company logo / background (existing behaviour) ----------
const companyDir = path.join(ROOT_UPLOADS, 'companies');
if (!fs.existsSync(companyDir)) {
  fs.mkdirSync(companyDir, { recursive: true });
}

const companyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, companyDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${unique}${ext}`);
  },
});

export const uploadCompanyMedia = multer({
  storage: companyStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
}).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 },
]);