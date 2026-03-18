import express from 'express';
import { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  changePassword,
  getUsers,
  updateUserRole
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.use(protect);

router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.get('/users', getUsers);
router.put('/users/:id', authorize('admin'), updateUserRole);

export default router;
