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
  getOverdueTasks,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  addTaskVendor,
  updateTaskVendorStatus,
  deleteTaskVendor,
  getTasksByVendorId,
  toggleVendorAcrossTasks,
  updatePayment
} from '../controllers/taskController.js';
import { protect, isAdminOrManager, isAdminManagerOrClient } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/my-tasks', getMyTasks);
router.get('/overdue', getOverdueTasks);
router.get('/wedding/:weddingId', getTasksByWedding);

router.route('/')
  .get(getTasks)
  .post(isAdminOrManager, createTask);

router.post('/bulk', isAdminOrManager, createBulkTasks);

router.route('/:id')
  .get(getTask)
  .put(isAdminManagerOrClient, updateTask)
  .delete(isAdminManagerOrClient, deleteTask);

router.put('/:id/status', isAdminManagerOrClient, updateTaskStatus);

// Subtask routes
router.post('/:id/subtasks', isAdminManagerOrClient, addSubtask);
router.put('/:id/subtasks/:subId', isAdminManagerOrClient, toggleSubtask);
router.delete('/:id/subtasks/:subId', isAdminManagerOrClient, deleteSubtask);

// Task vendor routes
router.post('/:id/vendors', isAdminManagerOrClient, addTaskVendor);
router.put('/:id/vendors/:vendorId', isAdminManagerOrClient, updateTaskVendorStatus);
router.delete('/:id/vendors/:vendorId', isAdminManagerOrClient, deleteTaskVendor);

// Vendor cross-task routes
router.get('/by-vendor/:vendorId', getTasksByVendorId);
router.put('/vendor-toggle/:vendorId', isAdminManagerOrClient, toggleVendorAcrossTasks);

// Payments (Budgets) route
router.put('/:id/payment/:type/:itemId', isAdminManagerOrClient, updatePayment);

export default router;
