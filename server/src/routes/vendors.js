import express from 'express';
import {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorsByCategory
} from '../controllers/vendorController.js';
import { protect, isAdminOrManager } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/by-category', getVendorsByCategory);

router.route('/')
  .get(getVendors)
  .post(isAdminOrManager, createVendor);

router.route('/:id')
  .get(getVendor)
  .put(isAdminOrManager, updateVendor)
  .delete(isAdminOrManager, deleteVendor);

export default router;
