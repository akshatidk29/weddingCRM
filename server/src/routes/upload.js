import express from 'express';
import { protect, isAdminOrManager } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { 
  uploadToTask, 
  uploadToEvent, 
  deleteFromTask, 
  deleteFromEvent 
} from '../controllers/uploadController.js';

const router = express.Router();

// Only admin/manager can upload or delete documents
router.post('/task/:taskId', protect, isAdminOrManager, upload.single('document'), uploadToTask);
router.post('/event/:eventId', protect, isAdminOrManager, upload.single('document'), uploadToEvent);

router.delete('/task/:taskId/:docId', protect, isAdminOrManager, deleteFromTask);
router.delete('/event/:eventId/:docId', protect, isAdminOrManager, deleteFromEvent);

export default router;
