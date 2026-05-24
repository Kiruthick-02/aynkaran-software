/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { ReminderController } from '../controllers/reminderController.js';

export function reminderRoutes(db) {
  const router = Router();
  const controller = new ReminderController(db);

  router.get('/', controller.getAll);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
