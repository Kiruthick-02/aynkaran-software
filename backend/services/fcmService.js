// backend/services/fcmService.js
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the service account key
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

let initialized = false;

function initFirebase() {
  if (initialized) return;

  if (!fs.existsSync(serviceAccountPath)) {
    console.warn('[FCM] firebase-service-account.json not found. Push notifications disabled.');
    return;
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  initialized = true;
  console.log('[FCM] Firebase Admin initialized');
}

/**
 * Send push notification to one or more device tokens
 */
export async function sendPushToTokens(tokens = [], title, body, data = {}) {
  initFirebase();
  if (!initialized || !tokens.length) return;

  const uniqueTokens = [...new Set(tokens.filter(Boolean))];

  const message = {
    notification: {
      title,
      body,
    },
    data: {
      ...Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
    },
    tokens: uniqueTokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[FCM] Sent: ${response.successCount} success, ${response.failureCount} failed`);
    return response;
  } catch (err) {
    console.error('[FCM] Send error:', err.message);
  }
}

/**
 * Send notification about a new enquiry to all registered staff devices
 */
export async function notifyNewEnquiry(db, enquiry) {
  try {
    const devices = await db.collection('device_tokens').find({}).toArray();
    const tokens = devices.map((d) => d.token).filter(Boolean);

    if (!tokens.length) {
      console.log('[FCM] No device tokens registered yet');
      return;
    }

    const name = enquiry.name || 'Someone';
    const city = enquiry.city ? ` from ${enquiry.city}` : '';

    await sendPushToTokens(
      tokens,
      'New Website Enquiry',
      `${name}${city} just submitted an enquiry`,
      {
        type: 'new_enquiry',
        enquiryType: enquiry.enquiryType || 'customer',
        enquiryId: enquiry.id || '',
        name: enquiry.name || '',
        mobile: enquiry.mobile || '',
      }
    );
  } catch (err) {
    console.error('[FCM] notifyNewEnquiry error:', err.message);
  }
}
