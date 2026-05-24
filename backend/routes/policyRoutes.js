/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { PolicyController } from '../controllers/policyController.js';

export function policyRoutes(db) {
  const router = Router();
  const controller = new PolicyController(db);

  router.get('/', controller.getAll);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
