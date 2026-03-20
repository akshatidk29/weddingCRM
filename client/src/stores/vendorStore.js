import { create } from 'zustand';
import api from '../utils/api';
import useToastStore from './toastStore';

const useVendorStore = create((set, get) => ({
  vendors: [],
  loading: false,
  // Lazy-loaded data per vendor
  vendorTasks: {}, // { [vendorId]: tasks[] }
  vendorEvents: {}, // { [vendorId]: events[] }

  // Fetch all vendors
  fetchVendors: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/vendors');
      set({ vendors: res.data.vendors });
    } finally {
      set({ loading: false });
    }
  },

  // Create vendor
  createVendor: async (data) => {
    await api.post('/vendors', data);
    useToastStore.getState().success('Vendor created successfully');
    await get().fetchVendors();
  },

  // Update vendor
  updateVendor: async (id, data) => {
    await api.put(`/vendors/${id}`, data);
    useToastStore.getState().success('Vendor updated successfully');
    await get().fetchVendors();
  },

  // Delete vendor
  deleteVendor: async (id) => {
    await api.delete(`/vendors/${id}`);
    useToastStore.getState().success('Vendor deleted successfully');
    await get().fetchVendors();
  },

  // Lazy load tasks for a vendor
  fetchVendorTasks: async (vendorId) => {
    try {
      const res = await api.get(`/tasks/by-vendor/${vendorId}`);
      set((state) => ({
        vendorTasks: { ...state.vendorTasks, [vendorId]: res.data.tasks || [] },
      }));
    } catch {
      set((state) => ({
        vendorTasks: { ...state.vendorTasks, [vendorId]: [] },
      }));
    }
  },

  // Lazy load events for a vendor
  fetchVendorEvents: async (vendorId) => {
    try {
      const res = await api.get(`/vendors/${vendorId}/linked-events`);
      set((state) => ({
        vendorEvents: { ...state.vendorEvents, [vendorId]: res.data.events || [] },
      }));
    } catch {
      set((state) => ({
        vendorEvents: { ...state.vendorEvents, [vendorId]: [] },
      }));
    }
  },

  // Load both tasks and events for a vendor
  loadVendorDetails: async (vendorId) => {
    await Promise.all([
      get().fetchVendorTasks(vendorId),
      get().fetchVendorEvents(vendorId),
    ]);
  },

  // Clear vendor details cache
  clearVendorDetails: (vendorId) => {
    set((state) => {
      const newTasks = { ...state.vendorTasks };
      const newEvents = { ...state.vendorEvents };
      delete newTasks[vendorId];
      delete newEvents[vendorId];
      return { vendorTasks: newTasks, vendorEvents: newEvents };
    });
  },
}));

export default useVendorStore;
