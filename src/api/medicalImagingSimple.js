// X-Ray Fracture Detection API Integration
import { analyzeXRayForFractures, testFractureDetection, checkFractureAPIHealth } from './fractureDetection';

// Main X-ray analysis function using YOLOv8 fracture detection
export async function analyzeMedicalImageSimple(imageFile, imageType = 'x-ray') {
  try {
    console.log(`Starting X-ray fracture analysis for ${imageType}...`);
    console.log('Image file details:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    });
    
    // Check if it's an X-ray image
    if (imageType !== 'x-ray') {
      return {
        image_type: imageType,
        analysis_confidence: 'low',
        findings: [{
          area: 'system',
          finding: 'Unsupported image type',
          severity: 'moderate',
          confidence: '50%',
          description: 'This system is optimized for X-ray fracture detection only.'
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
          current_state: 'Analysis unavailable',
          changes_from_previous: 'Unable to assess',
          trend: 'Unknown',
          recommendation: 'Use X-ray images for fracture detection'
        },
        medical_recommendations: ['Upload X-ray images for fracture detection'],
        doctor_suggestions: ['Consult with radiologist for other image types'],
        precautions: ['This system is optimized for X-ray analysis only'],
        treatment_guidance: {
          immediate_actions: [],
          short_term: 'Upload appropriate X-ray image',
          long_term: 'Use specialized systems for other modalities',
          specialist_referral: 'Radiologist consultation'
        },
        follow_up: 'Please upload an X-ray image for fracture detection analysis.',
        technical_quality: {
          overall: 'fair',
          visibility: 'limited',
          artifacts: ['unsupported_type']
        },
        api_source: 'Type Filter'
      };
    }
    
    // Use the fracture detection API
    console.log('Calling fracture detection API...');
    const result = await analyzeXRayForFractures(imageFile);
    console.log('Fracture detection result:', result);
    
    // Convert fracture detection result to medical imaging format
    const analysis = {
      image_type: 'x-ray',
      analysis_confidence: 'high',
      findings: (result.findings || []).map(finding => ({
        area: result.body_part || 'Unknown',
        finding: `${finding.label} detected with ${Math.round(finding.confidence * 100)}% confidence`,
        severity: finding.label === 'Fracture' ? 'severe' : finding.label === 'Dislocation' ? 'moderate' : 'mild',
        confidence: `${Math.round(finding.confidence * 100)}%`,
        description: `AI-detected ${finding.label} in ${result.body_part} at coordinates [${finding.location.join(', ')}]`
      })),
      anatomical_structures: [{
        structure: result.body_part || 'Unknown',
        condition: (result.findings || []).length > 0 ? 'abnormal' : 'normal',
        notes: `Detected ${(result.findings || []).length} abnormalities`
      }],
      potential_conditions: (result.findings || []).map(finding => ({
        condition: finding.label,
        probability: finding.confidence > 0.8 ? 'high' : finding.confidence > 0.5 ? 'medium' : 'low',
        recommendation: `Seek immediate ${finding.label === 'Fracture' ? 'orthopedic' : 'medical'} attention`
      })),
      urgent_findings: (result.findings || []).filter(f => f.confidence > 0.8).map(f => f.label),
      disease_detection: {
        detected_diseases: (result.findings || []).filter(f => f.confidence > 0.7).map(f => f.label),
        suspected_conditions: (result.findings || []).filter(f => f.confidence <= 0.7).map(f => f.label),
        confidence_level: result.confidence_scores?.overall_confidence > 0.8 ? 'critical_abnormal' : 
                         result.confidence_scores?.overall_confidence > 0.5 ? 'abnormal' : 'normal'
      },
      condition_assessment: {
        overall_status: (result.findings || []).length > 0 ? 'Abnormal' : 'Normal',
        severity: (result.findings || []).some(f => f.label === 'Fracture') ? 'Severe' : 
                  (result.findings || []).some(f => f.label === 'Dislocation') ? 'Moderate' : 'None',
        affected_areas: [result.body_part || 'Unknown'],
        risk_factors: (result.findings || []).map(f => f.label)
      },
      progression_analysis: {
        current_state: (result.findings || []).length > 0 ? 'Acute findings detected' : 'No acute pathology',
        changes_from_previous: 'No previous comparison available',
        trend: (result.findings || []).length > 0 ? 'Requires immediate attention' : 'Stable',
        recommendation: result.patient_summary || 'Routine monitoring recommended'
      },
      medical_recommendations: (result.findings || []).length > 0 ? 
        ['Immediate medical evaluation required', 'Orthopedic consultation recommended', 'Avoid weight-bearing on affected area'] :
        ['No acute findings detected', 'Continue routine monitoring', 'Maintain bone health'],
      doctor_suggestions: (result.findings || []).length > 0 ?
        ['Urgent orthopedic consultation', 'Consider specialist referral', 'Follow-up imaging may be needed'] :
        ['Routine follow-up with primary care', 'Annual X-ray if risk factors present'],
      precautions: (result.findings || []).length > 0 ?
        ['Immobilize affected area', 'Avoid strenuous activity', 'Seek immediate medical care'] :
        ['Maintain bone health', 'Prevent falls', 'Regular exercise'],
      treatment_guidance: {
        immediate_actions: (result.findings || []).length > 0 ? ['Immobilization', 'Pain management', 'Medical evaluation'] : [],
        short_term: (result.findings || []).length > 0 ? 'Orthopedic treatment and rehabilitation' : 'Continue normal activities',
        long_term: (result.findings || []).length > 0 ? 'Follow-up care and monitoring' : 'Preventive bone health measures',
        specialist_referral: (result.findings || []).length > 0 ? 'Orthopedic surgeon' : 'Primary care physician'
      },
      follow_up: result.patient_summary || 'No abnormalities detected. Continue routine health monitoring.',
      technical_quality: {
        overall: 'excellent',
        visibility: 'excellent',
        artifacts: []
      },
      api_source: 'YOLOv8 Fracture Detection System',
      annotated_image: result.annotated_image,
      confidence_scores: result.confidence_scores
    };
    
    console.log(`X-ray fracture analysis completed. Found ${result.findings.length} abnormalities.`);
    return analysis;
    
  } catch (error) {
    console.error('X-ray fracture analysis failed:', error);
    
    // Return error analysis
    return {
      image_type: 'x-ray',
      analysis_confidence: 'low',
      findings: [{
        area: 'system',
        finding: 'Analysis failed',
        severity: 'moderate',
        confidence: '50%',
        description: `Fracture detection system error: ${error.message}`
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
        current_state: 'Analysis failed',
        changes_from_previous: 'Unable to assess',
        trend: 'Unknown',
        recommendation: 'Try again or consult healthcare provider'
      },
      medical_recommendations: ['System error occurred', 'Try analysis again', 'Consult healthcare provider'],
      doctor_suggestions: ['Manual radiologist review recommended'],
      precautions: ['System temporarily unavailable'],
      treatment_guidance: {
        immediate_actions: [],
        short_term: 'Retry analysis or seek professional evaluation',
        long_term: 'System maintenance required',
        specialist_referral: 'Radiologist'
      },
      follow_up: 'Fracture detection system encountered an error. Please try again or consult with a healthcare professional.',
      technical_quality: {
        overall: 'poor',
        visibility: 'limited',
        artifacts: ['system_error']
      },
      api_source: 'Error Handler',
      error: {
        type: 'analysis_failure',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Test the fracture detection system
export async function testFractureAnalysis() {
  try {
    const result = await testFractureDetection();
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Check system health
export async function checkSystemHealth() {
  try {
    const health = await checkFractureAPIHealth();
    return health;
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
}
