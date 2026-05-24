/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

export function authRoutes(db) {
  const router = Router();
  const controller = new AuthController(db);

  router.post('/login', controller.login);
  router.get('/verify', authenticateToken, controller.verifyToken);

  return router;
}
