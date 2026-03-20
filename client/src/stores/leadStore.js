import { create } from 'zustand';
import api from '../utils/api';
import useToastStore from './toastStore';

const useLeadStore = create((set, get) => ({
  leads: [],
  pipeline: { inquiry: [], proposal: [], negotiation: [], booked: [], lost: [] },
  users: [],
  loading: false,

  // Fetch all leads
  fetchLeads: async () => {
    set({ loading: true });
    try {
      const [pipelineRes, leadsRes, usersRes] = await Promise.all([
        api.get('/leads/pipeline'),
        api.get('/leads'),
        api.get('/auth/users'),
      ]);
      set({
        pipeline: pipelineRes.data.leads || pipelineRes.data.pipeline || { inquiry: [], proposal: [], negotiation: [], booked: [], lost: [] },
        leads: leadsRes.data.leads,
        users: usersRes.data.users,
      });
    } finally {
      set({ loading: false });
    }
  },

  // Create lead
  createLead: async (data) => {
    await api.post('/leads', data);
    useToastStore.getState().success('Lead created successfully');
    await get().fetchLeads();
  },

  // Update lead
  updateLead: async (id, data) => {
    await api.put(`/leads/${id}`, data);
    useToastStore.getState().success('Lead updated successfully');
    await get().fetchLeads();
  },

  // Delete lead
  deleteLead: async (id) => {
    await api.delete(`/leads/${id}`);
    useToastStore.getState().success('Lead deleted successfully');
    await get().fetchLeads();
  },

  // Update lead stage (for drag and drop)
  updateLeadStage: async (id, stage) => {
    await api.put(`/leads/${id}/stage`, { stage });
    await get().fetchLeads();
  },

  // Convert lead to wedding
  convertLead: async (id, weddingDate) => {
    await api.post(`/leads/${id}/convert`, { weddingDate });
    useToastStore.getState().success('Lead converted to wedding successfully');
    await get().fetchLeads();
  },

  // Calculate pipeline value
  getPipelineValue: () => {
    const { pipeline } = get();
    let total = 0;
    Object.values(pipeline).forEach(leads => {
      leads.forEach(lead => {
        total += lead.estimatedBudget || 0;
      });
    });
    return total;
  },
}));

export default useLeadStore;
