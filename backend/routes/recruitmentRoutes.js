/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { RecruitmentController } from '../controllers/recruitmentController.js';

export function recruitmentRoutes(db) {
  const router = Router();
  const controller = new RecruitmentController(db);

  router.get('/', controller.getAll);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
