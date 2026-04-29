const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

async function fetchWithRetry(url, options, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    // Anthropic uses 429 for rate limits
    if (response.status === 429 && i < retries - 1) {
      console.warn(`Anthropic API rate limit hit (429). Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
      continue;
    }
    return response;
  }
}

export async function analyzeRadiologyWithClaude(prompt, imageBase64, mimeType = "image/jpeg") {
  const payload = {
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  };

  const response = await fetchWithRetry("/anthropic-api/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Anthropic API Error:", JSON.stringify(errorData));
    if (response.status === 429) {
      throw new Error("API Rate limit exceeded. Please wait a minute and try again.");
    }
    throw new Error(`Anthropic API error: ${errorData.error?.message || response.status}`);
  }

  const data = await response.json();
  const textContent = data.content.find(c => c.type === 'text')?.text;
  return textContent || "";
}

export async function compareRadiologyWithClaude(pastAnalysisText, currentImageBase64, mimeType = "image/jpeg") {
  const prompt = `You are an expert radiologist and medical analysis expert evaluating progress over time. 
I will provide you with the text summary of a past radiology/MRI scan, and the image of a new/current radiology document.
Compare the new image to the past findings and output a JSON response evaluating the progress. Use this exact structure:
{
  "comparison_status": "Improving or Worsening or Stable",
  "key_improvements": ["improvement 1", "improvement 2"],
  "gaps_or_deteriorations": ["deterioration 1", "gap 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "summary": "Detailed comparison summary explaining the changes between the two reports."
}

Past Document Analysis text:
${pastAnalysisText}

Now look at the newly provided image and return ONLY valid JSON matching the structure perfectly. Do not include extra text (no markdown formatting if possible, just raw json).`;

  return analyzeRadiologyWithClaude(prompt, currentImageBase64, mimeType);
}

export async function generateTextWithClaude(prompt) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Missing VITE_ANTHROPIC_API_KEY in .env file");
  }

  const payload = {
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  const response = await fetchWithRetry("/anthropic-api/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Anthropic API Error:", JSON.stringify(errorData));
    throw new Error(`Anthropic API error: ${errorData.error?.message || response.status}`);
  }

  const data = await response.json();
  const textContent = data.content.find(c => c.type === 'text')?.text;
  return textContent || "";
}

export async function compareReportsWithClaude(pastAnalysisText, currentImageBase64, mimeType = "image/jpeg") {
  const prompt = `You are a medical analysis expert evaluating progress over time. 
I will provide you with the text summary of a past medical document, and the image of a new/current medical document (like a lab report or prescription).
Compare the new image to the past findings and output a JSON response evaluating the progress. Use this exact structure:
{
  "comparison_status": "Improving or Worsening or Stable",
  "key_improvements": ["improvement 1", "improvement 2"],
  "gaps_or_deteriorations": ["deterioration 1", "gap 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "summary": "Detailed comparison summary explaining the changes between the two reports."
}

Past Document Analysis text:
${pastAnalysisText}

Now look at the newly provided image and return ONLY valid JSON matching the structure perfectly. Do not include extra text (no markdown formatting if possible, just raw json).`;

  return analyzeRadiologyWithClaude(prompt, currentImageBase64, mimeType);
}
