export async function callAI({ messages, maxTokens = 2048, temperature = 0.2 }) {
  const ollamaUrl = process.env.OLLAMA_URL;
  const groqKey = process.env.GROQ_API_KEY;

  // Lokal: pakai Ollama jika OLLAMA_URL diset
  if (ollamaUrl) {
    const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
    const res = await fetch(`${ollamaUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: false,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Ollama error: ${res.status} — pastikan Ollama sedang berjalan di Mac kamu`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  // Production: pakai Groq
  if (!groqKey) throw new Error('Tidak ada AI provider yang dikonfigurasi (OLLAMA_URL atau GROQ_API_KEY)');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Groq error: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

// Helper: bersihkan JSON dari markdown fence
export function extractJSON(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  const match = cleaned.match(/\{[\s\S]*\}/);
  return match ? match[0] : cleaned;
}
