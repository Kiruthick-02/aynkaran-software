// backend/app.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncRoutes } from './routes/syncRoutes.js';
import { customerRoutes } from './routes/customerRoutes.js';
import { recruitmentRoutes } from './routes/recruitmentRoutes.js';
import { policyRoutes } from './routes/policyRoutes.js';
import { PolicyController } from './controllers/policyController.js';
import { reminderRoutes } from './routes/reminderRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { documentRoutes } from './routes/documentRoutes.js';
import { enquiryRoutes } from './routes/enquiryRoutes.js';
import { contentRoutes } from './routes/contentRoutes.js';
import { advisorRoutes } from './routes/advisorRoutes.js';
import { initStorage, serveMediaHandler } from './utils/storageService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_UPLOADS = path.join(__dirname, 'uploads');

export function createExpressApp(db) {
  const app = express();

  // Initialize persistent GridFS bucket
  initStorage(db);

  /**
   * ==========================================
   * CORS CONFIGURATION
   * ==========================================
   */
  const allowedOrigins = [
    'http://localhost:3000',   // Website frontend (React / Next)
    'http://127.0.0.1:3000',
    'http://localhost:5173',   // Desktop frontend (Vite)
    'http://127.0.0.1:5173',
    'http://localhost:7860',   // Local unified dev server
    'http://127.0.0.1:7860',
    'https://aynkaran-backend.onrender.com',
  ];
  const configuredFrontendOrigins = String(process.env.FRONTEND_URL || '')
    .split(',')
    .map(origin => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.use(cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.includes('.onrender.com') ||
        origin.includes('.vercel.app') ||
        origin.includes('up.railway.app') ||
        origin.includes('.hf.space') ||
        origin.includes('huggingface.co') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        configuredFrontendOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
  }));

  app.options('*', cors());

  /**
   * ==========================================
   * EXPRESS MIDDLEWARE
   * ==========================================
   */
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Persistent Media Streaming Endpoints (GridFS + Fallback)
  app.get('/api/uploads/:folder/:filename', serveMediaHandler);
  app.get('/uploads/:folder/:filename', serveMediaHandler);
  app.get('/api/uploads/:filename', (req, res) => {
    req.params.folder = 'misc';
    return serveMediaHandler(req, res);
  });
  app.get('/uploads/:filename', (req, res) => {
    req.params.folder = 'misc';
    return serveMediaHandler(req, res);
  });

  // Local filesystem static file serving fallback
  app.use('/uploads', express.static(ROOT_UPLOADS));
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  /**
   * ==========================================
   * API ROUTES
   * ==========================================
   */

  // 1. Core Auth & Security
  app.use('/api/auth', authRoutes(db));

  // 2. Documents & Storage
  app.use('/api/documents', documentRoutes(db));

  // 3. Operations & Customer Lifecycle
  app.use('/api/customers', customerRoutes(db));

  // 3.1 Policy Sales Lead endpoints
  const policyController = new PolicyController(db);
  app.get('/api/policies', policyController.getAll);
  app.post('/api/policies', policyController.create);
  app.put('/api/policies/:id', policyController.update);
  app.delete('/api/policies/:id', policyController.delete);

  // 3.2 Insurance company / product scheme / public catalog endpoints
  app.use('/api', policyRoutes(db));

  // 4. Recruitment & Candidates
  app.use('/api/candidates', recruitmentRoutes(db));

  // 5. Automation & Reminders
  app.use('/api/reminders', reminderRoutes(db));

  // 6. Data Synchronization
  app.use('/api/sync', syncRoutes(db));
  app.use('/api/enquiries', enquiryRoutes(db));

  // 7. Advisor Management Domain & Lifecycle
  app.use('/api/advisors', advisorRoutes(db));

  // 8. Content Publishing & Public Media API
  app.use('/api/content', contentRoutes(db));

  /**
   * ==========================================
   * HEALTH CHECK ROUTE
   * ==========================================
   */
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      status: 'healthy',
      engine: 'MongoDB Atlas GridFS + Document',
      service: 'Aynkaran Business Management System Backend',
      timestamp: new Date().toISOString(),
      publicEnquiryStatus: 'Open'
    });
  });

  /**
   * ==========================================
   * ERROR HANDLERS
   * ==========================================
   */
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'API Route Not Found',
      path: req.originalUrl,
    });
  });

  app.use((err, req, res, next) => {
    console.error('[Express Error]', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

export default createExpressApp;