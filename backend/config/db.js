/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MongoClient } from 'mongodb';

// MongoDB Atlas high-speed cloud CRM Storage configuration
export async function setupDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aynkaran_crm';
  console.log('[System] Initializing connection to MongoDB...');

  const client = new MongoClient(uri);
  await client.connect();

  const dbName = uri.split('/').pop()?.split('?')[0] || 'aynkaran_crm';
  const db = client.db(dbName);

  console.log(`[MongoDB DB] Successfully connected to "${dbName}" collection vault.`);

  // Optional: Bootstrap baseline collections & indexes for optimization
  await db.collection('customers').createIndex({ id: 1 }, { unique: true });
  await db.collection('candidates').createIndex({ id: 1 }, { unique: true });
  await db.collection('policies').createIndex({ id: 1 }, { unique: true });
  await db.collection('reminders').createIndex({ id: 1 }, { unique: true });

  return db;
}
