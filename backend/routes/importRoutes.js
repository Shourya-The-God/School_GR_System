import { Router } from 'express';
import {
  uploadAndProcessOCR,
  getImports,
  getOCRRecordById,
  verifyAndCommitOCRRecord
} from '../controllers/importController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(authenticate);

router.post('/upload', authorize(['ADMIN', 'PRINCIPAL', 'CLERK']), upload.single('document'), uploadAndProcessOCR);
router.get('/', getImports);
router.get('/record/:id', getOCRRecordById);
router.post('/verify/:id', authorize(['ADMIN', 'PRINCIPAL', 'CLERK']), verifyAndCommitOCRRecord);

export default router;
