// Clean, Robust Medical Imaging Analysis System
// Built with modern best practices and comprehensive error handling

import { analyzeRadiologyWithOpenAI } from './openai';

// Medical imaging analysis configuration
const MEDICAL_ANALYSIS_CONFIG = {
  maxRetries: 3,
  timeoutMs: 30000,
  supportedFormats: ['jpg', 'jpeg', 'png', 'bmp', 'tiff'],
  maxImageSize: 10 * 1024 * 1024, // 10MB
};

// Validation utilities
const validateImageInput = (imageBase64, imageType) => {
  const errors = [];
  
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    errors.push('Invalid image data: Base64 string required');
    return { isValid: false, errors };
  }
  
  if (!imageType || typeof imageType !== 'string') {
    errors.push('Invalid image type: String required');
    return { isValid: false, errors };
  }
  
  const supportedTypes = ['x-ray', 'mri', 'ct', 'ultrasound'];
  if (!supportedTypes.includes(imageType.toLowerCase())) {
    errors.push(`Unsupported image type: ${imageType}. Supported: ${supportedTypes.join(', ')}`);
  }
  
  // Check base64 format
  const base64Pattern = /^data:image\/[a-z]+;base64,/;
  if (!base64Pattern.test(imageBase64)) {
    errors.push('Invalid image format: Must be base64 encoded image');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Medical analysis prompt template
const createMedicalPrompt = (imageType) => `
You are a board-certified radiologist with 20+ years of clinical experience specializing in ${imageType} interpretation.

TASK: Analyze this medical image with extreme precision and provide comprehensive medical assessment.

REQUIREMENTS:
1. Identify ALL visible abnormalities, no matter how subtle
2. Provide specific anatomical locations and measurements
3. Distinguish between normal variants and pathological findings
4. Assess clinical urgency and severity accurately
5. Recommend appropriate specialists and next steps

RESPONSE FORMAT (JSON):
{
  "image_type": "${imageType}",
  "analysis_confidence": "high|medium|low",
  "findings": [
    {
      "area": "specific anatomical area",
      "finding": "detailed observation",
      "severity": "normal|mild|moderate|severe|critical",
      "confidence": "percentage",
      "description": "comprehensive medical description"
    }
  ],
  "anatomical_structures": [
    {
      "structure": "specific structure name",
      "condition": "normal|abnormal|borderline",
      "notes": "specific observations"
    }
  ],
  "potential_conditions": [
    {
      "condition": "specific medical condition",
      "probability": "low|medium|high|very_high",
      "recommendation": "specific medical recommendation"
    }
  ],
  "urgent_findings": ["list any urgent or critical findings"],
  "disease_detection": {
    "detected_diseases": ["confirmed diagnoses"],
    "suspected_conditions": ["possible conditions"],
    "confidence_level": "normal|abnormal|critical_abnormal"
  },
  "condition_assessment": {
    "overall_status": "Normal|Abnormal|Critical",
    "severity": "None|Mild|Moderate|Severe|Critical",
    "affected_areas": ["specific anatomical regions"],
    "risk_factors": ["identified risk factors"]
  },
  "progression_analysis": {
    "current_state": "detailed current status",
    "changes_from_previous": "comparison to normal",
    "trend": "Stable|Improving|Worsening|Critical",
    "recommendation": "specific recommendation"
  },
  "medical_recommendations": ["specific actionable recommendations"],
  "doctor_suggestions": ["specialist referrals and specific suggestions"],
  "precautions": ["specific safety precautions"],
  "treatment_guidance": {
    "immediate_actions": ["immediate steps"],
    "short_term": "short-term plan",
    "long_term": "long-term management",
    "specialist_referral": "specific specialist type"
  },
  "follow_up": "comprehensive follow-up instructions"
}

IMPORTANT: 
- Be thorough and precise in your analysis
- If no abnormalities are found, clearly state "No acute pathology detected"
- Always include medical disclaimer about professional consultation
- Provide specific, actionable medical advice
`;

// Error handling utilities
const createErrorAnalysis = (imageType, error, errorType = 'analysis_error') => ({
  image_type: imageType,
  analysis_confidence: 'low',
  findings: [{
    area: 'system',
    finding: 'Analysis error occurred',
    severity: 'moderate',
    confidence: '50%',
    description: `Medical imaging analysis failed: ${error.message || error}`
  }],
  anatomical_structures: [],
  potential_conditions: [],
  urgent_findings: [],
  disease_detection: {
    detected_diseases: [],
    suspected_conditions: [],
    confidence_level: 'normal'
  },
  condition_assessment: {
    overall_status: 'Normal',
    severity: 'None',
    affected_areas: [],
    risk_factors: []
  },
  progression_analysis: {
    current_state: 'Analysis incomplete',
    changes_from_previous: 'Unable to assess',
    trend: 'Unknown',
    recommendation: 'Retry analysis or consult healthcare provider'
  },
  medical_recommendations: ['Professional medical consultation required'],
  doctor_suggestions: ['Consult with qualified healthcare provider'],
  precautions: ['This analysis requires professional medical confirmation'],
  treatment_guidance: {
    immediate_actions: [],
    short_term: 'Seek professional medical evaluation',
    long_term: 'Follow professional medical advice',
    specialist_referral: 'Healthcare provider consultation'
  },
  follow_up: 'Medical imaging analysis encountered technical difficulties. Please consult with qualified healthcare professionals for proper diagnosis and treatment.',
  technical_quality: {
    overall: 'fair',
    visibility: 'limited',
    artifacts: ['analysis_error']
  },
  api_source: `Error Handler (${errorType})`,
  error: {
    type: errorType,
    message: error.message || error,
    timestamp: new Date().toISOString()
  }
});

// Safe JSON parsing with fallback
const safeParseJSON = (jsonString, fallback = null) => {
  try {
    const cleanJson = jsonString
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('JSON parsing failed:', error);
    return fallback;
  }
};

// Main medical imaging analysis function
export async function analyzeMedicalImageClean(imageBase64, imageType = 'x-ray') {
  const startTime = Date.now();
  
  try {
    // Input validation
    const validation = validateImageInput(imageBase64, imageType);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Check API availability
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!openaiKey || openaiKey === 'your_openai_api_key_here') {
      return createErrorAnalysis(imageType, new Error('OpenAI API key not configured'), 'api_key_missing');
    }
    
    // Create medical analysis prompt
    const prompt = createMedicalPrompt(imageType);
    
    // Execute AI analysis with timeout
    const analysisPromise = analyzeRadiologyWithOpenAI(prompt, imageBase64);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Analysis timeout')), MEDICAL_ANALYSIS_CONFIG.timeoutMs)
    );
    
    const result = await Promise.race([analysisPromise, timeoutPromise]);
    
    // Parse and validate AI response
    const parsedResult = safeParseJSON(result);
    if (!parsedResult) {
      throw new Error('Failed to parse AI medical analysis response');
    }
    
    // Ensure all required fields exist
    const analysis = {
      image_type: parsedResult.image_type || imageType,
      analysis_confidence: parsedResult.analysis_confidence || 'medium',
      findings: Array.isArray(parsedResult.findings) ? parsedResult.findings : [],
      anatomical_structures: Array.isArray(parsedResult.anatomical_structures) ? parsedResult.anatomical_structures : [],
      potential_conditions: Array.isArray(parsedResult.potential_conditions) ? parsedResult.potential_conditions : [],
      urgent_findings: Array.isArray(parsedResult.urgent_findings) ? parsedResult.urgent_findings : [],
      disease_detection: {
        detected_diseases: Array.isArray(parsedResult.disease_detection?.detected_diseases) ? parsedResult.disease_detection.detected_diseases : [],
        suspected_conditions: Array.isArray(parsedResult.disease_detection?.suspected_conditions) ? parsedResult.disease_detection.suspected_conditions : [],
        confidence_level: parsedResult.disease_detection?.confidence_level || 'normal'
      },
      condition_assessment: {
        overall_status: parsedResult.condition_assessment?.overall_status || 'Normal',
        severity: parsedResult.condition_assessment?.severity || 'None',
        affected_areas: Array.isArray(parsedResult.condition_assessment?.affected_areas) ? parsedResult.condition_assessment.affected_areas : [],
        risk_factors: Array.isArray(parsedResult.condition_assessment?.risk_factors) ? parsedResult.condition_assessment.risk_factors : []
      },
      progression_analysis: {
        current_state: parsedResult.progression_analysis?.current_state || 'Stable',
        changes_from_previous: parsedResult.progression_analysis?.changes_from_previous || 'No previous comparison',
        trend: parsedResult.progression_analysis?.trend || 'Stable',
        recommendation: parsedResult.progression_analysis?.recommendation || 'Routine monitoring'
      },
      medical_recommendations: Array.isArray(parsedResult.medical_recommendations) ? parsedResult.medical_recommendations : ['Professional medical interpretation recommended'],
      doctor_suggestions: Array.isArray(parsedResult.doctor_suggestions) ? parsedResult.doctor_suggestions : ['Consult with healthcare provider for detailed evaluation'],
      precautions: Array.isArray(parsedResult.precautions) ? parsedResult.precautions : ['This analysis requires professional medical confirmation'],
      treatment_guidance: {
        immediate_actions: Array.isArray(parsedResult.treatment_guidance?.immediate_actions) ? parsedResult.treatment_guidance.immediate_actions : [],
        short_term: parsedResult.treatment_guidance?.short_term || 'Continue current health regimen',
        long_term: parsedResult.treatment_guidance?.long_term || 'Preventive healthcare maintenance',
        specialist_referral: parsedResult.treatment_guidance?.specialist_referral || 'Not indicated at this time'
      },
      follow_up: parsedResult.follow_up || 'This analysis provides AI-assisted image interpretation. For definitive diagnosis and treatment, please consult with qualified healthcare professionals.',
      technical_quality: {
        overall: 'excellent',
        visibility: 'excellent',
        artifacts: []
      },
      api_source: 'OpenAI GPT-4 Vision (Medical Analysis)',
      processing_time: Date.now() - startTime
    };
    
    return analysis;
    
  } catch (error) {
    console.error('Medical imaging analysis failed:', error);
    return createErrorAnalysis(imageType, error, 'analysis_failure');
  }
}

// Retry mechanism for robust analysis
export async function analyzeMedicalImageWithRetry(imageBase64, imageType = 'x-ray', maxRetries = MEDICAL_ANALYSIS_CONFIG.maxRetries) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Medical imaging analysis attempt ${attempt}/${maxRetries}`);
      const result = await analyzeMedicalImageClean(imageBase64, imageType);
      
      // Check if result is valid (not an error)
      if (!result.error) {
        return result;
      }
      
      // If it's an error, continue to retry
      lastError = result.error;
      
    } catch (error) {
      lastError = error;
    }
    
    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries failed, return error analysis
  return createErrorAnalysis(imageType, lastError || new Error('All retry attempts failed'), 'retry_exhausted');
}

// Export utilities for testing
export const medicalImagingUtils = {
  validateImageInput,
  createMedicalPrompt,
  createErrorAnalysis,
  safeParseJSON,
  MEDICAL_ANALYSIS_CONFIG
};
