/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';
dotenv.config();

import { setupDatabase } from './config/db.js';
import { createExpressApp } from './app.js';
import path from 'path';
import express from 'express';

const PORT = process.env.PORT || 5000;

async function run() {
  console.log('[System] Initializing Aynkaran production MongoDB connection...');
  const db = await setupDatabase();

  const app = createExpressApp(db);

  // Serve static UI assets under production builds
  if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(process.cwd(), '../frontend/dist');
    app.use(express.static(buildPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Aynkaran Backend Server] Running successfully on port http://localhost:${PORT}`);
  });
}

run().catch((err) => {
  console.error('[Boot Failure] Failed to start production server:', err);
});
