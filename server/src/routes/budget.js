import express from 'express';
import { getBudget } from '../controllers/budgetController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getBudget);

export default router;
