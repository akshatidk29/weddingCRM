import { create } from 'zustand';
import api from '../utils/api';
import useToastStore from './toastStore';

const useWeddingStore = create((set, get) => ({
  weddings: [],
  wedding: null, // Current wedding detail
  tasks: [],
  tasksByCategory: {},
  events: [],
  users: [],
  loading: false,

  // Fetch all weddings
  fetchWeddings: async () => {
    set({ loading: true });
    try {
      const [wr, ur] = await Promise.all([
        api.get('/weddings'),
        api.get('/auth/users'),
      ]);
      set({ weddings: wr.data.weddings, users: ur.data.users });
    } finally {
      set({ loading: false });
    }
  },

  // Fetch single wedding with details
  fetchWedding: async (id) => {
    set({ loading: true });
    try {
      const r = await api.get(`/weddings/${id}`);
      set({
        wedding: r.data.wedding,
        tasks: r.data.tasks || [],
        tasksByCategory: r.data.tasksByCategory || {},
        events: r.data.events || [],
      });
      return r.data;
    } finally {
      set({ loading: false });
    }
  },

  // Create wedding
  createWedding: async (data) => {
    const res = await api.post('/weddings', data);
    useToastStore.getState().success('Wedding created successfully');
    await get().fetchWeddings();
    return res.data;
  },

  // Update wedding
  updateWedding: async (id, data) => {
    const res = await api.put(`/weddings/${id}`, data);
    useToastStore.getState().success('Wedding updated successfully');
    await get().fetchWeddings();
    return res.data;
  },

  // Delete wedding
  deleteWedding: async (id) => {
    await api.delete(`/weddings/${id}`);
    useToastStore.getState().success('Wedding deleted successfully');
    await get().fetchWeddings();
  },

  // Team management
  addTeamMember: async (weddingId, data) => {
    await api.post(`/weddings/${weddingId}/team`, data);
    useToastStore.getState().success('Team member added');
    await get().fetchWedding(weddingId);
  },

  updateTeamMember: async (weddingId, memberId, data) => {
    await api.put(`/weddings/${weddingId}/team/${memberId}`, data);
    useToastStore.getState().success('Team member updated');
    await get().fetchWedding(weddingId);
  },

  removeTeamMember: async (weddingId, memberId) => {
    await api.delete(`/weddings/${weddingId}/team/${memberId}`);
    useToastStore.getState().success('Team member removed');
    await get().fetchWedding(weddingId);
  },

  // Wedding vendor management
  addWeddingVendor: async (weddingId, data) => {
    await api.post(`/weddings/${weddingId}/vendors`, data);
    useToastStore.getState().success('Vendor added to wedding');
    await get().fetchWedding(weddingId);
  },

  updateWeddingVendor: async (weddingId, vendorId, data) => {
    await api.put(`/weddings/${weddingId}/vendors/${vendorId}`, data);
    useToastStore.getState().success('Vendor updated');
    await get().fetchWedding(weddingId);
  },

  removeWeddingVendor: async (weddingId, vendorId) => {
    await api.delete(`/weddings/${weddingId}/vendors/${vendorId}`);
    useToastStore.getState().success('Vendor removed from wedding');
    await get().fetchWedding(weddingId);
  },

  // Clear current wedding
  clearWedding: () => set({ wedding: null, tasks: [], tasksByCategory: {}, events: [] }),
}));

export default useWeddingStore;
