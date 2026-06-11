/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';

import { setupDatabase } from './config/db.js';
import { createExpressApp } from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hardcoded to run only on port 5000 as requested
const PORT = 5000;

async function run() {
  try {
    console.log('[System] Connecting to MongoDB...');

    // Database connection
    const db = await setupDatabase();

    console.log('[System] MongoDB connected successfully');

    // Create Express app
    const app = createExpressApp(db);

    // Trust Railway proxy
    app.set('trust proxy', 1);

    // Health check route
    app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Aynkaran Backend Running',
        environment: process.env.NODE_ENV || 'development',
      });
    });

    /**
     * ===============================
     * PRODUCTION FRONTEND SERVING
     * ===============================
     */
    if (process.env.NODE_ENV === 'production') {
      // React/Vite build folder
      const frontendPath = path.join(__dirname, '../frontend/dist');

      console.log('[System] Serving frontend from:', frontendPath);

      // Serve static files
      app.use(express.static(frontendPath));

      // React Router support
      app.get('*', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
      });
    }

    /**
     * ===============================
     * START SERVER
     * ===============================
     */
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
========================================
    Aynkaran Server Started Successfully
    Environment : ${process.env.NODE_ENV || 'development'}
    Port        : ${PORT}
========================================
      `);
    });
  } catch (error) {
    console.error(`
========================================
 SERVER STARTUP FAILED
========================================
`, error);

    process.exit(1);
  }
}

run();
