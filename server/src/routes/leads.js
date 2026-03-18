import express from 'express';
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  updateLeadStage,
  addActivity,
  convertToWedding,
  deleteLead,
  getLeadsByStage
} from '../controllers/leadController.js';
import { protect, isAdminOrManager } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/pipeline', getLeadsByStage);
router.route('/')
  .get(getLeads)
  .post(createLead);

router.route('/:id')
  .get(getLead)
  .put(updateLead)
  .delete(isAdminOrManager, deleteLead);

router.put('/:id/stage', updateLeadStage);
router.post('/:id/activity', addActivity);
router.post('/:id/convert', isAdminOrManager, convertToWedding);

export default router;
