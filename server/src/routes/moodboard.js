import express from 'express';
import { protect, isAdminOrManager } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  getMoodBoardItems,
  getMoodBoardByEvent,
  getMoodBoardItem,
  createMoodBoardItem,
  updateMoodBoardItem,
  deleteMoodBoardItem,
  linkToEvent,
  unlinkFromEvent,
  searchPixabay
} from '../controllers/moodboardController.js';

const router = express.Router();

// Pixabay route (must be before /:id)
router.get('/pixabay', protect, searchPixabay);

// Read routes — all authenticated users
router.get('/', protect, getMoodBoardItems);
router.get('/event/:eventId', protect, getMoodBoardByEvent);
router.get('/:id', protect, getMoodBoardItem);

// Write routes — admin/manager only
router.post('/', protect, isAdminOrManager, upload.single('media'), createMoodBoardItem);
router.put('/:id', protect, isAdminOrManager, upload.single('media'), updateMoodBoardItem);
router.delete('/:id', protect, isAdminOrManager, deleteMoodBoardItem);

// Link/unlink to events — admin/manager only
router.post('/:id/link/:eventId', protect, isAdminOrManager, linkToEvent);
router.delete('/:id/link/:eventId', protect, isAdminOrManager, unlinkFromEvent);

export default router;
