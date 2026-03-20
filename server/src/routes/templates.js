import express from 'express';
import { protect, isAdminOrManager } from '../middleware/auth.js';
import { getTemplates, convertTemplate } from '../controllers/templateController.js';

const router = express.Router();

router.get('/', protect, getTemplates);
router.post('/:type/convert', protect, isAdminOrManager, convertTemplate);

export default router;
