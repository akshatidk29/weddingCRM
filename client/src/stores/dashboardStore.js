import { create } from 'zustand';
import api from '../utils/api';

const useDashboardStore = create((set) => ({
  stats: null,
  activity: [],
  monthlyData: [],
  myTasks: [],
  loading: false,

  fetchDashboard: async () => {
    set({ loading: true });
    try {
      const [statsRes, activityRes, tasksRes, monthlyRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/activity'),
        api.get('/tasks/my-tasks'),
        api.get('/dashboard/monthly').catch(() => ({ data: [] })),
      ]);
      set({
        stats: statsRes.data.stats,
        activity: activityRes.data,
        myTasks: tasksRes.data.tasks || [],
        monthlyData: monthlyRes.data || [],
      });
    } finally {
      set({ loading: false });
    }
  },
}));

export default useDashboardStore;
