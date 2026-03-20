import { create } from 'zustand';

const useToastStore = create((set, get) => ({
  toasts: [],

  // Add a toast notification
  addToast: (toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: toast.type || 'info', // 'success' | 'error' | 'warning' | 'info'
      message: toast.message,
      duration: toast.duration ?? 5000,
    };

    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto-remove after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }

    return id;
  },

  // Remove a toast by id
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  // Clear all toasts
  clearToasts: () => set({ toasts: [] }),

  // Convenience methods
  success: (message, duration) => get().addToast({ type: 'success', message, duration }),
  error: (message, duration) => get().addToast({ type: 'error', message, duration: duration ?? 7000 }),
  warning: (message, duration) => get().addToast({ type: 'warning', message, duration }),
  info: (message, duration) => get().addToast({ type: 'info', message, duration }),
}));

export default useToastStore;
