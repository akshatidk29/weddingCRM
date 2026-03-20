import { create } from 'zustand';
import api from '../utils/api';
import useToastStore from './toastStore';

const useEventStore = create((set) => ({
  events: [],
  loading: false,

  // Fetch events for a wedding
  fetchEvents: async (weddingId) => {
    set({ loading: true });
    try {
      const res = await api.get(`/events/wedding/${weddingId}`);
      set({ events: res.data.events || [] });
    } finally {
      set({ loading: false });
    }
  },

  // Create event
  createEvent: async (data) => {
    await api.post('/events', data);
    useToastStore.getState().success('Event created successfully');
  },

  // Update event
  updateEvent: async (id, data) => {
    await api.put(`/events/${id}`, data);
    useToastStore.getState().success('Event updated successfully');
  },

  // Delete event
  deleteEvent: async (id) => {
    await api.delete(`/events/${id}`);
    useToastStore.getState().success('Event deleted successfully');
  },

  // Event team management
  addEventTeamMember: async (eventId, data) => {
    await api.post(`/events/${eventId}/team`, data);
    useToastStore.getState().success('Team member added to event');
  },

  updateEventTeamMember: async (eventId, memberId, data) => {
    await api.put(`/events/${eventId}/team/${memberId}`, data);
    useToastStore.getState().success('Team member updated');
  },

  removeEventTeamMember: async (eventId, memberId) => {
    await api.delete(`/events/${eventId}/team/${memberId}`);
    useToastStore.getState().success('Team member removed from event');
  },

  clearEvents: () => set({ events: [] }),
}));

export default useEventStore;
