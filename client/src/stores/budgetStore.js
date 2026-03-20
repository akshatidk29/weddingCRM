import { create } from 'zustand';
import api from '../utils/api';
import useToastStore from './toastStore';

const useBudgetStore = create((set, get) => ({
  allItems: [],
  weddingBudgets: [],
  loading: false,

  // Fetch all budget data
  fetchBudget: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/budget');
      const data = res.data.budget || res.data.data || [];
      set({
        allItems: data,
        weddingBudgets: res.data.weddingBudgets || [],
      });
      return res.data;
    } finally {
      set({ loading: false });
    }
  },

  // Update payment status
  updatePayment: async (taskId, type, itemId, data) => {
    await api.put(`/tasks/${taskId}/payment/${type}/${itemId}`, data);
    useToastStore.getState().success('Payment updated successfully');
    await get().fetchBudget();
  },

  // Get items filtered by wedding and status
  getFilteredItems: (weddingId, statusFilter) => {
    const { allItems } = get();
    return allItems.filter(item => {
      if (weddingId && item.weddingId !== weddingId) return false;
      if (statusFilter && item.paymentStatus !== statusFilter) return false;
      return true;
    });
  },

  // Calculate totals for a wedding
  getWeddingTotals: (weddingId) => {
    const { allItems } = get();
    const items = weddingId 
      ? allItems.filter(i => i.weddingId === weddingId)
      : allItems;
    
    return items.reduce((acc, item) => ({
      budget: acc.budget + (item.amount || 0),
      paid: acc.paid + (item.paidAmount || 0),
      pending: acc.pending + ((item.amount || 0) - (item.paidAmount || 0)),
    }), { budget: 0, paid: 0, pending: 0 });
  },

  // Get chart data for a wedding
  getChartData: (weddingId, statusFilter) => {
    const items = get().getFilteredItems(weddingId, statusFilter);
    const categoryTotals = {};
    
    items.forEach(item => {
      const cat = item.category || 'Other';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { budget: 0, paid: 0 };
      }
      categoryTotals[cat].budget += item.amount || 0;
      categoryTotals[cat].paid += item.paidAmount || 0;
    });

    return Object.entries(categoryTotals).map(([name, data]) => ({
      name,
      budget: data.budget,
      paid: data.paid,
      pending: data.budget - data.paid,
    }));
  },
}));

export default useBudgetStore;
