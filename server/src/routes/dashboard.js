import express from 'express';
import {
  getDashboardStats,
  getRecentActivity,
  getMonthlyStats,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/activity', getRecentActivity);
router.get('/monthly', getMonthlyStats);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/notifications/read-all', markAllNotificationsRead);

export default router;
