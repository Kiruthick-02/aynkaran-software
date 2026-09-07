// backend/middleware/uploadMiddleware.js

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_UPLOADS = path.join(process.cwd(), 'uploads');

// Ensure base folders exist
[
  'companies',
  'customers',
  'candidates',
  'recruitment',
  'advisors',
  'misc',
].forEach((folder) => {
  const dir = path.join(ROOT_UPLOADS, folder);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Map targetType from frontend to folder name
 */
function resolveFolder(targetType) {
  const type = String(targetType || 'misc').toLowerCase();

  if (type === 'customer' || type === 'customers') {
    return 'customers';
  }

  if (
    type === 'candidate' ||
    type === 'candidates' ||
    type === 'recruitment'
  ) {
    return 'candidates';
  }

  if (type === 'advisor' || type === 'advisors') {
    return 'advisors';
  }

  if (type === 'company' || type === 'companies') {
    return 'companies';
  }

  return 'misc';
}

// Document upload storage
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = resolveFolder(req.body?.targetType);
    const directory = path.join(ROOT_UPLOADS, folder);

    fs.mkdirSync(directory, { recursive: true });

    cb(null, directory);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;

    const extension =
      path.extname(file.originalname).toLowerCase() || '.bin';

    cb(null, `${uniqueName}${extension}`);
  },
});

export const uploadMiddleware = multer({
  storage: documentStorage,

  limits: {
    fileSize: 2 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const isAllowedMimeType =
      file.mimetype &&
      (file.mimetype.startsWith('image/') ||
        file.mimetype === 'application/pdf');

    const isAllowedExtension =
      /\.(jpe?g|png|gif|webp|pdf)$/i.test(file.originalname || '');

    if (isAllowedMimeType || isAllowedExtension) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPG/PNG/WebP) or PDF are allowed'));
    }
  },
});

// Company logo and background image storage
const companyDir = path.join(ROOT_UPLOADS, 'companies');

if (!fs.existsSync(companyDir)) {
  fs.mkdirSync(companyDir, { recursive: true });
}

const companyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, companyDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;

    const extension =
      path.extname(file.originalname).toLowerCase() || '.png';

    cb(null, `${uniqueName}${extension}`);
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