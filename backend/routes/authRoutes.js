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
  router.post('/logout', controller.logout);
  router.get('/verify', authenticateToken, controller.verifyToken);

  router.post('/register-staff', controller.registerStaff);
  router.get('/staff-list', controller.getStaffList);
  router.delete('/delete-staff/:username', controller.deleteStaff);
  router.get('/staff-logs', controller.getStaffLogs);
  router.delete('/staff-logs', controller.clearStaffLogs);
  router.post('/request-otp', controller.requestDeleteOTP);

  return router;
}
