/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';

export function syncRoutes(db) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    try {
      const { customers, candidates, policies, reminders } = req.body;

      if (Array.isArray(customers)) {
        await db.collection('customers').deleteMany({});
        if (customers.length > 0) {
          await db.collection('customers').insertMany(customers);
        }
      }

      if (Array.isArray(candidates)) {
        await db.collection('candidates').deleteMany({});
        if (candidates.length > 0) {
          await db.collection('candidates').insertMany(candidates);
        }
      }

      if (Array.isArray(policies)) {
        await db.collection('policies').deleteMany({});
        if (policies.length > 0) {
          await db.collection('policies').insertMany(policies);
        }
      }

      if (Array.isArray(reminders)) {
        await db.collection('reminders').deleteMany({});
        if (reminders.length > 0) {
          await db.collection('reminders').insertMany(reminders);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Database sync completed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Sync Error]', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Sync operation failed',
      });
    }
  });

  return router;
}