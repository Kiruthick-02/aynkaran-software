// backend/utils/storageService.js
import { GridFSBucket } from 'mongodb';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_UPLOADS = path.join(__dirname, '..', 'uploads');

let gridFSBucket = null;
let currentDb = null;

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.ogg': 'video/ogg',
  '.json': 'application/json',
  '.txt': 'text/plain',
};

export function getMimeType(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export function getBaseUrl() {
  const envUrl = process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'https://aynkaran-backend.onrender.com';
}

export function toPublicHttpsUrl(storedPath) {
  if (!storedPath) return null;
  const pathStr = String(storedPath).trim();
  if (!pathStr) return null;

  // Already a full external URL (e.g. Cloudinary / S3 / HTTPS CDN)
  if (/^https?:\/\//i.test(pathStr)) {
    // If it's an old localhost URL, replace host with public backend URL
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(pathStr)) {
      const cleanPath = pathStr.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, '');
      return `${getBaseUrl()}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
    }
    return pathStr;
  }

  // Ensure leading slash
  const cleanPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
  
  // Format as /api/uploads/...
  if (cleanPath.startsWith('/uploads/')) {
    return `${getBaseUrl()}/api${cleanPath}`;
  }
  if (cleanPath.startsWith('/api/uploads/')) {
    return `${getBaseUrl()}${cleanPath}`;
  }

  return `${getBaseUrl()}/api/uploads${cleanPath}`;
}

export function initStorage(db) {
  if (!db) return;
  currentDb = db;
  gridFSBucket = new GridFSBucket(db, { bucketName: 'media_files' });
  console.log('[Storage] MongoDB GridFS Bucket "media_files" initialized.');
}

/**
 * Upload a file Buffer to MongoDB GridFS persistent storage
 */
export async function uploadBufferToStorage(buffer, filename, folder = 'misc', mimeType = null) {
  if (!gridFSBucket || !currentDb) {
    throw new Error('GridFS storage bucket not initialized');
  }

  const detectedMime = mimeType || getMimeType(filename);
  const fullStoredPath = `/uploads/${folder}/${filename}`.replace(/\/+/g, '/');

  // Check if file already exists with same size
  try {
    const existing = await currentDb.collection('media_files.files').findOne({
      $or: [
        { 'metadata.storedPath': fullStoredPath },
        { filename, 'metadata.folder': folder },
      ]
    });
    if (existing && existing.length === buffer.length) {
      return {
        id: existing._id,
        filename,
        folder,
        storedPath: fullStoredPath,
        publicUrl: toPublicHttpsUrl(fullStoredPath),
        mimeType: detectedMime,
        size: buffer.length,
      };
    }
    if (existing) {
      await gridFSBucket.delete(existing._id).catch(() => {});
    }
  } catch (e) {}

  return new Promise((resolve, reject) => {
    const uploadStream = gridFSBucket.openUploadStream(filename, {
      contentType: detectedMime,
      metadata: {
        folder,
        filename,
        storedPath: fullStoredPath,
        mimeType: detectedMime,
        uploadedAt: new Date(),
      }
    });

    uploadStream.on('error', (err) => reject(err));
    uploadStream.on('finish', (file) => {
      resolve({
        id: (file && file._id) || uploadStream.id,
        filename,
        folder,
        storedPath: fullStoredPath,
        publicUrl: toPublicHttpsUrl(fullStoredPath),
        mimeType: detectedMime,
        size: buffer.length,
      });
    });

    uploadStream.write(buffer, (writeErr) => {
      if (writeErr) return reject(writeErr);
      uploadStream.end();
    });
  });
}

/**
 * Upload local file from disk to MongoDB GridFS
 */
export async function uploadLocalFileToStorage(localFilePath, folder, customFilename = null) {
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`File not found: ${localFilePath}`);
  }
  const filename = customFilename || path.basename(localFilePath);
  const buffer = fs.readFileSync(localFilePath);
  const mimeType = getMimeType(filename);
  return uploadBufferToStorage(buffer, filename, folder, mimeType);
}

/**
 * Express Route Handler to serve media files directly from GridFS or local fallback
 */
export async function serveMediaHandler(req, res) {
  const folder = req.params.folder || 'misc';
  const filename = req.params.filename;

  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  const cleanFilename = path.basename(filename);
  const storedPath = `/uploads/${folder}/${cleanFilename}`;
  const contentType = getMimeType(cleanFilename);

  // Set standard caching headers for high performance
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Try fetching from GridFS first
  if (gridFSBucket && currentDb) {
    try {
      const fileDoc = await currentDb.collection('media_files.files').findOne({
        $or: [
          { filename: cleanFilename, 'metadata.folder': folder },
          { 'metadata.storedPath': storedPath },
          { filename: cleanFilename },
        ]
      });

      if (fileDoc) {
        if (fileDoc.contentType) {
          res.setHeader('Content-Type', fileDoc.contentType);
        }
        const downloadStream = gridFSBucket.openDownloadStream(fileDoc._id);
        downloadStream.on('error', (err) => {
          console.error('[Media Serve Error]', err);
          if (!res.headersSent) res.status(404).end();
        });
        return downloadStream.pipe(res);
      }
    } catch (dbErr) {
      console.warn('[GridFS Lookup Warn]', dbErr.message);
    }
  }

  // Fallback to local disk if available
  const localCandidates = [
    path.join(LOCAL_UPLOADS, folder, cleanFilename),
    path.join(LOCAL_UPLOADS, cleanFilename),
    path.join(process.cwd(), 'uploads', folder, cleanFilename),
    path.join(process.cwd(), 'uploads', cleanFilename),
    path.join(process.cwd(), 'backend', 'uploads', folder, cleanFilename),
    path.join(process.cwd(), 'backend', 'uploads', cleanFilename),
  ];

  for (const candidate of localCandidates) {
    if (fs.existsSync(candidate)) {
      return fs.createReadStream(candidate).pipe(res);
    }
  }

  return res.status(404).json({
    success: false,
    error: 'Media file not found in persistent storage',
    path: req.originalUrl,
  });
}
