
async function fetchWithRetry(url, options, retries = 2, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429 && i < retries - 1) {
      console.warn(`Cohere API rate limit hit (429). Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
      continue;
    }
    return response;
  }
}

export async function generateTextWithCohere(prompt, apiKey) {
  if (!apiKey) {
    throw new Error("Missing Cohere API Key for this component");
  }

  const payload = {
    model: "command-r",
    message: prompt,
    temperature: 0.1
  };

  const response = await fetchWithRetry("https://api.cohere.ai/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "application/json"
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Cohere API Error:", JSON.stringify(errorData));
    throw new Error(`Cohere API error: ${errorData.message || response.status}`);
  }

  const data = await response.json();
  return data.text || "";
}
