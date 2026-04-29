
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429 && i < retries - 1) {
      console.warn(`Groq API rate limit hit (429). Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
      continue;
    }
    return response;
  }
}

export async function generateTextWithGroq(prompt, apiKey) {
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY for this component");
  }

  const payload = {
    model: "llama-3.3-70b-versatile", // Fast and highly capable
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.1,
    max_tokens: 2048,
  };

  const response = await fetchWithRetry("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Groq API Error:", JSON.stringify(errorData));
    throw new Error(`Groq API error: ${errorData.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content || "";
}

export async function analyzeImageWithGroq(prompt, imageBase64, mimeType = "image/jpeg", apiKey) {
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY for this component");
  }

  const payload = {
    model: "llama-3.2-90b-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 8192,
  };

  const response = await fetchWithRetry("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Groq API Error:", JSON.stringify(errorData));
    throw new Error(`Groq API error: ${errorData.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content || "";
}

export async function compareReportsWithGroq(pastAnalysisText, currentImageBase64, mimeType = "image/jpeg", apiKey) {
  const prompt = `You are a medical analysis expert evaluating progress over time. 
I will provide you with the text summary of a past medical document, and the image of a new/current medical document (like a lab report or a radiology scan such as an X-Ray/MRI).
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

Now look at the newly provided image and return ONLY valid JSON matching the structure perfectly. Do not include extra text.`;

  return analyzeImageWithGroq(prompt, currentImageBase64, mimeType, apiKey);
}
