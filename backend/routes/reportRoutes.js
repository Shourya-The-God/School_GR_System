import { Router } from 'express';
import { getDashboardStats, exportStudentsCSV, getMetadata } from '../controllers/reportController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/export/csv', exportStudentsCSV);
router.get('/metadata', getMetadata);

export default router;
