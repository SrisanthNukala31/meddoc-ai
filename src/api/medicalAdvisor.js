/**
 * Local Medical Advisor - Offline fallback for medical advice
 * Provides precautions, recommendations, and specialist info based on predicted disease.
 */

const CATEGORIES = {
  INFECTION: {
    precautions: ["Wash hands frequently", "Avoid sharing personal items", "Monitor for high fever"],
    do_list: ["Stay hydrated", "Get plenty of rest", "Take prescribed antibiotics if applicable"],
    dont_list: ["Don't stop medication early", "Don't go to public places until fever-free"],
    specialist: "Infectious Disease Specialist"
  },
  CHRONIC: {
    precautions: ["Monitor symptoms daily", "Maintain a healthy diet", "Keep a symptom diary"],
    do_list: ["Follow up with primary care", "Stay active as tolerated", "Manage stress levels"],
    dont_list: ["Don't skip maintenance doses", "Don't ignore new or worsening symptoms"],
    specialist: "Internal Medicine Physician"
  },
  EMERGENCY: {
    precautions: ["Do not wait for symptoms to improve", "Keep emergency contacts ready"],
    do_list: ["Seek immediate medical attention", "Call emergency services if breathing is difficult"],
    dont_list: ["Do not drive yourself to the hospital", "Do not eat or drink until seen by a doctor"],
    specialist: "Emergency Medicine Physician"
  },
  SKIN: {
    precautions: ["Avoid scratching the area", "Keep the area clean and dry"],
    do_list: ["Apply recommended topical treatments", "Use mild, fragrance-free soaps"],
    dont_list: ["Don't use harsh chemicals on the skin", "Don't share towels or clothing"],
    specialist: "Dermatologist"
  },
  RESPIRATORY: {
    precautions: ["Avoid smoke and pollutants", "Use a humidifier if air is dry"],
    do_list: ["Practice deep breathing exercises", "Stay hydrated to thin mucus"],
    dont_list: ["Don't smoke", "Don't ignore persistent shortness of breath"],
    specialist: "Pulmonologist"
  }
};

const DISEASE_MAP = {
  "appendicitis": CATEGORIES.EMERGENCY,
  "heart attack": CATEGORIES.EMERGENCY,
  "stroke": CATEGORIES.EMERGENCY,
  "acute kidney injury": CATEGORIES.EMERGENCY,
  "anaphylaxis": CATEGORIES.EMERGENCY,
  
  "asthma": CATEGORIES.RESPIRATORY,
  "acute bronchitis": CATEGORIES.RESPIRATORY,
  "pneumonia": CATEGORIES.RESPIRATORY,
  "copd": CATEGORIES.RESPIRATORY,
  
  "acne": CATEGORIES.SKIN,
  "eczema": CATEGORIES.SKIN,
  "psoriasis": CATEGORIES.SKIN,
  "athlete's foot": CATEGORIES.SKIN,
  
  "diabetes": CATEGORIES.CHRONIC,
  "hypertension": CATEGORIES.CHRONIC,
  "anemia": CATEGORIES.CHRONIC,
  "arthritis": CATEGORIES.CHRONIC,
  
  "flu": CATEGORIES.INFECTION,
  "covid-19": CATEGORIES.INFECTION,
  "urinary tract infection": CATEGORIES.INFECTION,
  "sinusitis": CATEGORIES.INFECTION
};

export function getLocalAdvice(disease) {
  const d = disease.toLowerCase();
  
  // Try exact match
  if (DISEASE_MAP[d]) return DISEASE_MAP[d];
  
  // Try keyword match
  if (d.includes('cancer') || d.includes('tumor')) return { ...CATEGORIES.CHRONIC, specialist: "Oncologist" };
  if (d.includes('heart') || d.includes('cardiac')) return { ...CATEGORIES.CHRONIC, specialist: "Cardiologist" };
  if (d.includes('infection') || d.includes('virus')) return CATEGORIES.INFECTION;
  if (d.includes('fracture') || d.includes('bone')) return { ...CATEGORIES.CHRONIC, specialist: "Orthopedic Surgeon" };
  if (d.includes('brain') || d.includes('neurological')) return { ...CATEGORIES.CHRONIC, specialist: "Neurologist" };
  if (d.includes('eye') || d.includes('vision')) return { ...CATEGORIES.CHRONIC, specialist: "Ophthalmologist" };
  
  // Default fallback
  return CATEGORIES.CHRONIC;
}
