import { create } from 'zustand';
import api from '../utils/api';
import useToastStore from './toastStore';

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  
  // Computed
  get isAdmin() {
    return get().user?.role === 'admin';
  },
  get isManager() {
    const user = get().user;
    return user?.role === 'relationship_manager' || user?.role === 'admin';
  },
  get isTeamMember() {
    return get().user?.role === 'team_member';
  },
  get isClient() {
    return get().user?.role === 'client';
  },

  // Initialize auth state from localStorage
  initialize: async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      set({ user: JSON.parse(savedUser) });
      try {
        const res = await api.get('/auth/me');
        set({ user: res.data.user });
        localStorage.setItem('user', JSON.stringify(res.data.user));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null });
      }
    }
    set({ loading: false });
  },

  // Login
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    set({ user: res.data.user });
    return res.data;
  },

  // Register
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    set({ user: res.data.user });
    return res.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null });
    useToastStore.getState().info('Logged out successfully');
  },

  // Update profile
  updateProfile: async (data) => {
    const res = await api.put('/auth/profile', data);
    const updatedUser = res.data.user;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
    useToastStore.getState().success('Profile updated successfully');
    return res.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    await api.put('/auth/password', { currentPassword, newPassword });
    useToastStore.getState().success('Password changed successfully');
  },
}));

export default useAuthStore;
