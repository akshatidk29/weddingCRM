/* ─────────────────────────────────────────
   src/stores/chatStore.js
   Zustand store — chat messages + notifications
   (all in-memory, intentionally not persisted)
───────────────────────────────────────── */
import { create } from 'zustand';

const useChatStore = create((set, get) => ({
  /* ── Chat ── */
  messages: [],          // { id, role: 'user'|'assistant'|'system', content, ts }
  isOpen: false,
  isLoading: false,

  openChat:  () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set(s => ({ isOpen: !s.isOpen })),

  addMessage: (role, content) => {
    const msg = { id: Date.now() + Math.random(), role, content, ts: new Date() };
    set(s => ({ messages: [...s.messages, msg] }));
    return msg;
  },

  setLoading: (v) => set({ isLoading: v }),

  clearMessages: () => set({ messages: [] }),

  /* ── Notifications ── */
  notifications: [],     // { id, text, ts, read }
  hasUnread: false,

  addNotification: (text) => {
    // Deduplicate: don't add if same text exists and was added in last 30 min
    const existing = get().notifications;
    const recent = existing.find(n =>
      n.text === text && (Date.now() - new Date(n.ts).getTime()) < 30 * 60 * 1000
    );
    if (recent) return;

    const notif = { id: Date.now() + Math.random(), text, ts: new Date(), read: false };
    set(s => ({
      notifications: [notif, ...s.notifications].slice(0, 50), // cap at 50
      hasUnread: true,
    }));
  },

  markAllRead: () => set(s => ({
    notifications: s.notifications.map(n => ({ ...n, read: true })),
    hasUnread: false,
  })),

  clearNotifications: () => set({ notifications: [], hasUnread: false }),
}));

export default useChatStore;