import { Router } from 'express';
import { createAdmission, addAcademicHistory } from '../controllers/admissionController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize(['ADMIN', 'PRINCIPAL', 'CLERK']), createAdmission);
router.post('/history', authorize(['ADMIN', 'PRINCIPAL', 'CLERK', 'TEACHER']), addAcademicHistory);

export default router;
