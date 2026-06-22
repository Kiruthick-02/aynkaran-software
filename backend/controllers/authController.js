/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jwt from 'jsonwebtoken';
import { sendEmailReceipt } from '../utils/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aynkaran-secret-desktop-token-key-2026';

// Multi-tenant high density authentication controller matched with admin accounts using MongoDB Atlas
export class AuthController {
  constructor(db) {
    this.db = db;
  }

  logActivity = async (username, action, target) => {
    const logObj = {
      id: `log-${Date.now().toString().slice(-5)}`,
      username,
      action,
      target,
      timestamp: new Date().toISOString()
    };
    try {
      await this.db.collection('logs').insertOne(logObj);
    } catch (e) {
      console.error('Failed to log activity in MongoDB:', e);
    }
  };

  login = async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password credentials are required.' });
      }

      // Default fallback local desktop root administrator
      if (username === 'admin' && password === 'admin@aynkaran') {
        const token = jwt.sign(
          { id: 'usr-admin', username: 'admin', role: 'SuperAdmin' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        await this.logActivity('admin', 'Logged In', 'Command Center Session Active');
        return res.json({
          success: true,
          token,
          user: { id: 'usr-admin', username: 'admin', role: 'SuperAdmin', displayName: 'Aynkaran Admin' }
        });
      }

      // Query database user structures if customized in MongoDB
      const user = await this.db.collection('users').findOne({ username });
      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid operation system credentials.' });
      }

      const token = jwt.sign(
        { id: user.id || user._id.toString(), username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      await this.logActivity(user.username, 'Logged In', 'Staff Gateway Active');

      res.json({
        success: true,
        token,
        user: { id: user.id || user._id.toString(), username: user.username, role: user.role, displayName: user.displayName }
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  logout = async (req, res) => {
    try {
      const { username } = req.body;
      await this.logActivity(username || 'admin', 'Logged Out', 'Session Closed');
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  verifyToken = async (req, res) => {
    res.json({ success: true, user: req.user });
  };

  registerStaff = async (req, res) => {
    try {
      const { username, password, displayName, requesterRole } = req.body;
      if (requesterRole !== 'SuperAdmin') {
        return res.status(403).json({ error: 'Unauthorized. Only Superadmin can create Staff login credentials.' });
      }

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }

      const trimmedUser = username.trim();
      const exists = await this.db.collection('users').findOne({ username: trimmedUser });
      if (exists) {
        return res.status(400).json({ error: 'Username already exists!' });
      }

      const newStaff = {
        id: `usr-${Date.now().toString().slice(-5)}`,
        username: trimmedUser,
        password,
        displayName: displayName || trimmedUser,
        role: 'Staff',
        createdAt: new Date().toISOString()
      };

      await this.db.collection('users').insertOne(newStaff);
      await this.logActivity('admin', 'Registered Staff User', `Username: ${newStaff.username}`);

      res.status(201).json({ success: true, user: newStaff });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  getStaffList = async (req, res) => {
    try {
      let list = await this.db.collection('users').find({ role: 'Staff' }).toArray();
      list = list.map(r => ({ ...r, _id: undefined }));
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  deleteStaff = async (req, res) => {
    try {
      const { username } = req.params;
      await this.db.collection('users').deleteOne({ username });
      await this.logActivity('admin', 'Deleted Staff User', `Username: ${username}`);
      res.json({ success: true, message: 'Staff credentials cleared successfully.' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  getStaffLogs = async (req, res) => {
    try {
      let list = await this.db.collection('logs').find().sort({ timestamp: -1 }).toArray();
      list = list.map(r => ({ ...r, _id: undefined }));
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  clearStaffLogs = async (req, res) => {
    try {
      await this.db.collection('logs').deleteMany({});
      await this.logActivity('admin', 'Cleared Staff Activity Logs', 'All logs deleted');
      res.json({ success: true, message: 'Activity logs cleared.' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  requestDeleteOTP = async (req, res) => {
    try {
      const { username, targetId, targetType, targetName } = req.body;
      
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      await this.db.collection('otps').updateOne(
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

      console.log(`
============================ OTP OUTBOX SIMULATOR ============================
[Service Alert] Trigger OTP for deletion of ${targetType}
SuperAdmin Email : kiruthickrn@gmail.com
Staff Member     : ${username}
Request Target   : ID ${targetId} (${targetName || 'Unnamed'})
OTP CODE         : ${otpCode}
=============================================================================
`);

      await this.logActivity(username, 'Requested OTP Deletion', `${targetType} Item ID: ${targetId}`);

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
        console.log(`[Email Dispatcher] Dispatched deletion OTP email to kiruthickrn@gmail.com`);
      } catch (emailErr) {
        console.error('[Email Dispatcher] Failed to dispatch deletion OTP:', emailErr);
      }

      res.json({
        success: true,
        message: `An authorization OTP has been issued and dispatched to Superadmin's registered email (kiruthickrn@gmail.com).`
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };
}
