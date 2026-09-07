// backend/routes/enquiryRoutes.js
import express from 'express';
import { notifyNewEnquiry } from '../services/fcmService.js';

export function enquiryRoutes(db) {
  const router = express.Router();
  const collection = db.collection('enquiries');
  const devicesCol = db.collection('device_tokens');

  // ---------- Get all enquiries ----------
  router.get('/', async (req, res) => {
    try {
      const requestedType = String(req.query.type || '').toLowerCase();
      const query = requestedType === 'advisor'
        ? { enquiryType: 'advisor' }
        : requestedType === 'customer'
        ? { $or: [{ enquiryType: 'customer' }, { enquiryType: { $exists: false } }] }
        : {};
      const rows = await collection
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------- Create new enquiry (from website) ----------
  router.post('/', async (req, res) => {
    try {
      const body = req.body || {};
      const doc = {
        id: body.id || `enq-${Date.now()}`,
        name: body.name || '',
        gender: body.gender || '',
        dateOfBirth: body.dateOfBirth || body.dob || '',
        dob: body.dob || body.dateOfBirth || '',
        mobile: body.mobile || '',
        whatsApp: body.whatsApp || body.mobile || '',
        email: body.email || '',
        city: body.city || '',
        message: body.message || body.notes || '',
        notes: body.notes || body.message || '',
        source: body.source || 'website',
        // Advisor forms on the public website/mobile app must send either
        // enquiryType: 'advisor' or type: 'advisor'. Customer is the legacy
        // default, so existing customer forms remain unchanged.
        enquiryType: String(body.enquiryType || body.type || body.formType || body.source || 'customer')
          .toLowerCase().includes('advisor') ? 'advisor' : 'customer',
        status: 'new',                    // useful for follow-up
        isRead: false,
        timestamp: body.timestamp || new Date().toLocaleString(),
        createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      };

      await collection.insertOne(doc);

      // ★ Send push notification to all staff phones
      notifyNewEnquiry(db, doc).catch((err) =>
        console.error('[Enquiry] FCM failed:', err.message)
      );

      res.status(201).json(doc);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------- Mark as read / update status ----------
  router.patch('/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const updates = { ...req.body };
      delete updates._id;

      const filter = { $or: [{ id }, { id: id }] };
      // also try _id if it looks like ObjectId (optional)
      await collection.updateOne(
        { id },
        { $set: { ...updates, updatedAt: new Date() } }
      );

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------- Delete enquiry ----------
  router.delete('/:id', async (req, res) => {
    try {
      const id = req.params.id;
      await collection.deleteOne({ id });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // =====================================================
  // DEVICE TOKEN ENDPOINTS (for Android app)
  // =====================================================

  // Register / update FCM token from Android
  router.post('/device-token', async (req, res) => {
    try {
      const { token, username, deviceName } = req.body || {};

      if (!token) {
        return res.status(400).json({ error: 'token is required' });
      }

      await devicesCol.updateOne(
        { token },
        {
          $set: {
            token,
            username: username || 'staff',
            deviceName: deviceName || '',
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      res.json({ success: true, message: 'Device token registered' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Optional: remove token (on logout)
  router.delete('/device-token', async (req, res) => {
    try {
      const { token } = req.body || {};
      if (!token) return res.status(400).json({ error: 'token required' });

      await devicesCol.deleteOne({ token });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
