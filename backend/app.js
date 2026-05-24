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

  /**
   * ==========================================
   * CORS CONFIGURATION
   * ==========================================
   */
  const allowedOrigins = [
    'http://localhost:5173',
    'https://aynkaran-software-production-4e1c.up.railway.app',
  ];

  app.use(cors({
    origin: function (origin, callback) {

      // Allow requests with no origin
      // (mobile apps, postman, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`),
        false
      );
    },

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

    credentials: true,

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Origin',
      'Accept',
    ],
  }));

  // Handle preflight requests
  app.options('*', cors());

  /**
   * ==========================================
   * EXPRESS MIDDLEWARE
   * ==========================================
   */
  app.use(express.json());

  app.use(express.urlencoded({
    extended: true,
  }));

  /**
   * ==========================================
   * HEALTH CHECK ROUTE
   * ==========================================
   */
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      status: 'healthy',
      engine: 'MongoDB Document',
      service: 'Aynkaran Desk CRM Core Server',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * ==========================================
   * API ROUTES
   * ==========================================
   */
  app.use('/api/auth', authRoutes(db));

  app.use('/api/documents', documentRoutes(db));

  app.use('/api/customers', customerRoutes(db));

  app.use('/api/candidates', recruitmentRoutes(db));

  app.use('/api/policies', policyRoutes(db));

  app.use('/api/reminders', reminderRoutes(db));

  /**
   * ==========================================
   * 404 HANDLER
   * ==========================================
   */
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'API Route Not Found',
      path: req.originalUrl,
    });
  });

  /**
   * ==========================================
   * GLOBAL ERROR HANDLER
   * ==========================================
   */
  app.use((err, req, res, next) => {
    console.error('[Express Error]', err);

    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}