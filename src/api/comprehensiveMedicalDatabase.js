// Comprehensive Medical Database - All possible abnormalities and diseases
export const MEDICAL_CONDITIONS = {
  // BRAIN CONDITIONS
  brain: {
    tumors: {
      glioblastoma: {
        name: 'Glioblastoma',
        description: 'Highly malignant brain tumor arising from glial cells',
        typical_location: 'Cerebral hemispheres',
        severity: 'critical',
        urgency: 'emergency',
        symptoms: ['headaches', 'seizures', 'neurological deficits', 'personality changes'],
        imaging_findings: ['irregular enhancing mass', 'necrosis', 'edema', 'mass effect'],
        treatment: ['surgical resection', 'radiation therapy', 'chemotherapy'],
        specialist: 'Neuro-oncologist'
      },
      meningioma: {
        name: 'Meningioma',
        description: 'Tumor arising from meninges, usually benign',
        typical_location: 'Convexity of brain',
        severity: 'moderate_to_severe',
        urgency: 'urgent',
        symptoms: ['headaches', 'vision changes', 'seizures'],
        imaging_findings: ['extra-axial mass', 'dural tail', 'hyperostosis'],
        treatment: ['surgical resection', 'radiation'],
        specialist: 'Neurosurgeon'
      },
      pituitary_adenoma: {
        name: 'Pituitary Adenoma',
        description: 'Benign tumor of pituitary gland',
        typical_location: 'Sella turcica',
        severity: 'moderate',
        urgency: 'specialist_referral',
        symptoms: ['hormonal changes', 'vision problems', 'headaches'],
        imaging_findings: ['sellar mass', 'suprasellar extension'],
        treatment: ['medication', 'surgery', 'radiation'],
        specialist: 'Endocrinologist'
      },
      acoustic_neuroma: {
        name: 'Acoustic Neuroma',
        description: 'Benign tumor of cranial nerve VIII',
        typical_location: 'Cerebellopontine angle',
        severity: 'moderate',
        urgency: 'specialist_referral',
        symptoms: ['hearing loss', 'tinnitus', 'balance problems'],
        imaging_findings: ['CPA angle mass', 'internal auditory canal expansion'],
        treatment: ['stereotactic radiosurgery', 'surgical resection'],
        specialist: 'Neuro-otologist'
      },
      metastasis: {
        name: 'Brain Metastasis',
        description: 'Secondary cancer spread to brain',
        typical_location: 'Gray-white matter junction',
        severity: 'critical',
        urgency: 'emergency',
        symptoms: ['neurological deficits', 'headaches', 'seizures'],
        imaging_findings: ['multiple enhancing lesions', 'edema', 'hemorrhage'],
        treatment: ['radiation', 'chemotherapy', 'stereotactic surgery'],
        specialist: 'Neuro-oncologist'
      }
    },
    vascular: {
      stroke: {
        name: 'Ischemic Stroke',
        description: 'Blockage of blood flow to brain tissue',
        typical_location: 'Vascular territories',
        severity: 'critical',
        urgency: 'emergency',
        symptoms: ['sudden weakness', 'speech difficulty', 'vision loss', 'paralysis'],
        imaging_findings: ['diffusion restriction', 'ADC changes', 'vascular territory infarction'],
        treatment: ['thrombolysis', 'thrombectomy', 'rehabilitation'],
        specialist: 'Neurologist'
      },
      hemorrhage: {
        name: 'Intracerebral Hemorrhage',
        description: 'Bleeding within brain tissue',
        typical_location: 'Basal ganglia', 'cerebellum', 'pons',
        severity: 'critical',
        urgency: 'emergency',
        symptoms: ['sudden headache', 'vomiting', 'loss of consciousness', 'neurological deficits'],
        imaging_findings: ['hyperdense collection', 'mass effect', 'edema'],
        treatment: ['blood pressure control', 'surgical evacuation', 'rehabilitation'],
        specialist: 'Neurosurgeon'
      },
      aneurysm: {
        name: 'Cerebral Aneurysm',
        description: 'Weakness in blood vessel wall causing bulge',
        typical_location: 'Circle of Willis',
        severity: 'critical',
        urgency: 'emergency',
        symptoms: ['severe headache', 'vision changes', 'neurological deficits'],
        imaging_findings: ['saccular outpouching', 'enhancement pattern'],
        treatment: ['coiling', 'clipping', 'surgical clipping'],
        specialist: 'Neurosurgeon'
      }
    },
    degenerative: {
      multiple_sclerosis: {
        name: 'Multiple Sclerosis',
        description: 'Autoimmune disease causing demyelination',
        typical_location: 'Periventricular white matter', 'corpus callosum',
        severity: 'moderate',
        urgency: 'specialist_referral',
        symptoms: ['vision problems', 'balance issues', 'numbness', 'fatigue'],
        imaging_findings: ['periventricular lesions', 'corpus callosum involvement', 'black holes'],
        treatment: ['disease-modifying therapy', 'steroids', 'physical therapy'],
        specialist: 'Neurologist'
      },
      alzheimer: {
        name: 'Alzheimer Disease',
        description: 'Progressive neurodegenerative disorder',
        typical_location: 'Temporal lobes', 'hippocampus', 'parietal lobes',
        severity: 'moderate_to_severe',
        urgency: 'specialist_referral',
        symptoms: ['memory loss', 'confusion', 'personality changes', 'language problems'],
        imaging_findings: ['cortical atrophy', 'ventricular enlargement', 'hippocampal volume loss'],
        treatment: ['medication', 'cognitive therapy', 'supportive care'],
        specialist: 'Neurologist'
      },
      parkinsons: {
        name: 'Parkinson Disease',
        description: 'Progressive movement disorder',
        typical_location: 'Substantia nigra', 'basal ganglia',
        severity: 'moderate',
        urgency: 'specialist_referral',
        symptoms: ['tremor', 'rigidity', 'bradykinesia', 'postural instability'],
        imaging_findings: ['nigral degeneration', 'basal ganglia changes'],
        treatment: ['dopamine therapy', 'physical therapy', 'deep brain stimulation'],
        specialist: 'Neurologist'
      }
    },
    inflammatory: {
      encephalitis: {
        name: 'Encephalitis',
        description: 'Inflammation of brain tissue',
        typical_location: 'Diffuse or focal',
        severity: 'severe',
        urgency: 'emergency',
        symptoms: ['fever', 'headache', 'confusion', 'seizures', 'neck stiffness'],
        imaging_findings: ['cortical edema', 'meningeal enhancement', 'diffusion restriction'],
        treatment: ['antibiotics', 'antivirals', 'supportive care'],
        specialist: 'Infectious disease specialist'
      },
      abscess: {
        name: 'Brain Abscess',
        description: 'Collection of pus in brain tissue',
        typical_location: 'Frontal or temporal lobes',
        severity: 'critical',
        urgency: 'emergency',
        symptoms: ['headache', 'fever', 'neurological deficits', 'seizures'],
        imaging_findings: ['ring-enhancing lesion', 'central diffusion restriction', 'edema'],
        treatment: ['antibiotics', 'surgical drainage'],
        specialist: 'Neurosurgeon'
      }
    },
    trauma: {
      contusion: {
        name: 'Cerebral Contusion',
        description: 'Bruising of brain tissue',
        typical_location: 'Cortical surfaces', 'deep structures',
        severity: 'moderate_to_severe',
        urgency: 'urgent',
        symptoms: ['headache', 'confusion', 'loss of consciousness', 'focal deficits'],
        imaging_findings: ['cortical swelling', 'hemorrhage', 'edema'],
        treatment: ['observation', 'medication', 'rehabilitation'],
        specialist: 'Neurosurgeon'
      },
      diffuse_axonal_injury: {
        name: 'Diffuse Axonal Injury',
        description: 'Widespread damage to white matter tracts',
        typical_location: 'Corpus callosum', 'internal capsule',
        severity: 'moderate_to_severe',
        urgency: 'urgent',
        symptoms: ['confusion', 'loss of consciousness', 'motor deficits'],
        imaging_findings: ['white matter abnormalities', 'corpus callosum lesions'],
        treatment: ['supportive care', 'rehabilitation'],
        specialist: 'Neurologist'
      }
    },
    congenital: {
      hydrocephalus: {
        name: 'Hydrocephalus',
        description: 'Accumulation of cerebrospinal fluid',
        typical_location: 'Ventricular system',
        severity: 'moderate_to_severe',
        urgency: 'urgent',
        symptoms: ['headache', 'vision problems', 'cognitive decline', 'gait disturbance'],
        imaging_findings: ['ventricular enlargement', 'CSF flow obstruction'],
        treatment: ['shunt placement', 'endoscopic third ventriculostomy'],
        specialist: 'Neurosurgeon'
      },
      arachnoid_cyst: {
        name: 'Arachnoid Cyst',
        description: 'Benign CSF-filled sac',
        typical_location: 'Posterior fossa', 'suprasellar region',
        severity: 'mild_to_moderate',
        urgency: 'specialist_referral',
        symptoms: ['headache', 'vision problems', 'hydrocephalus symptoms'],
        imaging_findings: ['well-circumscribed cyst', 'CSF signal characteristics'],
        treatment: ['observation', 'surgical resection'],
        specialist: 'Neurosurgeon'
      }
    }
  },
  
  // CHEST CONDITIONS
  chest: {
    lungs: {
      pneumonia: {
        name: 'Pneumonia',
        description: 'Infection of lung tissue',
        typical_location: 'Lobes', 'segments',
        severity: 'moderate_to_severe',
        urgency: 'urgent',
        symptoms: ['cough', 'fever', 'chest pain', 'shortness of breath', 'sputum production'],
        imaging_findings: ['consolidation', 'ground glass opacities', 'air bronchograms'],
        treatment: ['antibiotics', 'oxygen therapy', 'supportive care'],
        specialist: 'Pulmonologist'
      },
      tuberculosis: {
        name: 'Tuberculosis',
        description: 'Bacterial infection causing granulomatous disease',
        typical_location: 'Upper lobes', 'apices',
        severity: 'moderate_to_severe',
        urgency: 'specialist_referral',
        symptoms: ['chronic cough', 'weight loss', 'night sweats', 'hemoptysis'],
        imaging_findings: ['cavitations', 'tree-in-bud opacities', 'fibrotic changes'],
        treatment: ['multiple antibiotics', 'directly observed therapy'],
        specialist: 'Infectious disease specialist'
      },
      copd: {
        name: 'Chronic Obstructive Pulmonary Disease',
        description: 'Progressive lung disease causing airflow limitation',
        typical_location: 'Diffuse lung involvement',
        severity: 'moderate_to_severe',
        urgency: 'specialist_referral',
        symptoms: ['chronic cough', 'dyspnea', 'wheezing', 'chest tightness'],
        imaging_findings: ['hyperinflation', 'bullous disease', 'thickened bronchial walls'],
        treatment: ['bronchodilators', 'steroids', 'pulmonary rehabilitation'],
        specialist: 'Pulmonologist'
      },
      lung_cancer: {
        name: 'Lung Cancer',
        description: 'Malignant tumor of lung tissue',
        typical_location: 'Upper lobes', 'central airways',
        severity: 'critical',
        urgency: 'emergency',
        symptoms: ['persistent cough', 'hemoptysis', 'chest pain', 'weight loss'],
        imaging_findings: ['pulmonary nodule', 'mass effect', 'lymphadenopathy'],
        treatment: ['surgery', 'chemotherapy', 'radiation therapy'],
        specialist: 'Oncologist'
      },
      pulmonary_embolism: {
        name: 'Pulmonary Embolism',
        description: 'Blood clot in pulmonary arteries',
        typical_location: 'Main pulmonary artery', 'segmental branches',
        severity: 'critical',
        urgency: 'emergency',
        symptoms: ['sudden chest pain', 'shortness of breath', 'rapid heart rate', 'syncope'],
        imaging_findings: ['filling defects', 'wedge-shaped opacities', 'pleural effusion'],
        treatment: ['anticoagulation', 'thrombolysis', 'embolectomy'],
        specialist: 'Pulmonologist'
      },
      pleural_effusion: {
        name: 'Pleural Effusion',
        description: 'Fluid accumulation in pleural space',
        typical_location: 'Pleural cavities',
        severity: 'moderate_to_severe',
        urgency: 'urgent',
        symptoms: ['chest pain', 'shortness of breath', 'dry cough'],
        imaging_findings: ['pleural fluid collection', 'lung compression', 'loculated fluid'],
        treatment: ['thoracentesis', 'treatment of underlying cause'],
        specialist: 'Pulmonologist'
      },
      pneumothorax: {
        name: 'Pneumothorax',
        description: 'Air in pleural space causing lung collapse',
        typical_location: 'Pleural space',
        severity: 'moderate_to_severe',
        urgency: 'urgent',
        symptoms: ['sudden chest pain', 'shortness of breath', 'tracheal deviation'],
        imaging_findings: ['visceral pleural line', 'lung edge visualization', 'absent lung markings'],
        treatment: ['chest tube placement', 'observation', 'surgical repair'],
        specialist: 'Thoracic surgeon'
      },
      interstitial_lung_disease: {
        name: 'Interstitial Lung Disease',
        description: 'Scarring of lung tissue',
        typical_location: 'Lower lobes', 'subpleural regions',
        severity: 'moderate_to_severe',
        urgency: 'specialist_referral',
        symptoms: ['progressive dyspnea', 'dry cough', 'fatigue', 'weight loss'],
        imaging_findings: ['reticular opacities', 'honeycombing', 'traction bronchiectasis'],
        treatment: ['anti-fibrotic therapy', 'oxygen therapy', 'lung transplantation'],
        specialist: 'Pulmonologist'
      }
    },
    heart: {
      myocardial_infarction: {
        name: 'Myocardial Infarction',
        description: 'Heart muscle damage due to blood flow blockage',
        typical_location: 'Left anterior descending artery', 'right coronary artery',
        severity: 'critical',
        urgency: 'emergency',
        symptoms: ['chest pain', 'shortness of breath', 'sweating', 'nausea', 'arm pain'],
        imaging_findings: ['wall motion abnormalities', 'perfusion defects', 'coronary calcification'],
        treatment: ['thrombolysis', 'PCI', 'bypass surgery'],
        specialist: 'Cardiologist'
      },
      heart_failure: {
        name: 'Heart Failure',
        description: 'Inability to pump blood effectively',
        typical_location: 'Ventricles', 'atria',
        severity: 'severe',
        urgency: 'urgent',
        symptoms: ['shortness of breath', 'edema', 'fatigue', 'exercise intolerance'],
        imaging_findings: ['cardiomegaly', 'pulmonary edema', 'reduced ejection fraction'],
        treatment: ['diuretics', 'ACE inhibitors', 'beta blockers'],
        specialist: 'Cardiologist'
      },
      cardiomyopathy: {
        name: 'Cardiomyopathy',
        description: 'Disease of heart muscle',
        typical_location: 'Ventricular myocardium',
        severity: 'moderate_to_severe',
        urgency: 'specialist_referral',
        symptoms: ['fatigue', 'shortness of breath', 'palpitations', 'edema'],
        imaging_findings: ['ventricular enlargement', 'wall thickening', 'reduced function'],
        treatment: ['medication', 'device therapy', 'transplant'],
        specialist: 'Cardiologist'
      },
      valvular_disease: {
        name: 'Valvular Heart Disease',
        description: 'Abnormal heart valve function',
        typical_location: ['Mitral valve', 'Aortic valve', 'Tricuspid valve', 'Pulmonic valve'],
        severity: 'moderate_to_severe',
        urgency: 'specialist_referral',
        symptoms: ['shortness of breath', 'chest pain', 'fatigue', 'palpitations', 'edema'],
        imaging_findings: ['valve thickening', 'calcification', 'regurgitation', 'stenosis'],
        treatment: ['medication', 'valve repair', 'valve replacement'],
        specialist: 'Cardiologist'
      },
      pericarditis: {
        name: 'Pericarditis',
        description: 'Inflammation of sac around heart',
        typical_location: 'Pericardial sac',
        severity: 'moderate_to_severe',
        urgency: 'urgent',
        symptoms: ['chest pain', 'fever', 'shortness of breath', 'pericardial friction rub'],
        imaging_findings: ['pericardial effusion', 'pericardial thickening', 'enhancement'],
        treatment: ['anti-inflammatory medication', 'colchicine', 'pericardiocentesis'],
        specialist: 'Cardiologist'
      }
    },
    mediastinum: {
      lymphoma: {
        name: 'Mediastinal Lymphoma',
        description: 'Cancer of lymphatic tissue in mediastinum',
        typical_location: 'Anterior mediastinum', 'middle mediastinum',
        severity: 'critical',
        urgency: 'emergency',
        symptoms: ['chest pain', 'shortness of breath', 'cough', 'weight loss'],
        imaging_findings: ['mediastinal mass', 'lymphadenopathy', 'displacement of structures'],
        treatment: ['chemotherapy', 'radiation therapy'],
        specialist: 'Oncologist'
      },
      thymoma: {
        name: 'Thymoma',
        description: 'Tumor of thymus gland',
        typical_location: 'Anterior superior mediastinum',
        severity: 'moderate_to_severe',
        urgency: 'specialist_referral',
        symptoms: ['chest pain', 'shortness of breath', 'cough', 'myasthenia gravis'],
        imaging_findings: ['anterior mediastinal mass', 'calcification', 'invasion'],
        treatment: ['surgical resection', 'radiation therapy'],
        specialist: 'Thoracic surgeon'
      }
    }
  },
  
  // SPINE CONDITIONS
  spine: {
    degenerative: {
      herniated_disc: {
        name: 'Herniated Disc',
        description: 'Protrusion of intervertebral disc material',
        typical_location: 'Lumbar spine', 'cervical spine',
        severity: 'moderate_to_severe',
        urgency: 'specialist_referral',
        symptoms: ['back pain', 'radiating pain', 'numbness', 'weakness'],
        imaging_findings: ['disc protrusion', 'nerve root compression', 'spinal canal stenosis'],
        treatment: ['physical therapy', 'pain management', 'surgical decompression'],
        specialist: 'Orthopedic surgeon'
      },
      spinal_stenosis: {
        name: 'Spinal Stenosis',
        description: 'Narrowing of spinal canal',
        typical_location: 'Lumbar spine', 'cervical spine',
        severity: 'moderate_to_severe',
        urgency: 'specialist_referral',
        symptoms: ['back pain', 'leg pain', 'numbness', 'difficulty walking'],
        imaging_findings: ['canal narrowing', 'ligamentum flavum hypertrophy', 'facet arthropathy'],
        treatment: ['physical therapy', 'epidural injections', 'surgical decompression'],
        specialist: 'Orthopedic surgeon'
      },
      spondylolisthesis: {
        name: 'Spondylolisthesis',
        description: 'Forward slippage of vertebra',
        typical_location: 'Lumbar spine',
        severity: 'moderate_to_severe',
        urgency: 'specialist_referral',
        symptoms: ['back pain', 'leg pain', 'numbness', 'gait disturbance'],
        imaging_findings: ['vertebral slippage', 'pars fracture', 'spinal instability'],
        treatment: ['physical therapy', 'bracing', 'surgical fusion'],
        specialist: 'Orthopedic surgeon'
      },
      degenerative_disc_disease: {
        name: 'Degenerative Disc Disease',
        description: 'Age-related disc deterioration',
        typical_location: 'Multiple spinal levels',
        severity: 'moderate',
        urgency: 'specialist_referral',
        symptoms: ['chronic back pain', 'stiffness', 'reduced mobility'],
        imaging_findings: ['disc desiccation', 'osteophytes', 'disc height loss'],
        treatment: ['physical therapy', 'pain management', 'lifestyle modification'],
        specialist: 'Orthopedic surgeon'
      }
    },
    traumatic: {
      vertebral_fracture: {
        name: 'Vertebral Fracture',
        description: 'Break in vertebra',
        typical_location: 'Thoracic spine', 'lumbar spine',
        severity: 'moderate_to_severe',
        urgency: 'urgent',
        symptoms: ['back pain', 'neurological deficits', 'limited mobility'],
        imaging_findings: ['vertebral body fracture', 'compression fracture', 'burst fracture'],
        treatment: ['bracing', 'pain management', 'surgical fixation'],
        specialist: 'Orthopedic surgeon'
      },
      spinal_cord_injury: {
        name: 'Spinal Cord Injury',
        description: 'Damage to spinal cord',
        typical_location: 'Cervical spine', 'thoracic spine',
        severity: 'critical',
        urgency: 'emergency',
        symptoms: ['paralysis', 'loss of sensation', 'bowel/bladder dysfunction'],
        imaging_findings: ['cord compression', 'cord edema', 'hemorrhage'],
        treatment: ['steroids', 'surgical decompression', 'rehabilitation'],
        specialist: 'Neurosurgeon'
      }
    },
    tumors: {
      spinal_tumor: {
        name: 'Spinal Tumor',
        description: 'Abnormal growth in spinal column',
        typical_location: 'Intramedullary', 'extramedullary',
        severity: 'critical',
        urgency: 'emergency',
        symptoms: ['back pain', 'neurological deficits', 'pain radiating to limbs'],
        imaging_findings: ['enhancing spinal mass', 'cord compression', 'bone destruction'],
        treatment: ['surgical resection', 'radiation therapy', 'chemotherapy'],
        specialist: 'Neurosurgeon'
      },
      meningioma: {
        name: 'Spinal Meningioma',
        description: 'Tumor of spinal meninges',
        typical_location: 'Intraspinal', 'extradural',
        severity: 'moderate_to_severe',
        urgency: 'specialist_referral',
        symptoms: ['back pain', 'neurological deficits', 'pain radiating to limbs'],
        imaging_findings: ['dural-based mass', 'spinal canal compromise'],
        treatment: ['surgical resection', 'radiation therapy'],
        specialist: 'Neurosurgeon'
      }
    },
    inflammatory: {
      discitis: {
        name: 'Discitis',
        description: 'Inflammation of intervertebral disc',
        typical_location: 'Lumbar spine',
        severity: 'moderate_to_severe',
        urgency: 'urgent',
        symptoms: ['back pain', 'febrile illness', 'limited mobility'],
        imaging_findings: ['disc enhancement', 'paraspinal soft tissue inflammation', 'endplate changes'],
        treatment: ['antibiotics', 'pain management', 'surgical drainage'],
        specialist: 'Infectious disease specialist'
      }
    }
  },
  
  // ABDOMINAL CONDITIONS (for CT/MRI)
  abdomen: {
    liver: {
      cirrhosis: {
        name: 'Liver Cirrhosis',
        description: 'Chronic liver disease causing scarring',
        typical_location: 'Diffuse liver involvement',
        severity: 'severe',
        urgency: 'specialist_referral',
        symptoms: ['fatigue', 'jaundice', 'abdominal swelling', 'bleeding'],
        imaging_findings: ['nodular liver surface', 'caudate lobe hypertrophy', 'portal hypertension signs'],
        treatment: ['medication', 'lifestyle changes', 'liver transplantation'],
        specialist: 'Hepatologist'
      },
      liver_cancer: {
        name: 'Liver Cancer',
        description: 'Malignant tumor of liver',
        typical_location: 'Right lobe', 'left lobe',
        severity: 'critical',
        urgency: 'emergency',
        symptoms: ['weight loss', 'abdominal pain', 'jaundice', 'loss of appetite'],
        imaging_findings: ['liver mass', 'vascular invasion', 'metastases'],
        treatment: ['surgical resection', 'chemotherapy', 'radiation therapy'],
        specialist: 'Oncologist'
      },
      hepatitis: {
        name: 'Hepatitis',
        description: 'Liver inflammation',
        typical_location: 'Diffuse liver involvement',
        severity: 'moderate_to_severe',
        urgency: 'specialist_referral',
        symptoms: ['fatigue', 'jaundice', 'abdominal pain', 'loss of appetite'],
        imaging_findings: ['liver enlargement', 'enhancement patterns', 'fibrosis'],
        treatment: ['antiviral medication', 'supportive care'],
        specialist: 'Hepatologist'
      }
    },
    kidneys: {
      renal_failure: {
        name: 'Renal Failure',
        description: 'Decreased kidney function',
        typical_location: 'Both kidneys',
        severity: 'severe',
        urgency: 'urgent',
        symptoms: ['fatigue', 'swelling', 'shortness of breath', 'confusion'],
        imaging_findings: ['small kidneys', 'cysts', 'obstruction'],
        treatment: ['dialysis', 'medication', 'kidney transplantation'],
        specialist: 'Nephrologist'
      },
      kidney_cancer: {
        name: 'Kidney Cancer',
        description: 'Malignant tumor of kidney',
        typical_location: 'Renal cortex', 'renal pelvis',
        severity: 'critical',
        urgency: 'emergency',
        symptoms: ['blood in urine', 'back pain', 'weight loss', 'fatigue'],
        imaging_findings: ['renal mass', 'vascular invasion', 'lymphadenopathy'],
        treatment: ['surgical removal', 'chemotherapy', 'radiation therapy'],
        specialist: 'Urologist'
      },
      kidney_stones: {
        name: 'Kidney Stones',
        description: 'Hard deposits in kidneys',
        typical_location: 'Renal pelvis', 'calyces',
        severity: 'moderate_to_severe',
        urgency: 'urgent',
        symptoms: ['severe pain', 'blood in urine', 'nausea', 'vomiting'],
        imaging_findings: ['calculi', 'hydronephrosis', 'ureteral obstruction'],
        treatment: ['pain management', 'lithotripsy', 'surgical removal'],
        specialist: 'Urologist'
      }
    },
    spleen: {
      splenomegaly: {
        name: 'Splenomegaly',
        description: 'Enlarged spleen',
        typical_location: 'Spleen',
        severity: 'moderate_to_severe',
        urgency: 'specialist_referral',
        symptoms: ['left upper quadrant pain', 'early satiety', 'anemia', 'infections'],
        imaging_findings: ['splenic enlargement', 'multiple lesions', 'infarcts'],
        treatment: ['treatment of underlying cause', 'spleen removal'],
        specialist: 'Hematologist'
      }
    },
    pancreas: {
      pancreatitis: {
        name: 'Pancreatitis',
        description: 'Inflammation of pancreas',
        typical_location: 'Pancreas',
        severity: 'severe',
        urgency: 'emergency',
        symptoms: ['severe abdominal pain', 'nausea', 'vomiting', 'fever'],
        imaging_findings: ['pancreatic enlargement', 'inflammation', 'fluid collections'],
        treatment: ['supportive care', 'medication', 'surgical intervention'],
        specialist: 'Gastroenterologist'
      },
      pancreatic_cancer: {
        name: 'Pancreatic Cancer',
        description: 'Malignant tumor of pancreas',
        typical_location: 'Head of pancreas', 'body of pancreas',
        severity: 'critical',
        urgency: 'emergency',
        symptoms: ['weight loss', 'abdominal pain', 'jaundice', 'new-onset diabetes'],
        imaging_findings: ['pancreatic mass', 'ductal dilation', 'vascular invasion'],
        treatment: ['surgical resection', 'chemotherapy', 'radiation therapy'],
        specialist: 'Oncologist'
      }
    }
  }
};

// Function to detect conditions based on image characteristics
export function detectMedicalConditions(imageType, findings) {
  const detectedConditions = [];
  const suspectedConditions = [];
  const urgentFindings = [];
  
  // Brain MRI analysis
  if (imageType === 'mri') {
    // Check for tumors
    if (findings.includes('mass') || findings.includes('lesion') || findings.includes('enhancing')) {
      detectedConditions.push(MEDICAL_CONDITIONS.brain.tumors.glioblastoma);
      suspectedConditions.push('Intracranial mass', 'Mass effect');
      urgentFindings.push('CRITICAL: Brain mass detected');
    }
    
    // Check for stroke
    if (findings.includes('infarct') || findings.includes('stroke') || findings.includes('diffusion')) {
      detectedConditions.push(MEDICAL_CONDITIONS.brain.vascular.stroke);
      suspectedConditions.push('Acute stroke', 'Vascular occlusion');
      urgentFindings.push('CRITICAL: Stroke detected');
    }
    
    // Check for hemorrhage
    if (findings.includes('hemorrhage') || findings.includes('bleed')) {
      detectedConditions.push(MEDICAL_CONDITIONS.brain.vascular.hemorrhage);
      suspectedConditions.push('Intracerebral bleeding', 'Hemorrhagic stroke');
      urgentFindings.push('CRITICAL: Brain hemorrhage');
    }
    
    // Check for multiple sclerosis
    if (findings.includes('lesions') && findings.includes('white matter')) {
      detectedConditions.push(MEDICAL_CONDITIONS.brain.degenerative.multiple_sclerosis);
      suspectedConditions.push('Demyelination', 'White matter lesions');
    }
    
    // Check for hydrocephalus
    if (findings.includes('ventricular') || findings.includes('enlarged')) {
      detectedConditions.push(MEDICAL_CONDITIONS.brain.congenital.hydrocephalus);
      suspectedConditions.push('CSF accumulation', 'Ventricular enlargement');
    }
  }
  
  // Chest X-ray analysis
  if (imageType === 'x-ray') {
    // Check for pneumonia
    if (findings.includes('consolidation') || findings.includes('infiltrate')) {
      detectedConditions.push(MEDICAL_CONDITIONS.chest.lungs.pneumonia);
      suspectedConditions.push('Pulmonary infection', 'Lung consolidation');
      urgentFindings.push('URGENT: Pneumonia detected');
    }
    
    // Check for heart failure
    if (findings.includes('cardiomegaly') || findings.includes('enlarged')) {
      detectedConditions.push(MEDICAL_CONDITIONS.chest.heart.heart_failure);
      suspectedConditions.push('Cardiac enlargement', 'Heart failure');
      urgentFindings.push('URGENT: Cardiac enlargement detected');
    }
    
    // Check for pneumothorax
    if (findings.includes('pneumothorax') || findings.includes('collapsed')) {
      detectedConditions.push(MEDICAL_CONDITIONS.chest.lungs.pneumothorax);
      suspectedConditions.push('Lung collapse', 'Air in pleural space');
      urgentFindings.push('URGENT: Pneumothorax detected');
    }
    
    // Check for pleural effusion
    if (findings.includes('effusion') || findings.includes('fluid')) {
      detectedConditions.push(MEDICAL_CONDITIONS.chest.lungs.pleural_effusion);
      suspectedConditions.push('Pleural fluid', 'Lung compression');
      urgentFindings.push('URGENT: Pleural effusion detected');
    }
  }
  
  return {
    detected_conditions: detectedConditions,
    suspected_conditions: suspectedConditions,
    urgent_findings: urgentFindings,
    confidence_level: detectedConditions.length > 0 ? 'abnormal' : 'normal'
  };
}
