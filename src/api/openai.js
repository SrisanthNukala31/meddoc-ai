const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

async function fetchWithRetry(url, options, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429 && i < retries - 1) {
      console.warn(`OpenAI API rate limit hit (429). Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
      continue;
    }
    return response;
  }
}

export async function analyzeRadiologyWithOpenAI(prompt, imageBase64, mimeType = "image/jpeg") {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing VITE_OPENAI_API_KEY in .env file");
  }

  const payload = {
    model: "gpt-4o-mini", // Very fast, high rate limits, has vision capabilities
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 4096,
  };

  const response = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("OpenAI API Error:", JSON.stringify(errorData));
    if (response.status === 429) {
      throw new Error("OpenAI API Rate limit exceeded. Please wait a minute and try again.");
    }
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content || "";
}

export async function compareRadiologyWithOpenAI(pastAnalysisText, currentImageBase64, mimeType = "image/jpeg") {
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

  return analyzeRadiologyWithOpenAI(prompt, currentImageBase64, mimeType);
}

export async function generateTextWithOpenAI(prompt) {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing VITE_OPENAI_API_KEY in .env file");
  }

  const payload = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 2048,
  };

  const response = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("OpenAI API Error:", JSON.stringify(errorData));
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content || "";
}
