/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure high performance file buffer saving directory locations dynamically
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const targetType = req.body.targetType || 'misc';
    const uploadDir = path.join(process.cwd(), 'uploads', targetType);

    // Synchronously confirm folder existence cleanly before saving
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${Date.now()}-${sanitizedOriginalName}`);
  }
});

// Build configured instance constraints safely for desktop deployment sizes
export const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 Megabytes absolute maximum size
  }
});
