// X-Ray Fracture & Dislocation Detection API
// Connects to Python FastAPI backend

const FRACTURE_API_BASE_URL = 'http://localhost:8000';

// Analyze X-ray image for fractures and dislocations
export async function analyzeXRayForFractures(imageFile) {
  try {
    console.log('Analyzing X-ray for fractures...');
    console.log('API URL:', `${FRACTURE_API_BASE_URL}/analyze-xray`);
    
    const formData = new FormData();
    formData.append('file', imageFile);
    
    console.log('FormData created, sending request...');

    const response = await fetch(`${FRACTURE_API_BASE_URL}/analyze-xray`, {
      method: 'POST',
      body: formData,
    });

    console.log('Response received:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('API response parsed successfully');
    return result;
  } catch (error) {
    console.error('Error analyzing X-ray for fractures:', error);
    throw error;
  }
}

// Test the fracture detection system
export async function testFractureDetection() {
  try {
    const response = await fetch(`${FRACTURE_API_BASE_URL}/test-detection`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error testing fracture detection:', error);
    throw error;
  }
}

// Check API health
export async function checkFractureAPIHealth() {
  try {
    const response = await fetch(`${FRACTURE_API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error checking fracture API health:', error);
    return { status: 'unhealthy', error: error.message };
  }
}
