/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure high performance file buffer saving directory locations dynamically
const storage = multer.memoryStorage();

// Build configured instance constraints safely for desktop deployment sizes
export const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 Megabytes absolute maximum size
  }
});
