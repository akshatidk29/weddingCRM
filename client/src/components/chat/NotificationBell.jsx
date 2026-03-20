/* ─────────────────────────────────────────
   src/components/chat/NotificationBell.jsx
   Animated bell icon — drop this into TopNav
   replacing the existing <Bell> button.
───────────────────────────────────────── */
import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import useChatStore from '../../stores/chatStore';

export default function NotificationBell() {
  const hasUnread      = useChatStore(s => s.hasUnread);
  const notifications  = useChatStore(s => s.notifications);
  const markAllRead    = useChatStore(s => s.markAllRead);
  const clearAll       = useChatStore(s => s.clearNotifications);
  const toggleChat     = useChatStore(s => s.toggleChat);

  const [ringing, setRinging]   = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);
  const prevUnread = useRef(false);

  // Trigger ring animation whenever a new unread arrives
  useEffect(() => {
    if (hasUnread && !prevUnread.current) {
      setRinging(true);
      const t = setTimeout(() => setRinging(false), 1400);
      return () => clearTimeout(t);
    }
    prevUnread.current = hasUnread;
  }, [hasUnread, notifications.length]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = () => {
    if (showPanel) {
      setShowPanel(false);
    } else {
      setShowPanel(true);
      markAllRead();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <style>{`
        @keyframes bell-ring {
          0%   { transform: rotate(0deg); }
          10%  { transform: rotate(18deg); }
          20%  { transform: rotate(-16deg); }
          30%  { transform: rotate(14deg); }
          40%  { transform: rotate(-12deg); }
          50%  { transform: rotate(8deg); }
          60%  { transform: rotate(-6deg); }
          70%  { transform: rotate(4deg); }
          80%  { transform: rotate(-2deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes badge-pop {
          0%   { transform: scale(0); }
          60%  { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .bell-ring { animation: bell-ring 0.7s ease-in-out; transform-origin: top center; }
        .badge-pop { animation: badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      <div className="relative" ref={panelRef}>
        {/* Bell button */}
        <button
          onClick={handleBellClick}
          className="relative p-2 text-stone-500 hover:text-stone-200 transition-colors"
          aria-label="Notifications"
        >
          <span className={ringing ? 'bell-ring inline-block' : 'inline-block'}>
            <Bell className="h-5 w-5" />
          </span>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="badge-pop absolute top-1 right-1 min-w-[16px] h-4 bg-[#faf9f7] text-stone-900 text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification panel */}
        {showPanel && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-100 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-50">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-400">Notifications</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {notifications.length === 0 ? 'Nothing yet' : `${notifications.length} alert${notifications.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors">
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => { setShowPanel(false); toggleChat(); }}
                  className="text-[11px] text-stone-500 hover:text-stone-900 font-medium transition-colors border border-stone-200 rounded-full px-3 py-1"
                >
                  Ask AI
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-stone-50">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-stone-400">You're all caught up.</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`px-4 py-3.5 transition-colors ${n.read ? '' : 'bg-stone-50/60'}`}>
                    <p className="text-[13px] text-stone-800 leading-snug">{n.text}</p>
                    <p className="text-[11px] text-stone-400 mt-1.5">
                      {formatRelativeTime(n.ts)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function formatRelativeTime(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}