import express from 'express';
import {
  getWeddings,
  getWedding,
  createWedding,
  updateWedding,
  deleteWedding,
  addTeamMember,
  removeTeamMember,
  addVendorToWedding,
  removeVendorFromWedding,
  getUpcomingWeddings
} from '../controllers/weddingController.js';
import { protect, isAdminOrManager } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/upcoming', getUpcomingWeddings);

router.route('/')
  .get(getWeddings)
  .post(isAdminOrManager, createWedding);

router.route('/:id')
  .get(getWedding)
  .put(isAdminOrManager, updateWedding)
  .delete(isAdminOrManager, deleteWedding);

router.post('/:id/team', isAdminOrManager, addTeamMember);
router.delete('/:id/team/:userId', isAdminOrManager, removeTeamMember);

router.post('/:id/vendors', isAdminOrManager, addVendorToWedding);
router.delete('/:id/vendors/:vendorId', isAdminOrManager, removeVendorFromWedding);

export default router;
