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
import { sendSMSNotification } from './backend/utils/smsService.js';
import { sendEmailReceipt } from './backend/utils/emailService.js';

dotenv.config();

// Additionally check backend/.env to load credentials
const backendEnv = path.join(process.cwd(), 'backend', '.env');
if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv });
}

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
  const defaultState = {
    customers: [],
    candidates: [],
    policies: [],
    reminders: [],
    users: [],
    logs: []
  };

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return { ...defaultState, ...parsed };
    } catch (e) {
      console.error('Failed to parse database file, loading default state', e);
    }
  }

  // Fallback initial data matched with Aynkaran office databases
  return defaultState;
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

  const activeOTPs = {};

  async function logActivity(username, action, target) {
    const logObj = {
      id: `log-${Date.now().toString().slice(-5)}`,
      username,
      action,
      target,
      timestamp: new Date().toISOString()
    };
    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('logs').insertOne({ ...logObj });
      } catch (e) {
        console.error('Failed to log to MongoDB collection:', e);
      }
    } else {
      db.logs = db.logs || [];
      db.logs.unshift(logObj);
      saveDatabase(db);
    }
  }

  // --- STAFF & ROLE MANAGEMENT ENDPOINTS ---

  // User auth login
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password credentials are required.' });
    }

    const trimmedUser = username.trim();
    
    // Superadmin fallback check
    if (trimmedUser === 'admin' && password === 'admin@aynkaran') {
      await logActivity('admin', 'Logged In', 'Command Center Session Active');
      return res.json({
        success: true,
        user: { username: 'admin', displayName: 'Aynkaran Admin', role: 'SuperAdmin' }
      });
    }

    // Try Staff validation from DB
    let usersList = [];
    if (mongoDbConnection) {
      try {
        usersList = await mongoDbConnection.collection('users').find().toArray();
      } catch (e) {
        console.error('MongoDB users lookup error:', e);
      }
    } else {
      usersList = db.users || [];
    }

    const matchedUser = usersList.find(u => u.username === trimmedUser && u.password === password);
    if (matchedUser) {
      await logActivity(trimmedUser, 'Logged In', 'Staff Gateway Active');
      return res.json({
        success: true,
        user: { username: trimmedUser, displayName: matchedUser.displayName || trimmedUser, role: 'Staff' }
      });
    }

    res.status(401).json({ error: 'Invalid Username or Password!' });
  });

  // Create staff (SuperAdmin only)
  app.post('/api/auth/register-staff', async (req, res) => {
    const { username, password, displayName, requesterRole } = req.body;
    if (requesterRole !== 'SuperAdmin') {
      return res.status(403).json({ error: 'Unauthorized. Only Superadmin can create Staff login credentials.' });
    }

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const newStaff = {
      id: `usr-${Date.now().toString().slice(-5)}`,
      username: username.trim(),
      password,
      displayName: displayName || username.trim(),
      role: 'Staff',
      createdAt: new Date().toISOString()
    };

    if (mongoDbConnection) {
      try {
        const exists = await mongoDbConnection.collection('users').findOne({ username: newStaff.username });
        if (exists) {
          return res.status(400).json({ error: 'Username already exists!' });
        }
        await mongoDbConnection.collection('users').insertOne(newStaff);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      db.users = db.users || [];
      if (db.users.some(u => u.username === newStaff.username)) {
        return res.status(400).json({ error: 'Username already exists!' });
      }
      db.users.unshift(newStaff);
      saveDatabase(db);
    }

    await logActivity('admin', 'Registered Staff User', `Username: ${newStaff.username}`);
    res.status(201).json({ success: true, user: newStaff });
  });

  // Get staff list (SuperAdmin only)
  app.get('/api/auth/staff-list', async (req, res) => {
    let list = [];
    if (mongoDbConnection) {
      try {
        list = await mongoDbConnection.collection('users').find({ role: 'Staff' }).toArray();
        list = list.map(r => ({ ...r, _id: undefined }));
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      list = (db.users || []).filter(u => u.role === 'Staff');
    }
    res.json(list);
  });

  // Delete staff (SuperAdmin only)
  app.delete('/api/auth/delete-staff/:username', async (req, res) => {
    const { username } = req.params;
    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('users').deleteOne({ username });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      db.users = (db.users || []).filter(u => u.username !== username);
      saveDatabase(db);
    }

    await logActivity('admin', 'Deleted Staff User', `Username: ${username}`);
    res.json({ success: true, message: 'Staff credentials cleared successfully.' });
  });

  // User auth logout
  app.post('/api/auth/logout', async (req, res) => {
    const { username } = req.body;
    await logActivity(username || 'admin', 'Logged Out', 'Session Closed');
    res.json({ success: true });
  });

  // Get activity logs (SuperAdmin only)
  app.get('/api/auth/staff-logs', async (req, res) => {
    let list = [];
    if (mongoDbConnection) {
      try {
        list = await mongoDbConnection.collection('logs').find().sort({ timestamp: -1 }).toArray();
        list = list.map(r => ({ ...r, _id: undefined }));
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      list = db.logs || [];
    }
    res.json(list);
  });

  // Clear activity logs (SuperAdmin only)
  app.delete('/api/auth/staff-logs', async (req, res) => {
    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('logs').deleteMany({});
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      db.logs = [];
      saveDatabase(db);
    }
    await logActivity('admin', 'Cleared Staff Activity Logs', 'All logs deleted');
    res.json({ success: true, message: 'Activity logs cleared.' });
  });

  // Request deletion OTP (Staff only)
  app.post('/api/auth/request-otp', async (req, res) => {
    const { username, action, targetId, targetType, targetName } = req.body;
    
    // Generate valid 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in-memory for verification
    activeOTPs[username] = {
      otp: otpCode,
      targetId,
      targetType,
      timestamp: Date.now()
    };

    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('otps').updateOne(
          { username },
          {
            $set: {
              otp: otpCode,
              targetId,
              targetType,
              timestamp: Date.now()
            }
          },
          { upsert: true }
        );
      } catch (err) {
        console.error('Failed to write OTP to MongoDB:', err);
      }
    }

    console.log(`
============================ OTP OUTBOX SIMULATOR ============================
[Service Alert] Trigger OTP for deletion of ${targetType}
SuperAdmin Email : kiruthickrn@gmail.com
Staff Member     : ${username}
Request Target   : ID ${targetId} (${targetName || 'Unnamed'})
OTP CODE         : ${otpCode}
=============================================================================
`);

    // Write log activity
    await logActivity(username, 'Requested OTP Deletion', `${targetType} Item ID: ${targetId}`);

    // Send real/sandbox email receipt to Superadmin with OTP code
    try {
      const emailSubject = `[ACTION REQUIRED] OTP Verification for Deletion of ${targetType.toUpperCase()}`;
      const emailBody = `Hello Superadmin,

A staff member (@${username}) is requesting authorization to delete a record in the Aynkaran Consultants CRM:

- Resource Type: ${targetType.toUpperCase()}
- Record ID: ${targetId}
- Record Name: ${targetName || 'Unnamed / N/A'}
- Requested By: @${username}
- Time of Request: ${new Date().toLocaleString()}

Security Verification One-Time Password (OTP):
--------------------------------------------------
OTP CODE: ${otpCode}
--------------------------------------------------

Please convey this verification code to the staff member so they can safely authorize and execute the deletion.

Best regards,
Aynkaran Business CRM Autopilot`;

      await sendEmailReceipt('kiruthickrn@gmail.com', emailSubject, emailBody);
      console.log(`[Email Dispatcher] Dispatched deletion OTP email for staff @${username} to kiruthickrn@gmail.com`);
    } catch (emailErr) {
      console.error('[Email Dispatcher] Failed to dispatch deletion OTP:', emailErr);
    }

    res.json({
      success: true,
      message: `An authorization OTP has been issued and dispatched to Superadmin's registered email (kiruthickrn@gmail.com).`
    });
  });

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
    const { role, username } = req.query;
    let list = [];

    if (mongoDbConnection) {
      try {
        list = await mongoDbConnection.collection('customers').find().sort({ createdAt: -1 }).toArray();
        list = list.map(r => ({ ...r, _id: undefined }));
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      list = db.customers || [];
    }

    // Filter logic: Staff CANNOT see Superadmin's customers. Only their own!
    // SuperAdmin CANNOT see Staff's customers. Only their own!
    if (role === 'Staff' && username) {
      list = list.filter(c => c.createdBy === username);
    } else if (req.query.all === 'true' || req.query.supervise === 'true') {
      // Return everything for supervision
    } else {
      list = list.filter(c => !c.createdBy || c.createdBy === 'admin');
    }

    res.json(list);
  });

  app.post('/api/customers', async (req, res) => {
    const creator = req.body.createdBy || 'admin';
    const newCustomer = {
      ...req.body,
      id: req.body.id || `cust-${Date.now().toString().slice(-5)}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
      createdBy: creator
    };

    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('customers').insertOne({ ...newCustomer });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    } else {
      db.customers.unshift(newCustomer);
      saveDatabase(db);
    }

    await logActivity(creator, 'Created Customer', `Customer: ${newCustomer.name} (ID: ${newCustomer.id})`);
    res.status(201).json(newCustomer);
  });

  app.put('/api/customers/:id', async (req, res) => {
    const { id } = req.params;
    const modifier = req.body.updatedBy || 'admin';
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.updatedBy;

    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('customers').updateOne({ id }, { $set: updateData });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    } else {
      const index = db.customers.findIndex((c) => c.id === id);
      if (index !== -1) {
        db.customers[index] = { ...db.customers[index], ...updateData };
        saveDatabase(db);
      } else {
        return res.status(404).json({ error: 'Customer profile not found' });
      }
    }

    await logActivity(modifier, 'Updated Customer Info', `Customer ID: ${id}`);
    res.json({ id, ...updateData });
  });

  app.delete('/api/customers/:id', async (req, res) => {
    const { id } = req.params;
    const { role, username, otp } = req.query;

    if (role === 'Staff' && username) {
      if (!otp) {
        return res.status(403).json({ error: 'Authorizing OTP is required for Staff delete operations.' });
      }

      let isValidOtp = false;
      if (mongoDbConnection) {
        try {
          const activeOtpRecord = await mongoDbConnection.collection('otps').findOne({ username });
          if (activeOtpRecord && activeOtpRecord.otp === otp && activeOtpRecord.targetId === id) {
            isValidOtp = true;
            await mongoDbConnection.collection('otps').deleteOne({ username });
          }
        } catch (err) {
          console.error('Error fetching OTP from MongoDB:', err);
        }
      }

      // Check in-memory fallback if not validated via DB
      if (!isValidOtp) {
        const activeOtpRecord = activeOTPs[username];
        if (activeOtpRecord && activeOtpRecord.otp === otp && activeOtpRecord.targetId === id) {
          isValidOtp = true;
          delete activeOTPs[username];
        }
      }

      if (!isValidOtp) {
        return res.status(400).json({ error: 'Invalid or expired OTP code. Clear aborted.' });
      }

      await logActivity(username, 'Deleted Customer CRM (OTP Verified)', `Customer ID: ${id}`);
    } else {
      await logActivity(username || 'admin', 'Deleted Customer CRM (Direct)', `Customer ID: ${id}`);
    }

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
    let oldCandidate = null;
    const updateData = { ...req.body };
    delete updateData._id;

    if (mongoDbConnection) {
      try {
        oldCandidate = await mongoDbConnection.collection('candidates').findOne({ id });
      } catch (err) {
        console.error('[Backend Find Candidate error]', err);
      }
    } else {
      oldCandidate = db.candidates.find((c) => c.id === id);
    }

    // Capture changes to trigger alerts
    const scheduleChanged = updateData.appointmentDate && (!oldCandidate || oldCandidate.appointmentDate !== updateData.appointmentDate);
    const codeGeneratedJustNow = updateData.exam?.agentCodeGenerated && (!oldCandidate || !oldCandidate.exam?.agentCodeGenerated);

    // If schedule changed, trigger notification
    if (scheduleChanged) {
      const mobile = updateData.mobile;
      const email = updateData.email;
      if (mobile || email) {
        const text = `Aynkaran Consultants: Dear candidate ${updateData.name}, your recruitment meeting has been confirmed / scheduled for ${updateData.appointmentDate}. Location: Aynkaran Head Office. We look forward to meeting you.`;
        if (mobile) {
          sendSMSNotification(mobile, text).catch(e => console.error('[Backend Candidate Rec SMS failed]', e));
          sendSMSNotification(`whatsapp:${mobile}`, text).catch(e => console.error('[Backend Candidate Rec WA failed]', e));
        }
        if (email && email !== 'no-email@aynakaran.com') {
          sendEmailReceipt(email, `Recruitment Meeting Scheduled - ${updateData.name}`, text).catch(e => console.error('[Backend Candidate Rec Email failed]', e));
        }
      }
    }

    // If code generated, trigger notification
    if (codeGeneratedJustNow) {
      const mobile = updateData.mobile;
      const email = updateData.email;
      const agentCode = updateData.exam?.agentCodeGenerated;
      if (mobile || email) {
        const text = `Aynkaran Consultants: Congratulations ${updateData.name}! Your IRDAI Agent Code has been generated successfully. Agent ID: ${agentCode}. You are requested to attend the compulsory One-day Induction Program at Aynkaran Consultants to activate your active insurance sales workspace.`;
        if (mobile) {
          sendSMSNotification(mobile, text).catch(e => console.error('[Backend Candidate Induction SMS failed]', e));
          sendSMSNotification(`whatsapp:${mobile}`, text).catch(e => console.error('[Backend Candidate Induction WA failed]', e));
        }
        if (email && email !== 'no-email@aynakaran.com') {
          sendEmailReceipt(email, `Agent License Generated - Induction Program Session`, text).catch(e => console.error('[Backend Candidate Induction Email failed]', e));
        }
      }
    }

    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('candidates').updateOne({ id }, { $set: updateData });
        res.json({ id, ...updateData });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    } else {
      const index = db.candidates.findIndex((c) => c.id === id);
      if (index !== -1) {
        db.candidates[index] = { ...db.candidates[index], ...updateData };
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
    const { role, username } = req.query;
    let list = [];

    if (mongoDbConnection) {
      try {
        list = await mongoDbConnection.collection('policies').find().toArray();
        list = list.map(r => ({ ...r, _id: undefined }));
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      list = db.policies || [];
    }

    // Filter logic: Staff CANNOT see Superadmin's policies. Only their own!
    // SuperAdmin CANNOT see Staff's policies. Only their own!
    if (role === 'Staff' && username) {
      list = list.filter(p => p.createdBy === username);
    } else if (req.query.all === 'true' || req.query.supervise === 'true') {
      // Return everything for supervision
    } else {
      list = list.filter(p => !p.createdBy || p.createdBy === 'admin');
    }

    res.json(list);
  });

  app.post('/api/policies', async (req, res) => {
    const creator = req.body.createdBy || 'admin';
    const newPolicy = {
      ...req.body,
      id: req.body.id || `pol-${Date.now().toString().slice(-5)}`,
      pendingStageSince: req.body.pendingStageSince || new Date().toISOString().split('T')[0],
      createdBy: creator
    };

    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('policies').insertOne({ ...newPolicy });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    } else {
      db.policies.unshift(newPolicy);
      saveDatabase(db);
    }

    await logActivity(creator, 'Created Policy Sales Lead', `Policy: ${newPolicy.customerName} - ${newPolicy.policyType} (ID: ${newPolicy.id})`);
    res.status(201).json(newPolicy);
  });

  app.put('/api/policies/:id', async (req, res) => {
    const { id } = req.params;
    const modifier = req.body.updatedBy || 'admin';
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.updatedBy;

    if (mongoDbConnection) {
      try {
        await mongoDbConnection.collection('policies').updateOne({ id }, { $set: updateData });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    } else {
      const index = db.policies.findIndex((p) => p.id === id);
      if (index !== -1) {
        db.policies[index] = { ...db.policies[index], ...updateData };
        saveDatabase(db);
      } else {
        return res.status(404).json({ error: 'Policy lead not found' });
      }
    }

    await logActivity(modifier, 'Updated Policy Sales Info', `Policy ID: ${id}`);
    res.json({ id, ...updateData });
  });

  app.delete('/api/policies/:id', async (req, res) => {
    const { id } = req.params;
    const { role, username, otp } = req.query;

    if (role === 'Staff' && username) {
      if (!otp) {
        return res.status(403).json({ error: 'Authorizing OTP is required for Staff delete operations.' });
      }

      let isValidOtp = false;
      if (mongoDbConnection) {
        try {
          const activeOtpRecord = await mongoDbConnection.collection('otps').findOne({ username });
          if (activeOtpRecord && activeOtpRecord.otp === otp && activeOtpRecord.targetId === id) {
            isValidOtp = true;
            await mongoDbConnection.collection('otps').deleteOne({ username });
          }
        } catch (err) {
          console.error('Error fetching OTP from MongoDB:', err);
        }
      }

      // Check in-memory fallback if not validated via DB
      if (!isValidOtp) {
        const activeOtpRecord = activeOTPs[username];
        if (activeOtpRecord && activeOtpRecord.otp === otp && activeOtpRecord.targetId === id) {
          isValidOtp = true;
          delete activeOTPs[username];
        }
      }

      if (!isValidOtp) {
        return res.status(400).json({ error: 'Invalid or expired OTP code. Clear aborted.' });
      }

      await logActivity(username, 'Deleted Policy Sales (OTP Verified)', `Policy ID: ${id}`);
    } else {
      await logActivity(username || 'admin', 'Deleted Policy Sales (Direct)', `Policy ID: ${id}`);
    }

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
  app.post('/api/reminders/trigger-cron', async (req, res) => {
    const now = new Date();
    let newlyCreated = 0;

    if (mongoDbConnection) {
      try {
        const { executeDailyPolicyRenewalJobs } = await import('./backend/cron/renewalJobs.js');
        const { executeDailyReminderJobs } = await import('./backend/cron/reminderJobs.js');

        const beforeCount = await mongoDbConnection.collection('reminders').countDocuments();

        await executeDailyPolicyRenewalJobs(mongoDbConnection);
        await executeDailyReminderJobs(mongoDbConnection);

        const afterCount = await mongoDbConnection.collection('reminders').countDocuments();
        newlyCreated = afterCount - beforeCount;

        const list = await mongoDbConnection.collection('reminders').find().toArray();
        res.json({
          success: true,
          message: 'Automated alerts engine executed successfully on MongoDB database!',
          newRemindersCreated: newlyCreated,
          reminders: list.map(r => ({ ...r, _id: undefined }))
        });
      } catch (err) {
        console.error('[Trigger Cron Error]', err);
        res.status(500).json({ error: err.message });
      }
    } else {
      try {
        const localDb = loadDatabase();
        if (!localDb.reminders) localDb.reminders = [];

        const initialCount = localDb.reminders.length;

        // 1. Check policies
        const upcomingRenewals = (localDb.policies || []).filter(policy =>
          policy.renewalDate && policy.currentStage !== 'Policy Lapsed'
        );

        for (const policy of upcomingRenewals) {
          const renewalDateObj = new Date(policy.renewalDate);
          const renewalMidnight = Date.UTC(renewalDateObj.getFullYear(), renewalDateObj.getMonth(), renewalDateObj.getDate());
          const nowMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
          const daysToRenewal = Math.round((renewalMidnight - nowMidnight) / (1000 * 3600 * 24));

          if (daysToRenewal === 30 || daysToRenewal === 15 || (daysToRenewal > 0 && daysToRenewal <= 10)) {
            const hasDuplicate = localDb.reminders.some(r => r.targetId === (policy.id || policy._id?.toString()) && r.triggerType === `${daysToRenewal} days before`);
            if (!hasDuplicate) {
              const remId = `rem-ren-${Date.now().toString().slice(-4)}`;
              
              // Resolve customer profile dynamically to pull registered mobile and email ID
              const customer = (localDb.customers || []).find(c => 
                c.id === policy.customerId || 
                c.name === policy.customerName
              );
              
              const targetMobile = customer ? (customer.mobileNumber || customer.mobile || '') : '';
              const targetEmail = customer ? (customer.emailId || customer.email || '') : '';

              localDb.reminders.unshift({
                id: remId,
                title: `Policy Renewal Reminder: ${policy.customerName}`,
                description: `The premium for policy ${policy.policyType} (#${policy.issuedPolicyNumber}) is due in ${daysToRenewal} days. Amount: Rs. ${policy.premiumAmount}`,
                dueDate: policy.renewalDate,
                targetId: policy.id || policy._id?.toString(),
                targetType: 'renewal',
                triggerType: `${daysToRenewal} days before`,
                completed: false,
                channels: { desktop: true, whatsapp: !!targetMobile, email: !!targetEmail, sms: !!targetMobile },
                customerMobile: targetMobile,
                customerEmail: targetEmail,
                createdAt: now.toISOString()
              });

              // Dispatch alerts automatically to customer destination
              const subject = `LIC Policy Renewal Reminder - Policy #${policy.issuedPolicyNumber}`;
              const message = `Aynkaran Consultants Urgent renewal: Dear customer ${policy.customerName}, your insurance policy ${policy.policyType} (#${policy.issuedPolicyNumber}) renewal premium Rs. ${policy.premiumAmount} is due in ${daysToRenewal} days on ${policy.renewalDate}. Please clear to maintain your active live coverage.`;

              if (targetMobile) {
                sendSMSNotification(targetMobile, message).catch(e => console.error('Local cron SMS failed:', e));
              }
              if (targetEmail) {
                sendEmailReceipt(targetEmail, subject, message).catch(e => console.error('Local cron Email failed:', e));
              }
            }
          }
        }

        // 2. Check candidates
        const activeCandidates = (localDb.candidates || []).filter(cand =>
          cand.currentStage !== 'Generate Agent Code' && cand.currentStage !== 'Meeting Appointment'
        );

        for (const cand of activeCandidates) {
          if (!cand.pendingStageSince) continue;
          const pendingSinceObj = new Date(cand.pendingStageSince);
          const pendingMidnight = Date.UTC(pendingSinceObj.getFullYear(), pendingSinceObj.getMonth(), pendingSinceObj.getDate());
          const nowMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
          const daysDiff = Math.round((nowMidnight - pendingMidnight) / (1000 * 3600 * 24));

          if (daysDiff >= 4) {
            const hasDuplicate = localDb.reminders.some(r => r.targetId === (cand.id || cand._id?.toString()) && r.triggerType === 'Immediate');
            if (!hasDuplicate) {
              const remId = `rem-auto-${Date.now().toString().slice(-4)}`;
              localDb.reminders.unshift({
                id: remId,
                title: `Stuck Candidate Alert: ${cand.name}`,
                description: `Trainee is stuck in step "${cand.currentStage}" for ${daysDiff} days. Immediate intervention required.`,
                dueDate: new Date(now.getTime() + (2 * 24 * 3600 * 1000)).toISOString().split('T')[0],
                targetId: cand.id || cand._id?.toString(),
                targetType: 'recruitment',
                triggerType: 'Immediate',
                completed: false,
                channels: { desktop: true, whatsapp: true, email: false },
                createdAt: now.toISOString()
              });
            }
          }
        }

        newlyCreated = localDb.reminders.length - initialCount;

        // Update in-memory fallback & save
        db.reminders = localDb.reminders;
        saveDatabase(db);

        res.json({
          success: true,
          message: 'Automated alerts engine executed successfully on local database!',
          newRemindersCreated: newlyCreated,
          reminders: db.reminders
        });
      } catch (err) {
        console.error('[Trigger Cron Error]', err);
        res.status(500).json({ error: err.message });
      }
    }
  });

  app.get('/api/reminders', async (req, res) => {
    const { role, username } = req.query;
    let list = [];
    if (mongoDbConnection) {
      try {
        list = await mongoDbConnection.collection('reminders').find().toArray();
        list = list.map(r => ({ ...r, _id: undefined }));
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      list = db.reminders || [];
    }

    try {
      let allowedCusts = [];
      let allowedPols = [];
      if (mongoDbConnection) {
        if (role === 'Staff' && username) {
          allowedCusts = await mongoDbConnection.collection('customers').find({ createdBy: username }).toArray();
          allowedPols = await mongoDbConnection.collection('policies').find({ createdBy: username }).toArray();
        } else {
          allowedCusts = await mongoDbConnection.collection('customers').find({ $or: [{ createdBy: 'admin' }, { createdBy: { $exists: false } }, { createdBy: null }, { createdBy: '' }] }).toArray();
          allowedPols = await mongoDbConnection.collection('policies').find({ $or: [{ createdBy: 'admin' }, { createdBy: { $exists: false } }, { createdBy: null }, { createdBy: '' }] }).toArray();
        }
      } else {
        if (role === 'Staff' && username) {
          allowedCusts = (db.customers || []).filter(c => c.createdBy === username);
          allowedPols = (db.policies || []).filter(p => p.createdBy === username);
        } else {
          allowedCusts = (db.customers || []).filter(c => !c.createdBy || c.createdBy === 'admin');
          allowedPols = (db.policies || []).filter(p => !p.createdBy || p.createdBy === 'admin');
        }
      }

      const custIds = new Set(allowedCusts.map(c => c.id));
      const polIds = new Set(allowedPols.map(p => p.id));

      list = list.filter(r => {
        if (r.targetType === 'recruitment') {
          return role !== 'Staff';
        }
        if (r.targetType === 'renewal') {
          return polIds.has(r.targetId);
        }
        return custIds.has(r.targetId);
      });
    } catch (filterErr) {
      console.error('Error filtering reminders on server:', filterErr);
    }

    res.json(list);
  });

  app.post('/api/reminders', async (req, res) => {
    const newReminder = {
      ...req.body,
      id: req.body.id || `rem-${Date.now().toString().slice(-5)}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
    };

    // Auto Dispatch Automated SMS, WhatsApp, and Email instantly on backend
    if (newReminder.customerMobile || newReminder.customerEmail) {
      const mobile = newReminder.customerMobile;
      const email = newReminder.customerEmail;
      const title = newReminder.title || 'Aynkaran Notification';
      const desc = newReminder.description || '';
      const text = `${title} - ${desc}`;

      if (mobile) {
        // 1. Cellular SMS
        sendSMSNotification(mobile, text).catch(e => console.error('[Backend SMS error]', e));
        // 2. WhatsApp Simulation (Prefix with whatsapp:)
        sendSMSNotification(`whatsapp:${mobile}`, text).catch(e => console.error('[Backend WhatsApp error]', e));
      }

      if (email && email !== 'no-email@aynakaran.com' && email !== 'no-email@aynakaran.com') {
        // 3. Corporate Email via Secure TLS SMTP or Sandbox Interceptor Routing
        sendEmailReceipt(email, title, text).catch(e => console.error('[Backend Email error]', e));
      }
    }

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
        if (Array.isArray(customers) && customers.length > 0) {
          const count = await mongoDbConnection.collection('customers').countDocuments();
          if (count === 0) {
            await mongoDbConnection.collection('customers').insertMany(customers);
          }
        }
        if (Array.isArray(candidates) && candidates.length > 0) {
          const count = await mongoDbConnection.collection('candidates').countDocuments();
          if (count === 0) {
            await mongoDbConnection.collection('candidates').insertMany(candidates);
          }
        }
        if (Array.isArray(policies) && policies.length > 0) {
          const count = await mongoDbConnection.collection('policies').countDocuments();
          if (count === 0) {
            await mongoDbConnection.collection('policies').insertMany(policies);
          }
        }
        if (Array.isArray(reminders) && reminders.length > 0) {
          const count = await mongoDbConnection.collection('reminders').countDocuments();
          if (count === 0) {
            await mongoDbConnection.collection('reminders').insertMany(reminders);
          }
        }
        res.json({ success: true, timestamp: new Date().toISOString() });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      let changed = false;
      if (Array.isArray(customers) && customers.length > 0 && (!db.customers || db.customers.length === 0)) {
        db.customers = customers;
        changed = true;
      }
      if (Array.isArray(candidates) && candidates.length > 0 && (!db.candidates || db.candidates.length === 0)) {
        db.candidates = candidates;
        changed = true;
      }
      if (Array.isArray(policies) && policies.length > 0 && (!db.policies || db.policies.length === 0)) {
        db.policies = policies;
        changed = true;
      }
      if (Array.isArray(reminders) && reminders.length > 0 && (!db.reminders || db.reminders.length === 0)) {
        db.reminders = reminders;
        changed = true;
      }
      if (changed) {
        saveDatabase(db);
      }
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
