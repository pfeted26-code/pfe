const OLLAMA_URL = "http://127.0.0.1:11434/v1/chat/completions";

async function callLLM(messages) {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.1:8b",   // ✅ CHANGÉ
      messages,
      temperature: 0.2        // OK avec LLaMA
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama API error: ${res.status} - ${text}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

module.exports = { callLLM };
