import axios from 'axios';
import useToastStore from '../stores/toastStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    const status = error.response?.status;
    const currentPath = window.location.pathname;
    
    // Auth pages (login/register) handle their own errors inline
    const isAuthPage = currentPath === '/login' || currentPath === '/register';
    
    // Handle 401 - session expired (not on auth pages)
    if (status === 401 && !isAuthPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Dynamically import authStore to clear Zustand state
      // This lets the PrivateRoute guard in App.jsx handle the redirect naturally
      import('../stores/authStore').then(({ default: useAuthStore }) => {
        useAuthStore.setState({ user: null });
      });
      useToastStore.getState().error('Session expired. Please login again.');
      return Promise.reject(error);
    }
    
    // Show toast for errors (except on auth pages where errors are shown inline)
    if (!isAuthPage) {
      useToastStore.getState().error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
