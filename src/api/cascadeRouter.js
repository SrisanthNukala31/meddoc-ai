/**
 * Cascade Router
 * 
 * A highly-available Application load balancer to route LLM requests locally through
 * primary, secondary, and tertiary API providers sequentially.
 */

export async function generateTextFallback(providers, prompt) {
  const errors = [];

  for (let i = 0; i < providers.length; i++) {
    const { name, fn, apiKey } = providers[i];
    try {
      console.log(`[CascadeRouter Text] Attempting provider ${i + 1}/${providers.length}: ${name}`);
      const result = await fn(prompt, apiKey);
      if (result) {
        console.log(`[CascadeRouter Text] Success with provider: ${name}`);
        return result;
      } else {
        throw new Error(`Empty response from ${name}`);
      }
    } catch (error) {
      console.warn(`[CascadeRouter Text] Provider ${name} failed:`, error.message);
      errors.push({ provider: name, error });
      // If this is not the last provider, silently continue to the next
    }
  }

  console.error(`[CascadeRouter Text] All ${providers.length} providers failed.`);
  throw new Error(`All fallback providers failed. Errors: ${errors.map(e => `${e.provider} (${e.error.message})`).join(', ')}`);
}

export async function analyzeImageFallback(providers, prompt, imageBase64, mimeType = "image/jpeg") {
  const errors = [];

  for (let i = 0; i < providers.length; i++) {
    const { name, fn, apiKey } = providers[i];
    try {
      console.log(`[CascadeRouter Image] Attempting provider ${i + 1}/${providers.length}: ${name}`);
      // Note: Some providers might not need mimeType, but we pass it anyway.
      // The provider function wrapper should handle mapping the arguments correctly if needed.
      const result = await fn(prompt, imageBase64, mimeType, apiKey);
      if (result) {
        console.log(`[CascadeRouter Image] Success with provider: ${name}`);
        return result;
      } else {
        throw new Error(`Empty response from ${name}`);
      }
    } catch (error) {
      console.warn(`[CascadeRouter Image] Provider ${name} failed:`, error.message);
      errors.push({ provider: name, error });
      // Continue to the next provider
    }
  }

  console.error(`[CascadeRouter Image] All ${providers.length} providers failed.`);
  throw new Error(`All fallback providers failed. Errors: ${errors.map(e => `${e.provider} (${e.error.message})`).join(', ')}`);
}
