import { Router } from 'express';
import {
  getTransfers,
  issueTransferCertificate,
  getTransferById
} from '../controllers/transferController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getTransfers);
router.get('/:id', getTransferById);
router.post('/', authorize(['ADMIN', 'PRINCIPAL', 'CLERK']), issueTransferCertificate);

export default router;
