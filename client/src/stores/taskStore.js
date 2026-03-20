import { create } from 'zustand';
import api from '../utils/api';
import useToastStore from './toastStore';

const useTaskStore = create((set, get) => ({
  tasks: [],
  weddings: [],
  events: [],
  users: [],
  vendors: [],
  loading: false,

  // Fetch all tasks with related data
  fetchTasks: async () => {
    set({ loading: true });
    try {
      const [tasksRes, weddingsRes, usersRes, vendorsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/weddings'),
        api.get('/auth/users'),
        api.get('/vendors'),
      ]);
      set({
        tasks: tasksRes.data.tasks,
        weddings: weddingsRes.data.weddings,
        users: usersRes.data.users,
        vendors: vendorsRes.data.vendors,
      });
    } finally {
      set({ loading: false });
    }
  },

  // Fetch events for a wedding
  fetchEventsForWedding: async (weddingId) => {
    if (!weddingId) {
      set({ events: [] });
      return;
    }
    try {
      const res = await api.get(`/events/wedding/${weddingId}`);
      set({ events: res.data.events || [] });
    } catch {
      set({ events: [] });
    }
  },

  // Create task
  createTask: async (data) => {
    await api.post('/tasks', data);
    useToastStore.getState().success('Task created successfully');
    await get().fetchTasks();
  },

  // Update task
  updateTask: async (id, data) => {
    await api.put(`/tasks/${id}`, data);
    useToastStore.getState().success('Task updated successfully');
    await get().fetchTasks();
  },

  // Delete task
  deleteTask: async (id) => {
    await api.delete(`/tasks/${id}`);
    useToastStore.getState().success('Task deleted successfully');
    await get().fetchTasks();
  },

  // Update task status
  updateTaskStatus: async (id, status) => {
    await api.put(`/tasks/${id}/status`, { status });
    useToastStore.getState().success('Task status updated');
    await get().fetchTasks();
  },

  // Subtask operations
  toggleSubtask: async (taskId, subtaskId) => {
    await api.put(`/tasks/${taskId}/subtasks/${subtaskId}`);
    await get().fetchTasks();
  },

  deleteSubtask: async (taskId, subtaskId) => {
    await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
    await get().fetchTasks();
  },

  // Task vendor operations
  updateTaskVendorStatus: async (taskId, vendorId, status) => {
    await api.put(`/tasks/${taskId}/vendors/${vendorId}`, { status });
    await get().fetchTasks();
  },

  deleteTaskVendor: async (taskId, vendorId) => {
    await api.delete(`/tasks/${taskId}/vendors/${vendorId}`);
    await get().fetchTasks();
  },

  // For wedding detail page - reload just wedding data
  reloadForWedding: async () => {
    // This just re-fetches, the parent component can call fetchWedding
  },
}));

export default useTaskStore;
