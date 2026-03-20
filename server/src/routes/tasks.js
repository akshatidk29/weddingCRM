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
import { protect, isAdminOrManager } from '../middleware/auth.js';

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
  .put(isAdminOrManager, updateTask)
  .delete(isAdminOrManager, deleteTask);

router.put('/:id/status', isAdminOrManager, updateTaskStatus);

// Subtask routes
router.post('/:id/subtasks', isAdminOrManager, addSubtask);
router.put('/:id/subtasks/:subId', isAdminOrManager, toggleSubtask);
router.delete('/:id/subtasks/:subId', isAdminOrManager, deleteSubtask);

// Task vendor routes
router.post('/:id/vendors', isAdminOrManager, addTaskVendor);
router.put('/:id/vendors/:vendorId', isAdminOrManager, updateTaskVendorStatus);
router.delete('/:id/vendors/:vendorId', isAdminOrManager, deleteTaskVendor);

// Vendor cross-task routes
router.get('/by-vendor/:vendorId', getTasksByVendorId);
router.put('/vendor-toggle/:vendorId', isAdminOrManager, toggleVendorAcrossTasks);

// Payments (Budgets) route
router.put('/:id/payment/:type/:itemId', isAdminOrManager, updatePayment);

export default router;
