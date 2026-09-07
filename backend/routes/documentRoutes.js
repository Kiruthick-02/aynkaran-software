// backend/routes/documentRoutes.js
import { Router } from 'express';
import { DocumentController } from '../controllers/documentController.js';
import { uploadMiddleware } from '../middleware/uploadMiddleware.js';

export function documentRoutes(db) {
  const router = Router();
  const controller = new DocumentController(db);

  // multipart field name must be "file" (matches frontend FormData)
  router.get('/', controller.getAll);
  router.post('/upload', uploadMiddleware.single('file'), controller.upload);
  router.delete('/:id', controller.delete);
  router.patch('/:id/verify', controller.verify);
  router.patch('/:id/reject', controller.reject);
  router.get('/download/:targetType/:filename', controller.download);

  return router;
}
