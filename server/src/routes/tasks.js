import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  createBulkTasks,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTasksByWedding,
  getMyTasks,
  getOverdueTasks
} from '../controllers/taskController.js';
import { protect, isAdminOrManager } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/my-tasks', getMyTasks);
router.get('/overdue', getOverdueTasks);
router.get('/wedding/:weddingId', getTasksByWedding);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.post('/bulk', isAdminOrManager, createBulkTasks);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(isAdminOrManager, deleteTask);

router.put('/:id/status', updateTaskStatus);

export default router;
