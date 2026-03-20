/* ─────────────────────────────────────────
   src/utils/groq.js
   Groq API helper — chat completions
───────────────────────────────────────── */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Put your Groq API key in .env as VITE_GROQ_API_KEY
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

/**
 * Send a message array to Groq and get a response string back.
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} model  — default: llama3-8b-8192 (fast, free tier)
 * @returns {Promise<string>}
 */
export async function groqChat(messages, model = 'llama-3.1-8b-instant') {
  // Remove any message missing or with empty content
  const clean = messages.filter(m => m.content && m.content.trim() !== '');

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: clean,
      temperature: 0.7,
      max_tokens: 512,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}