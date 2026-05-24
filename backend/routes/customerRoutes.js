/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { CustomerController } from '../controllers/customerController.js';

export function customerRoutes(db) {
  const router = Router();
  const controller = new CustomerController(db);

  router.get('/', controller.getAll);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
