import express from 'express';
import {
  getEventsByWedding,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  addEventTeamMember,
  removeEventTeamMember,
  getClientEvents,
  addHotelToEvent
} from '../controllers/eventController.js';
import { protect, isAdminOrManager, isAdminManagerOrClient } from '../middleware/auth.js';

const router = express.Router();

// Public client-facing route (no auth)
router.get('/client/:weddingId', getClientEvents);

// Protected routes
router.use(protect);

router.get('/wedding/:weddingId', getEventsByWedding);

router.route('/:id')
  .get(getEvent)
  .put(isAdminManagerOrClient, updateEvent)
  .delete(isAdminManagerOrClient, deleteEvent);

router.post('/', isAdminManagerOrClient, createEvent);

router.post('/:id/team', isAdminManagerOrClient, addEventTeamMember);
router.delete('/:id/team/:userId', isAdminManagerOrClient, removeEventTeamMember);

router.post('/:id/hotels', isAdminManagerOrClient, addHotelToEvent);

export default router;
