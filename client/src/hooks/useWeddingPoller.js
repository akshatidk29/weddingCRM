/* ─────────────────────────────────────────
   src/hooks/useWeddingPoller.js
   Polls wedding + task data every 15 minutes.
   Uses Groq to generate a natural-language nudge,
   then pushes it into the notification store.
───────────────────────────────────────── */
import { useEffect, useRef } from 'react';
import api from '../utils/api';
import { groqChat } from '../utils/groq';
import useChatStore from '../stores/chatStore';
import useAuthStore from '../stores/authStore';

const POLL_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

function buildSystemPrompt(user) {
  return `You are a concise wedding planning assistant for ${user?.name || 'the user'} at Aayojan.
Your job is to analyze upcoming weddings and overdue/pending tasks, then write ONE short, helpful notification (max 2 sentences).
Be direct and specific — name the wedding, name the task. Do not start with "Hey" or "Hi". Do not use emojis.
If everything looks fine, respond with exactly: ALL_CLEAR`;
}

async function generateNudge(user, weddings, overdueTasks) {
  if (!overdueTasks.length && !weddings.some(w => {
    const d = Math.floor((new Date(w.weddingDate) - Date.now()) / 86400000);
    return d >= 0 && d <= 7;
  })) {
    return null; // nothing urgent
  }

  const context = [
    overdueTasks.length
      ? `Overdue tasks: ${overdueTasks.slice(0, 5).map(t => `"${t.title}" (${t.wedding?.name || 'unknown wedding'})`).join(', ')}.`
      : '',
    weddings
      .filter(w => {
        const d = Math.floor((new Date(w.weddingDate) - Date.now()) / 86400000);
        return d >= 0 && d <= 7;
      })
      .map(w => {
        const d = Math.floor((new Date(w.weddingDate) - Date.now()) / 86400000);
        return `"${w.name}" is in ${d === 0 ? 'today' : `${d} day${d !== 1 ? 's' : ''}`}, progress: ${w.progress || 0}%.`;
      })
      .join(' '),
  ].filter(Boolean).join(' ');

  if (!context.trim()) return null;

  try {
    const result = await groqChat([
      { role: 'system', content: buildSystemPrompt(user) },
      { role: 'user',   content: context },
    ]);
    if (result === 'ALL_CLEAR' || !result) return null;
    return result;
  } catch (err) {
    console.error('[Poller] Groq error:', err);
    return null;
  }
}

export function useWeddingPoller() {
  const user    = useAuthStore(s => s.user);
  const addNotification = useChatStore(s => s.addNotification);
  const timerRef = useRef(null);

  const poll = async () => {
    if (!user) return;
    try {
      const [wRes, tRes] = await Promise.all([
        api.get('/weddings'),
        api.get('/tasks?status=pending'),
      ]);

      const weddings     = wRes.data?.weddings  || wRes.data  || [];
      const allTasks     = tRes.data?.tasks      || tRes.data  || [];
      const overdueTasks = allTasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < new Date() && !['done','verified','completed'].includes(t.status);
      });

      const nudge = await generateNudge(user, weddings, overdueTasks);
      if (nudge) addNotification(nudge);
    } catch (err) {
      console.error('[Poller] fetch error:', err);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Run immediately on mount, then every 15 min
    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user?._id]);
}