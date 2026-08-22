import { Router } from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} from '../controllers/studentController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all student routes
router.use(authenticate);

router.get('/', getStudents);
router.get('/:id', getStudentById);
router.post('/', authorize(['ADMIN', 'PRINCIPAL', 'CLERK']), createStudent);
router.put('/:id', authorize(['ADMIN', 'PRINCIPAL', 'CLERK']), updateStudent);
router.patch('/:id', authorize(['ADMIN', 'PRINCIPAL', 'CLERK']), updateStudent);
router.delete('/:id', authorize(['ADMIN', 'PRINCIPAL']), deleteStudent);

export default router;
