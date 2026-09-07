// backend/config/db.js
import { MongoClient } from 'mongodb';

const DEFAULT_DB_NAME = 'aynkaran_crm';
const DEFAULT_LOCAL_URI = `mongodb://127.0.0.1:27017/${DEFAULT_DB_NAME}`;

function getDatabaseName(uri) {
  const overrideName = process.env.MONGODB_DB_NAME?.trim();
  if (overrideName) return overrideName;

  const cleanedUri = uri.replace(/^mongodb(\+srv)?:\/\//, '');
  const pathStart = cleanedUri.indexOf('/');
  if (pathStart === -1) return DEFAULT_DB_NAME;

  const databasePart = cleanedUri.slice(pathStart + 1);
  if (!databasePart || databasePart.startsWith('?')) return DEFAULT_DB_NAME;

  const queryIndex = databasePart.indexOf('?');
  return queryIndex === -1 ? databasePart : databasePart.slice(0, queryIndex);
}

// MongoDB Atlas high-speed cloud CRM Storage configuration
export async function setupDatabase() {
  const uri = process.env.MONGODB_URI?.trim() || DEFAULT_LOCAL_URI;
  const dbName = getDatabaseName(uri);

  console.log('[System] Initializing connection to MongoDB...');
  console.log('[System] MongoDB host:', uri.includes('mongodb+srv://') ? 'Atlas cluster' : 'local MongoDB');

  const client = new MongoClient(uri, {
    connectTimeoutMS: 30000,
    serverSelectionTimeoutMS: 30000,
    maxPoolSize: 10,
  });

  try {
    await client.connect();
  } catch (error) {
    console.error('[MongoDB] Connection failed. Verify MONGODB_URI, network access, and Atlas IP whitelist if using Atlas.');
    throw error;
  }

  const db = client.db(dbName);
  console.log(`[MongoDB DB] Successfully connected to "${dbName}" database.`);

  // Optional: Bootstrap baseline collections & indexes for optimization
  await db.collection('customers').createIndex({ id: 1 }, { unique: true });
  await db.collection('candidates').createIndex({ id: 1 }, { unique: true });
  await db.collection('policies').createIndex({ id: 1 }, { unique: true });
  await db.collection('reminders').createIndex({ id: 1 }, { unique: true });

  return db;
}
