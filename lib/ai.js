export async function callAI({ messages, maxTokens = 2048, temperature = 0.2 }) {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/v1';
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';

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

// Helper: bersihkan JSON dari markdown fence
export function extractJSON(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  const match = cleaned.match(/\{[\s\S]*\}/);
  return match ? match[0] : cleaned;
}
