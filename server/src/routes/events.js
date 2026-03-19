import express from 'express';
import {
  getEventsByWedding,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  addEventTeamMember,
  removeEventTeamMember,
  getClientEvents
} from '../controllers/eventController.js';
import { protect, isAdminOrManager } from '../middleware/auth.js';

const router = express.Router();

// Public client-facing route (no auth)
router.get('/client/:weddingId', getClientEvents);

// Protected routes
router.use(protect);

router.get('/wedding/:weddingId', getEventsByWedding);

router.route('/:id')
  .get(getEvent)
  .put(isAdminOrManager, updateEvent)
  .delete(isAdminOrManager, deleteEvent);

router.post('/', isAdminOrManager, createEvent);

router.post('/:id/team', isAdminOrManager, addEventTeamMember);
router.delete('/:id/team/:userId', isAdminOrManager, removeEventTeamMember);

export default router;
