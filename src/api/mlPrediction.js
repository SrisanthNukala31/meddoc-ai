const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function predictDisease(symptoms) {
  try {
    console.log(`[ML API] Connecting to ${API_BASE_URL}/api/predict-disease`);
    console.log(`[ML API] Sending symptoms:`, symptoms);
    
    const response = await fetch(`${API_BASE_URL}/api/predict-disease`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symptoms }),
    });

    console.log(`[ML API] Response status:`, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ML API] Error response:`, errorText);
      throw new Error(`API returned status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[ML API] Prediction successful:`, data);
    return data;
  } catch (error) {
    console.error('[ML API] Connection failed:', error.message);
    console.warn('[ML API] Using fallback response');
    // Fallback to a basic analysis if API is unavailable
    return {
      predicted_disease: 'Unable to connect to analysis service',
      confidence: 0,
      recognized_symptoms: symptoms,
      error: error.message
    };
  }
}