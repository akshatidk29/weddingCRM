/* src/components/chat/ChatBot.jsx */
import { useEffect, useRef, useState } from 'react';
import { X, Send, Trash2 } from 'lucide-react';
import useChatStore from '../../stores/chatStore';
import useAuthStore from '../../stores/authStore';
import { groqChat } from '../../utils/groq';
import api from '../../utils/api';

/* ── Aayojan chat icon SVG ── */
function AayojanIcon({ size = 26, stroke = '#f0ede8', dot = '#c9a96e' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M5 6C5 4.895 5.895 4 7 4H21C22.105 4 23 4.895 23 6V17C23 18.105 22.105 19 21 19H16.5L14 23L11.5 19H7C5.895 19 5 18.105 5 17V6Z"
        stroke={stroke} strokeWidth="1.4" strokeLinejoin="round"
      />
      <path
        d="M9.5 10 L9.5 15 M9.5 15 L13 15"
        stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="17" cy="11" r="1" fill={dot} />
      <circle cx="17" cy="14" r="1" fill={dot} opacity="0.6" />
    </svg>
  );
}

function buildSystemPrompt(user, context) {
  return `You are a concise wedding planning assistant for ${user?.name || 'the user'} at Aayojan.
${context}
Rules: Be concise (max 3 sentences unless detail is asked). Name weddings and tasks specifically. No emojis. No filler phrases. Currency is ₹.`;
}

async function fetchContext() {
  try {
    const [wRes, tRes, lRes] = await Promise.allSettled([
      api.get('/weddings'),
      api.get('/tasks?status=pending&limit=20'),
      api.get('/leads?limit=10'),
    ]);
    const weddings = wRes.status === 'fulfilled' ? (wRes.value.data?.weddings || wRes.value.data || []) : [];
    const tasks    = tRes.status === 'fulfilled' ? (tRes.value.data?.tasks    || tRes.value.data || []) : [];
    const leads    = lRes.status === 'fulfilled' ? (lRes.value.data?.leads    || lRes.value.data || []) : [];

    const wLine = weddings.slice(0, 10).map(w => {
      const d = Math.floor((new Date(w.weddingDate) - Date.now()) / 86400000);
      return `- ${w.name} | ${d >= 0 ? `${d}d away` : 'past'} | ${w.progress || 0}% done | ${w.taskStats?.pending || 0} pending`;
    }).join('\n');

    const tLine = tasks.slice(0, 15).map(t => {
      const overdue = t.dueDate && new Date(t.dueDate) < new Date();
      return `- [${overdue ? 'OVERDUE' : 'pending'}] "${t.title}" → ${t.wedding?.name || '—'} | due: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'none'}`;
    }).join('\n');

    const lLine = leads.slice(0, 8).map(l => `- ${l.name} | ${l.stage}`).join('\n');

    return [
      `Weddings (${weddings.length}):\n${wLine || 'none'}`,
      `Pending tasks (${tasks.length}):\n${tLine || 'none'}`,
      `Leads (${leads.length}):\n${lLine || 'none'}`,
    ].join('\n\n');
  } catch {
    return 'Pipeline data unavailable.';
  }
}

/* ── Message bubble ── */
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2.5`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-lg bg-stone-900 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
          <AayojanIcon size={14} stroke="#f0ede8" dot="#c9a96e" />
        </div>
      )}
      <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
        isUser
          ? 'bg-stone-900 text-[#f0ede8] rounded-tr-sm'
          : 'bg-stone-50 border border-stone-100 text-stone-800 rounded-tl-sm'
      }`}>
        <p>{msg.content}</p>
        <p className="text-[10px] mt-1 opacity-40 text-right">
          {new Date(msg.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start mb-2.5">
      <div className="w-6 h-6 rounded-lg bg-stone-900 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
        <AayojanIcon size={14} stroke="#f0ede8" dot="#c9a96e" />
      </div>
      <div className="bg-stone-50 border border-stone-100 rounded-2xl rounded-tl-sm px-4 py-3">
        <style>{`
          @keyframes db{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-4px);opacity:1}}
          .db{width:5px;height:5px;background:#a8a29e;border-radius:50%;display:inline-block;animation:db 1.1s ease-in-out infinite}
          .db:nth-child(2){animation-delay:.15s}.db:nth-child(3){animation-delay:.3s}
        `}</style>
        <div className="flex items-center gap-1.5"><span className="db"/><span className="db"/><span className="db"/></div>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  'Which weddings are this week?',
  'What tasks are overdue?',
  'Summarise my pipeline',
  'Which leads need follow-up?',
];

export default function ChatBot() {
  const isOpen        = useChatStore(s => s.isOpen);
  const closeChat     = useChatStore(s => s.closeChat);
  const toggleChat    = useChatStore(s => s.toggleChat);
  const messages      = useChatStore(s => s.messages);
  const addMessage    = useChatStore(s => s.addMessage);
  const isLoading     = useChatStore(s => s.isLoading);
  const setLoading    = useChatStore(s => s.setLoading);
  const clearMessages = useChatStore(s => s.clearMessages);
  const hasUnread     = useChatStore(s => s.hasUnread);
  const user          = useAuthStore(s => s.user);

  const [input, setInput]     = useState('');
  const [context, setContext] = useState('');
  const [btnVisible, setBtnVisible] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const lastScroll = useRef(0);

  useEffect(() => {
    if (isOpen && !context) fetchContext().then(setContext);
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Hide FAB on scroll down, show on scroll up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setBtnVisible(y < lastScroll.current || y < 80);
      lastScroll.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || isLoading) return;
    setInput('');
    addMessage('user', content);
    setLoading(true);
    try {
      const history = messages
        .slice(-12)
        .filter(m => m.content?.trim())
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

      const reply = await groqChat([
        { role: 'system', content: buildSystemPrompt(user, context) },
        ...history,
        { role: 'user', content },
      ]);
      addMessage('assistant', reply);
    } catch {
      addMessage('assistant', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap');
        .chat-wrap { font-family: 'Outfit', system-ui, sans-serif; }
        @keyframes fab-in  { from{opacity:0;transform:scale(0.7) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes fab-out { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.7) translateY(8px)} }
        @keyframes panel-in { from{opacity:0;transform:translateY(12px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.6);opacity:0} }
        .fab-enter { animation: fab-in 0.22s cubic-bezier(0.34,1.4,0.64,1) forwards; }
        .fab-exit  { animation: fab-out 0.18s ease-in forwards; }
        .panel-enter { animation: panel-in 0.22s cubic-bezier(0.34,1.2,0.64,1) forwards; }
        .pulse-ring { animation: pulse-ring 1.2s ease-out infinite; }
        .chat-scroll::-webkit-scrollbar { width: 3px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 99px; }
      `}</style>

      {/* ── Floating Action Button ── */}
      <div className={`chat-wrap fixed bottom-6 right-6 z-50 ${btnVisible ? 'fab-enter' : 'fab-exit'}`}
           style={{ display: isOpen ? 'none' : 'block' }}>

        {/* Pulse ring when there are unread notifications */}
        {hasUnread && (
          <div className="absolute inset-0 rounded-2xl bg-stone-900 pulse-ring pointer-events-none" />
        )}

        <button
          onClick={toggleChat}
          className="relative w-14 h-14 bg-stone-900 hover:bg-stone-800 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2), 0 1px 4px rgba(0,0,0,0.1)' }}
          aria-label="Open AI assistant"
        >
          <AayojanIcon size={26} stroke="#f0ede8" dot="#c9a96e" />
          {hasUnread && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#c9a96e] rounded-full border-2 border-[#faf9f7]" />
          )}
        </button>
      </div>

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div className="chat-wrap panel-enter fixed bottom-6 right-6 z-50 w-[360px] sm:w-[390px] flex flex-col overflow-hidden"
             style={{
               height: 'min(560px, calc(100vh - 80px))',
               background: '#ffffff',
               borderRadius: '20px',
               border: '1px solid #e8e3da',
               boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
             }}>

          {/* Header */}
          <div style={{ background: '#1c1917', borderRadius: '20px 20px 0 0' }}
               className="flex items-center justify-between px-5 py-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                   style={{ background: 'rgba(255,255,255,0.08)' }}>
                <AayojanIcon size={22} stroke="#f0ede8" dot="#c9a96e" />
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-tight" style={{ color: '#f0ede8' }}>Aayojan AI</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5a8f72]" style={{ animation: 'pulse 2s infinite' }} />
                  <p className="text-[10px]" style={{ color: 'rgba(240,237,232,0.45)' }}>Online</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button onClick={clearMessages}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'rgba(240,237,232,0.4)' }}
                  onMouseEnter={e => e.currentTarget.style.color='rgba(240,237,232,0.8)'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(240,237,232,0.4)'}
                  title="Clear chat">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={closeChat}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'rgba(240,237,232,0.4)' }}
                onMouseEnter={e => e.currentTarget.style.color='rgba(240,237,232,0.8)'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(240,237,232,0.4)'}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-scroll flex-1 overflow-y-auto px-4 py-4" style={{ background: '#faf9f7' }}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-2">
                <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center mb-4">
                  <AayojanIcon size={24} stroke="#f0ede8" dot="#c9a96e" />
                </div>
                <p className="text-[13px] font-medium text-stone-700 mb-1">Ask me anything</p>
                <p className="text-[11px] text-stone-400 mb-5 leading-relaxed">
                  I know your weddings, tasks, and pipeline.
                </p>
                <div className="flex flex-col gap-2 w-full">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="text-left text-[12px] text-stone-600 bg-white border border-stone-100 hover:border-stone-300 hover:bg-white px-4 py-2.5 rounded-xl transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map(m => <Bubble key={m.id} msg={m} />)}
                {isLoading && <TypingDots />}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 flex-shrink-0" style={{ background: '#ffffff', borderTop: '1px solid #f0ede8' }}>
            <div className="flex items-end gap-2 bg-stone-50 border border-stone-100 rounded-xl px-3.5 py-2.5 focus-within:border-stone-300 transition-colors">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                placeholder="Ask about your weddings..."
                className="flex-1 bg-transparent resize-none border-none focus:outline-none text-[13px] text-stone-800 placeholder-stone-400 leading-relaxed"
                style={{ minHeight: '20px', maxHeight: '96px' }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all mb-0.5"
                style={{
                  background: input.trim() && !isLoading ? '#1c1917' : '#e7e5e4',
                  color: input.trim() && !isLoading ? '#f0ede8' : '#a8a29e',
                }}>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-stone-300 text-center mt-1.5">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  );
}