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
import { protect, isAdminOrManager, isAdminManagerOrClient } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/upcoming', getUpcomingWeddings);

router.route('/')
  .get(getWeddings)
  .post(isAdminOrManager, createWedding);

router.route('/:id')
  .get(getWedding)
  .put(isAdminManagerOrClient, updateWedding)
  .delete(isAdminManagerOrClient, deleteWedding);

router.post('/:id/team', isAdminManagerOrClient, addTeamMember);
router.delete('/:id/team/:userId', isAdminManagerOrClient, removeTeamMember);

router.post('/:id/vendors', isAdminManagerOrClient, addVendorToWedding);
router.delete('/:id/vendors/:vendorId', isAdminManagerOrClient, removeVendorFromWedding);

export default router;
