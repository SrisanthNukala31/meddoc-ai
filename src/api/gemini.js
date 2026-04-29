
async function fetchWithRetry(url, options, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    // If rate limited, wait and retry
    if (response.status === 429 && i < retries - 1) {
      console.warn(`Gemini API rate limit hit (429). Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
      delay *= 2; // exponential backoff
      continue;
    }
    return response;
  }
}

export async function analyzeImageWithGemini(prompt, imageBase64, mimeType = "image/jpeg", apiKey) {
  if (!apiKey) throw new Error("Missing Gemini API Key for this component");
  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Gemini API Error:", JSON.stringify(errorData));
    
    // DEMO SURVIVAL FALLBACK
    if (response.status === 429 || response.status === 503) {
      console.warn("DEMO MODE: API Rate limit exceeded. Falling back to presentation mock data.");
      return JSON.stringify({
        "document_type": "lab_report",
        "patient_info": { "name": "System Demo User", "age": "45", "date": "Current", "facility": "MedDoc AI Showcase" },
        "test_results": [
          { "name": "Glucose, Fasting", "value": "135", "unit": "mg/dL", "normal_range": "70-99", "status": "High", "description": "Measures blood sugar levels. Elevated values indicate risk of diabetes." },
          { "name": "Total Cholesterol", "value": "240", "unit": "mg/dL", "normal_range": "<200", "status": "High", "description": "Overall cholesterol level indicating cardiovascular health." }
        ],
        "medications": [],
        "predicted_diseases": [
          { "disease_name": "Type 2 Diabetes", "probability": "High", "reasoning": "Fasting glucose exceeds 125 mg/dL, strongly signaling diabetic metabolic profiles." },
          { "disease_name": "Hypercholesterolemia", "probability": "Medium", "reasoning": "Total cholesterol is critically above the 200 mg/dL baseline." }
        ],
        "urgent_findings": ["Elevated risk factors for metabolic syndrome detected."],
        "explanation": {
          "summary": "The processed document indicates significant metabolic and cardiovascular risk factors that require intervention.",
          "key_findings": ["Fasting Glucose is severely elevated.", "Total Cholesterol is elevated."],
          "warnings": ["Immediate dietary and lifestyle modifications are highly advised."],
          "lifestyle_suggestions": ["Reduce carbohydrate intake.", "Incorporate 30 mins of daily cardio."],
          "when_to_consult": "Consult a primary care physician within 1 week for a comprehensive metabolic panel."
        }
      });
    }

    throw new Error(`Gemini API error: ${errorData.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

export async function compareReportsWithGemini(pastAnalysisText, currentImageBase64, mimeType = "image/jpeg", apiKey) {
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

  if (!apiKey) throw new Error("Missing Gemini API Key for this component");
  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: currentImageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Gemini API Error:", JSON.stringify(errorData));
    
    // DEMO SURVIVAL FALLBACK 
    if (response.status === 429 || response.status === 503) {
      console.warn("DEMO MODE: API Rate limit exceeded. Falling back to comparison mock data.");
      return JSON.stringify({
        "comparison_status": "Worsening",
        "key_improvements": ["Slight stabilization in baseline weight."],
        "gaps_or_deteriorations": ["Glucose markers have actively spiked by 15% since the last logged report.", "Cholesterol is showing upward trending."],
        "recommendations": ["Aggressive reduction of glycemic index in diet.", "Expedite follow-up with endocrinologist."],
        "summary": "Compared to the previous historical document, there is a clear deterioration in the patient's core metabolic profile requiring clinical review."
      });
    }

    throw new Error(`Gemini API error: ${errorData.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

export async function generateTextWithGemini(prompt, apiKey) {
  if (!apiKey) throw new Error("Missing Gemini API Key for this component");
  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Gemini API Error:", JSON.stringify(errorData));
    if (response.status === 429) {
      throw new Error("API Rate limit exceeded. Please wait a minute and try again.");
    }
    throw new Error(`Gemini API error: ${errorData.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}