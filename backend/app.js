import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import admissionRoutes from './routes/admissionRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import importRoutes from './routes/importRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

//CORS
const cors = require('cors');
app.use(cors({
  origin: ['https://your-username.github.io', 'http://localhost:3000'],
  credentials: true
}));

// Rate limiter for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});

app.use('/api', apiLimiter);

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static frontend serving
const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend SPA/pages routing fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'pages/login.html'));
});

// Error handling
app.use('/api', notFoundHandler);
app.use(errorHandler);

export default app;
