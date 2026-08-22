import { Router } from 'express';
import { uploadDocument, streamDocument } from '../controllers/documentController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

// Securely stream private document file (allowed for all authenticated users)
router.get('/file/:filename', authenticate, streamDocument);

// Upload supplementary document
router.post('/upload', authenticate, authorize(['ADMIN', 'PRINCIPAL', 'CLERK']), upload.single('file'), uploadDocument);

export default router;
