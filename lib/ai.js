// Otomatis pakai Ollama jika OLLAMA_URL ada, fallback ke HuggingFace
export async function callAI({ messages, maxTokens = 2048, temperature = 0.2 }) {
  const ollamaUrl = process.env.OLLAMA_URL;
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';
  const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_TOKEN;

  if (ollamaUrl) {
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
      throw new Error(`Ollama error: ${res.status} ${txt}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  // Fallback: HuggingFace router
  if (!hfToken) throw new Error('Tidak ada AI provider yang dikonfigurasi (OLLAMA_URL atau HF_TOKEN)');
  const res = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${hfToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HuggingFace error: ${res.status} ${txt}`);
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
