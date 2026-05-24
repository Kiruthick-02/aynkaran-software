/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { DocumentController } from '../controllers/documentController.js';
import { uploadMiddleware } from '../middleware/uploadMiddleware.js';

export function documentRoutes(db) {
  const router = Router();
  const controller = new DocumentController(db);

  // Securely intercept document payloads via Multer multi-part parser
  router.post('/upload', uploadMiddleware.single('file'), controller.upload);
  router.get('/download/:targetType/:filename', controller.download);

  return router;
}
