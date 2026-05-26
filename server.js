/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { documentRoutes } from './backend/routes/documentRoutes.js';

dotenv.config();

let mongoDbConnection = null;
const MONGODB_URI = process.env.MONGODB_URI;

async function connectMongo() {
  if (MONGODB_URI) {
    try {
      console.log('[System] Connecting to MongoDB from Vite backend server...');
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      const dbName = MONGODB_URI.split('/').pop()?.split('?')[0] || 'aynkaran_crm';
      mongoDbConnection = client.db(dbName);
      console.log(`[System] Connected successfully to MongoDB: "${dbName}"`);
    } catch (err) {
      console.error('[System] MongoDB connection error, utilizing local database.json:', err);
    }
  } else {
    console.log('[System] No MONGODB_URI provided. Fallback database.json is active.');
  }
}

const DB_FILE = path.join(process.cwd(), 'database.json');

// Helper to load current database state safely
function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse database file, loading default state', e);
    }
  }

  // Fallback initial data matched with Aynkaran office databases
  return {
    customers: [],
    candidates: [],
    policies: [],
    reminders: [],
  };
}

// Save database state securely
function saveDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write database file', e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Connect to MongoDB if MONGODB_URI is provided
  await connectMongo();

  // JSON request body parsers
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Serve document uploads statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Initialize DB instance
  const db = loadDatabase();

  // Document management endpoints to handle document vaults and uploads
  app.use('/api/documents', (req, res, next) => {
    // Dynamically resolve DB instance in case connection is established after server starts
    const activeDb = mongoDbConnection || db;
    return documentRoutes(activeDb)(req, res, next);
  });

  // Root status API
  app.get('/api/health', async (req, res) => {
    let customerCount = db.customers.length;
    let candidateCount = db.candidates.length;
    let policyCount = db.policies.length;
    let reminderCount = db.reminders.length;

    if (mongoDbConnection) {
      try {
        customerCount = await mongoDbConnection.collection('customers').countDocuments();
        candidateCount = await mongoDbConnection.collection('candidates').countDocuments();
        policyCount = await mongoDbConnection.collection('policies').countDocuments();
        reminderCount = await mongoDbConnection.collection('reminders').countDocuments();
      } catch (err) {
        console.error('Count documents error from MongoDB:', err);
      }
    }

    res.json({
      status: 'operational',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      caching: mongoDbConnection ? 'MongoDB Atlas' : 'database.json',
      records: {
        customers: customerCount,
        candidates: candidateCount,
        policies: policyCount,
        reminders: reminderCount,
      }
    });
  });

  // --- CUSTOMER ENDPOINTS ---
  app.get('/api/customers', async (req, res) => {
    if (mongoDbConnection) {
      try {
        const list = await mongoDbConnection.collection('customers').find().sort({ createdAt: -1 }).toArray();
        res.json(list.map(r => ({ ...r, _id: undefined })));
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.json(db.customers);
    }
  });

  app.post('/api/customers', async (req, res) => {
    const newCustomer = {
      ...req.body,
      id: req.body.id || `cust-${Date.now().toString().slice(-5)}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
    };
    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('customers').insertOne({ ...newCustomer });
        res.status(201).json(newCustomer);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    } else {
      db.customers.unshift(newCustomer);
      saveDatabase(db);
      res.status(201).json(newCustomer);
    }
  });

  app.put('/api/customers/:id', async (req, res) => {
    const { id } = req.params;
    if (mongoDbConnection) {
      try {
        const updateData = { ...req.body };
        delete updateData._id;
        await mongoDbConnection.collection('customers').updateOne({ id }, { $set: updateData });
        res.json({ id, ...updateData });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    } else {
      const index = db.customers.findIndex((c) => c.id === id);
      if (index !== -1) {
        db.customers[index] = { ...db.customers[index], ...req.body };
        saveDatabase(db);
        res.json(db.customers[index]);
      } else {
        res.status(404).json({ error: 'Customer profile not found' });
      }
    }
  });

  app.delete('/api/customers/:id', async (req, res) => {
    const { id } = req.params;
    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('customers').deleteOne({ id });
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      const originalLen = db.customers.length;
      db.customers = db.customers.filter((c) => c.id !== id);
      if (db.customers.length < originalLen) {
        saveDatabase(db);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Customer profile not found' });
      }
    }
  });

  // --- CANDIDATE ENDPOINTS ---
  app.get('/api/candidates', async (req, res) => {
    if (mongoDbConnection) {
      try {
        const list = await mongoDbConnection.collection('candidates').find().toArray();
        res.json(list.map(r => ({ ...r, _id: undefined })));
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.json(db.candidates);
    }
  });

  app.post('/api/candidates', async (req, res) => {
    const newCandidate = {
      ...req.body,
      id: req.body.id || `cand-${Date.now().toString().slice(-5)}`,
      pendingStageSince: req.body.pendingStageSince || new Date().toISOString().split('T')[0],
    };
    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('candidates').insertOne({ ...newCandidate });
        res.status(201).json(newCandidate);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    } else {
      db.candidates.unshift(newCandidate);
      saveDatabase(db);
      res.status(201).json(newCandidate);
    }
  });

  app.put('/api/candidates/:id', async (req, res) => {
    const { id } = req.params;
    if (mongoDbConnection) {
      try {
        const updateData = { ...req.body };
        delete updateData._id;
        await mongoDbConnection.collection('candidates').updateOne({ id }, { $set: updateData });
        res.json({ id, ...updateData });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    } else {
      const index = db.candidates.findIndex((c) => c.id === id);
      if (index !== -1) {
        db.candidates[index] = { ...db.candidates[index], ...req.body };
        saveDatabase(db);
        res.json(db.candidates[index]);
      } else {
        res.status(404).json({ error: 'Trainee candidate not found' });
      }
    }
  });

  app.delete('/api/candidates/:id', async (req, res) => {
    const { id } = req.params;
    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('candidates').deleteOne({ id });
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      const originalLen = db.candidates.length;
      db.candidates = db.candidates.filter((c) => c.id !== id);
      if (db.candidates.length < originalLen) {
        saveDatabase(db);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Candidate record not found' });
      }
    }
  });

  // --- POLICY LEAD ENDPOINTS ---
  app.get('/api/policies', async (req, res) => {
    if (mongoDbConnection) {
      try {
        const list = await mongoDbConnection.collection('policies').find().toArray();
        res.json(list.map(r => ({ ...r, _id: undefined })));
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.json(db.policies);
    }
  });

  app.post('/api/policies', async (req, res) => {
    const newPolicy = {
      ...req.body,
      id: req.body.id || `pol-${Date.now().toString().slice(-5)}`,
      pendingStageSince: req.body.pendingStageSince || new Date().toISOString().split('T')[0],
    };
    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('policies').insertOne({ ...newPolicy });
        res.status(201).json(newPolicy);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    } else {
      db.policies.unshift(newPolicy);
      saveDatabase(db);
      res.status(201).json(newPolicy);
    }
  });

  app.put('/api/policies/:id', async (req, res) => {
    const { id } = req.params;
    if (mongoDbConnection) {
      try {
        const updateData = { ...req.body };
        delete updateData._id;
        await mongoDbConnection.collection('policies').updateOne({ id }, { $set: updateData });
        res.json({ id, ...updateData });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    } else {
      const index = db.policies.findIndex((p) => p.id === id);
      if (index !== -1) {
        db.policies[index] = { ...db.policies[index], ...req.body };
        saveDatabase(db);
        res.json(db.policies[index]);
      } else {
        res.status(404).json({ error: 'Policy lead not found' });
      }
    }
  });

  app.delete('/api/policies/:id', async (req, res) => {
    const { id } = req.params;
    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('policies').deleteOne({ id });
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      const originalLen = db.policies.length;
      db.policies = db.policies.filter((p) => p.id !== id);
      if (db.policies.length < originalLen) {
        saveDatabase(db);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Policy record not found' });
      }
    }
  });

  // --- REMINDER ENDPOINTS ---
  app.get('/api/reminders', async (req, res) => {
    if (mongoDbConnection) {
      try {
        const list = await mongoDbConnection.collection('reminders').find().toArray();
        res.json(list.map(r => ({ ...r, _id: undefined })));
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.json(db.reminders);
    }
  });

  app.post('/api/reminders', async (req, res) => {
    const newReminder = {
      ...req.body,
      id: req.body.id || `rem-${Date.now().toString().slice(-5)}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
    };
    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('reminders').insertOne({ ...newReminder });
        res.status(201).json(newReminder);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    } else {
      db.reminders.unshift(newReminder);
      saveDatabase(db);
      res.status(201).json(newReminder);
    }
  });

  app.put('/api/reminders/:id', async (req, res) => {
    const { id } = req.params;
    if (mongoDbConnection) {
      try {
        const updateData = { ...req.body };
        delete updateData._id;
        await mongoDbConnection.collection('reminders').updateOne({ id }, { $set: updateData });
        res.json({ id, ...updateData });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    } else {
      const index = db.reminders.findIndex((r) => r.id === id);
      if (index !== -1) {
        db.reminders[index] = { ...db.reminders[index], ...req.body };
        saveDatabase(db);
        res.json(db.reminders[index]);
      } else {
        res.status(404).json({ error: 'System reminder not found' });
      }
    }
  });

  app.delete('/api/reminders/:id', async (req, res) => {
    const { id } = req.params;
    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('reminders').deleteOne({ id });
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      const originalLen = db.reminders.length;
      db.reminders = db.reminders.filter((r) => r.id !== id);
      if (db.reminders.length < originalLen) {
        saveDatabase(db);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Reminder not found' });
      }
    }
  });

  // --- UNIFIED BULK SYNC ENDPOINT ---
  app.post('/api/sync', async (req, res) => {
    const { customers, candidates, policies, reminders } = req.body;
    if (mongoDbConnection) {
      try {
        if (Array.isArray(customers)) {
          await mongoDbConnection.collection('customers').deleteMany({});
          if (customers.length > 0) {
            await mongoDbConnection.collection('customers').insertMany(customers);
          }
        }
        if (Array.isArray(candidates)) {
          await mongoDbConnection.collection('candidates').deleteMany({});
          if (candidates.length > 0) {
            await mongoDbConnection.collection('candidates').insertMany(candidates);
          }
        }
        if (Array.isArray(policies)) {
          await mongoDbConnection.collection('policies').deleteMany({});
          if (policies.length > 0) {
            await mongoDbConnection.collection('policies').insertMany(policies);
          }
        }
        if (Array.isArray(reminders)) {
          await mongoDbConnection.collection('reminders').deleteMany({});
          if (reminders.length > 0) {
            await mongoDbConnection.collection('reminders').insertMany(reminders);
          }
        }
        res.json({ success: true, timestamp: new Date().toISOString() });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      if (Array.isArray(customers)) db.customers = customers;
      if (Array.isArray(candidates)) db.candidates = candidates;
      if (Array.isArray(policies)) db.policies = policies;
      if (Array.isArray(reminders)) db.reminders = reminders;
      saveDatabase(db);
      res.json({ success: true, timestamp: new Date().toISOString() });
    }
  });

  // Vite development integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aynkaran Consultants back-end listening on port http://localhost:${PORT}`);
  });
}

startServer();
