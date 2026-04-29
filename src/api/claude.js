const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function callClaude(prompt, imageBase64 = null) {
  const content = imageBase64
    ? [
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
          },
        },
        { type: "text", text: prompt },
      ]
    : prompt;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("API Error:", JSON.stringify(errorData));
    throw new Error(`API error: ${errorData.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}