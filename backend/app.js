/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import cors from 'cors';
import { customerRoutes } from './routes/customerRoutes.js';
import { recruitmentRoutes } from './routes/recruitmentRoutes.js';
import { policyRoutes } from './routes/policyRoutes.js';
import { reminderRoutes } from './routes/reminderRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { documentRoutes } from './routes/documentRoutes.js';

export function createExpressApp(db) {
  const app = express();

  // Middleware configurations
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Status diagnostics
  app.get('/api/sys/health', (req, res) => {
    res.json({
      status: 'healthy',
      engine: 'MongoDB Document',
      timestamp: new Date().toISOString(),
      service: 'Aynkaran Desk CRM Core Server'
    });
  });

  // Database router attachments
  app.use('/api/auth', authRoutes(db));
  app.use('/api/documents', documentRoutes(db));
  app.use('/api/customers', customerRoutes(db));
  app.use('/api/candidates', recruitmentRoutes(db));
  app.use('/api/policies', policyRoutes(db));
  app.use('/api/reminders', reminderRoutes(db));

  // Default error boundary
  app.use((err, req, res, next) => {
    console.error('[Error Occurred]', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Database Server Exception',
      timestamp: new Date().toISOString()
    });
  });

  return app;
}