import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize(['ADMIN', 'PRINCIPAL']), getAuditLogs);

export default router;
