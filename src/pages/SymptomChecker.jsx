import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Plus, X, Search, AlertCircle, CheckCircle, Info, ShieldAlert, Stethoscope } from 'lucide-react';
import { generateTextWithGemini } from '../api/gemini';
import { generateTextWithCohere } from '../api/cohere';
import { generateTextWithGroq } from '../api/groq';
import { generateTextFallback } from '../api/cascadeRouter';
import { getLocalAdvice } from '../api/medicalAdvisor';
import canonicalSymptoms from '../data/symptoms.json';

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState([]);
  const [input, setInput] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const res = await fetch(`${backendUrl}/health`);
        if (res.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (e) {
        setBackendStatus('offline');
      }
    };
    checkBackend();
  }, []);

  const addSymptom = () => {
    if (input.trim() && !symptoms.includes(input.trim())) {
      setSymptoms([...symptoms, input.trim()]);
      setInput('');
    }
  };

  const removeSymptom = (s) => setSymptoms(symptoms.filter((x) => x !== s));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addSymptom();
  };

  const analyze = async () => {
    if (symptoms.length === 0) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Map colloquial symptoms to exact ML features using AI (Try Groq)
      let canonicalArr = [];
      try {
        const mapPrompt = `You are a medical symptom mapper.
User input: [${symptoms.join(', ')}].
Your task is to correct any spelling mistakes, typos, or colloquial language in the user input, and map them to the EXACT matching terms from this canonical list: ${JSON.stringify(canonicalSymptoms)}.
Return ONLY a valid JSON array of strings from the list.
Example output: ["headache", "fever"]`;
        
        const mappedResponse = await generateTextFallback([
          { name: 'Gemini', fn: generateTextWithGemini, apiKey: import.meta.env.VITE_GEMINI_API_KEY_1 },
          { name: 'Cohere', fn: generateTextWithCohere, apiKey: import.meta.env.VITE_COHERE_API_KEY_1 },
          { name: 'Groq', fn: generateTextWithGroq, apiKey: import.meta.env.VITE_GROQ_API_KEY_1 }
        ], mapPrompt);
        const cleanedMap = mappedResponse.replace(/```json|```/g, '').trim();
        canonicalArr = JSON.parse(cleanedMap);
      } catch (e) {
        console.warn("AI mapping failed, using local matching fallback:", e);
        canonicalArr = symptoms.map(s => {
          const lowerS = s.toLowerCase().trim();
          return canonicalSymptoms.find(cs => cs.toLowerCase() === lowerS) || s;
        });
      }

      // Step 2: LOCAL ML PREDICTION (Crucial - Prediction is ALWAYS done here)
      let mlData;
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const predictionRes = await fetch(`${backendUrl}/api/predict-disease`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptoms: [...new Set([...symptoms, ...canonicalArr])] })
        });
        
        if (!predictionRes.ok) {
          const errData = await predictionRes.json().catch(() => ({}));
          throw new Error(errData.detail || "Backend connection failed or ML model is not loaded.");
        }
        mlData = await predictionRes.json();
      } catch (e) {
        // "Just for now": if the local `.pkl` model isn't loaded in the deployed backend,
        // keep the UI functional by falling back to your existing Groq/Gemini/Cohere cascade.
        console.warn("Local ML prediction failed; using cascade fallback:", e);
        try {
          const fallbackPrompt = `You are a medical symptom classifier.

Given the user's symptoms, output a best-guess disease name and a confidence score.

INPUT:
- Symptoms (normalized): ${JSON.stringify([...new Set([...symptoms, ...canonicalArr])])}
- Recognized symptoms from the ML feature mapping (use this list for recognized_symptoms):
  ${JSON.stringify(canonicalArr)}

OUTPUT RULES:
Return ONLY valid JSON with exactly these keys:
{
  "predicted_disease": "string",
  "confidence": number, 0-100,
  "recognized_symptoms": array of strings (must equal the input recognized symptoms list)
}

No markdown, no extra text.`;

          const fallbackText = await generateTextFallback([
            { name: 'Gemini', fn: generateTextWithGemini, apiKey: import.meta.env.VITE_GEMINI_API_KEY_1 },
            { name: 'Cohere', fn: generateTextWithCohere, apiKey: import.meta.env.VITE_COHERE_API_KEY_1 },
            { name: 'Groq', fn: generateTextWithGroq, apiKey: import.meta.env.VITE_GROQ_API_KEY_1 }
          ], fallbackPrompt);

          const cleaned = fallbackText.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleaned);

          mlData = {
            predicted_disease: parsed?.predicted_disease || 'Unable to classify',
            confidence: Number(parsed?.confidence),
            recognized_symptoms: Array.isArray(parsed?.recognized_symptoms) ? parsed.recognized_symptoms : canonicalArr
          };

          if (!Number.isFinite(mlData.confidence)) mlData.confidence = 0;
          if (!Array.isArray(mlData.recognized_symptoms) || mlData.recognized_symptoms.length === 0) {
            mlData.recognized_symptoms = canonicalArr;
          }
        } catch (fallbackErr) {
          console.error("Cascade fallback failed:", fallbackErr);
          mlData = {
            predicted_disease: 'Unable to connect to analysis service',
            confidence: 0,
            recognized_symptoms: canonicalArr
          };
        }
      }
      
      const { predicted_disease, confidence, recognized_symptoms } = mlData;

      // Step 3: Provide context (Try Groq, then Fallback to Local Advisor)
      let finalResult;
      const localAdvice = getLocalAdvice(predicted_disease);

      try {
        const formatterPrompt = `You are a professional medical assistant.
Patient: ${age ? age + '-year-old ' : ''}${gender || 'person'}.
Symptoms Reported: ${symptoms.join(', ')}.
INITIAL ML DIAGNOSIS: "${predicted_disease}" with ${confidence}% confidence.

CRITICAL INSTRUCTION: 
1. Check if the INITIAL ML DIAGNOSIS is biologically possible for a ${age ? age + '-year-old ' : ''}${gender || 'person'}. (e.g. A male cannot have Hyperemesis gravidarum or pregnancy-related conditions).
2. If the ML diagnosis CONTRADICTS the patient's gender or age, YOU MUST override it with the most logically sound clinical alternative that shares these symptoms for this specific demographic.
3. If the ML diagnosis is biologically possible, use it directly.

Generate a detailed medical analysis in JSON format:
{
  "possible_conditions": [
    {
      "name": "VALIDATED DIAGNOSIS (Use your demographic-corrected override if needed, otherwise use ${predicted_disease})",
      "probability": "High (Confidence: ${confidence}%)",
      "description": "Provide a detailed medical description of the validated diagnosis.",
      "symptoms_match": ${JSON.stringify(recognized_symptoms)}
    }
  ],
  "severity": "Mild/Moderate/Severe based on ${predicted_disease}",
  "recommendation": "Specific medical advice for ${predicted_disease}",
  "immediate_action": true/false (if life-threatening),
  "precautions": ["List 3-4 specific precautions for ${predicted_disease}"],
  "specialist_recommendation": "Which specific specialist should they see for ${predicted_disease}?",
  "do_list": ["3 specific things to do"],
  "dont_list": ["3 specific things to avoid"],
  "questions_to_ask_doctor": ["3 relevant questions about ${predicted_disease}"],
  "disclaimer": "This analysis is anchored by our local ML diagnostic engine."
}
Return ONLY valid JSON.`;

        const response = await generateTextFallback([
          { name: 'Gemini', fn: generateTextWithGemini, apiKey: import.meta.env.VITE_GEMINI_API_KEY_1 },
          { name: 'Cohere', fn: generateTextWithCohere, apiKey: import.meta.env.VITE_COHERE_API_KEY_1 },
          { name: 'Groq', fn: generateTextWithGroq, apiKey: import.meta.env.VITE_GROQ_API_KEY_1 }
        ], formatterPrompt);
        const cleaned = response.replace(/```json|```/g, '').trim();
        finalResult = JSON.parse(cleaned);
      } catch (e) {
        console.warn("AI context generation failed, using Local Medical Advisor fallback:", e);
        // Robust Fallback from our Local Medical Advisor
        finalResult = {
          possible_conditions: [{
            name: predicted_disease,
            probability: `High (${confidence}%)`,
            description: `The local ML engine has identified ${predicted_disease} based on your symptoms.`,
            symptoms_match: recognized_symptoms
          }],
          severity: confidence > 80 ? "Moderate" : "Mild",
          recommendation: "Please consult a primary care physician for a formal evaluation and treatment plan.",
          immediate_action: localAdvice.specialist === "Emergency Medicine Physician",
          precautions: localAdvice.precautions,
          specialist_recommendation: localAdvice.specialist,
          do_list: localAdvice.do_list,
          dont_list: localAdvice.dont_list,
          questions_to_ask_doctor: ["What diagnostic tests are needed?", "Are there lifestyle changes I should make?", "What is the expected recovery timeline?"],
          disclaimer: "Analysis anchored by local ML engine. Offline advisor fallback active."
        };
      }
      
      setResult(finalResult);
    } catch (err) {
      console.error("Symptom Analysis Flow Error:", err);
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const probabilityColor = (prob) => {
    switch (prob) {
      case 'High': return 'bg-red-50 text-red-700 border-red-200';
      case 'Medium': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const severityColor = (sev) => {
    switch (sev) {
      case 'Severe': return 'bg-red-50 border-red-200 text-red-800';
      case 'Moderate': return 'bg-orange-50 border-orange-200 text-orange-800';
      default: return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto py-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-sm font-medium mb-4">
          <Activity className="w-4 h-4" />
          AI Symptom Analysis
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Check Your <span className="text-teal-600">Symptoms</span>
        </h2>
        <p className="text-gray-600">Enter your symptoms and get AI-powered insights about possible conditions</p>
        
        <div className="mt-4 flex justify-center">
          {backendStatus === 'online' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Local ML Engine Online
            </span>
          ) : backendStatus === 'offline' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Local ML Engine Offline - Please Start Backend
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-xs font-medium border border-gray-200">
              <div className="w-2 h-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Checking Engine Status...
            </span>
          )}
        </div>
      </div>

      {/* Input Card */}
      <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-4">
        {/* Age & Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 text-sm"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Symptom Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Add Symptoms</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. headache, fever, cough..."
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 text-sm"
            />
            <button
              onClick={addSymptom}
              className="px-4 py-2 rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        {/* Symptoms Tags */}
        {symptoms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {symptoms.map((s) => (
              <span key={s} className="flex items-center gap-1 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm border border-teal-200">
                {s}
                <button onClick={() => removeSymptom(s)}>
                  <X className="w-3 h-3 hover:text-red-500" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={analyze}
          disabled={symptoms.length === 0 || isAnalyzing}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Analyze Symptoms
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Severity */}
            <div className={`p-4 rounded-2xl border ${severityColor(result.severity)}`}>
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-5 h-5" />
                Severity: {result.severity}
                {result.immediate_action && (
                  <span className="ml-auto text-sm px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                    ⚠️ Seek immediate care
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm">{result.recommendation}</p>
            </div>

            {/* Possible Conditions */}
            {result.possible_conditions?.length > 0 && (
              <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Predicted Conditions</h3>
                <div className="space-y-3">
                  {result.possible_conditions.map((c, i) => (
                    <div key={i} className="p-4 rounded-xl bg-teal-50 border border-teal-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-teal-900">{c.name}</p>
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${probabilityColor(c.probability)}`}>
                          {c.probability}
                        </span>
                      </div>
                      <p className="text-sm text-teal-800">{c.description}</p>
                      {c.symptoms_match?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.symptoms_match.map((s, j) => (
                            <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-white text-teal-700 border border-teal-200">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Precautions & Specialist */}
            <div className="grid md:grid-cols-2 gap-4">
              {result.precautions?.length > 0 && (
                <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-blue-600" /> Precautions
                  </h3>
                  <ul className="space-y-2">
                    {result.precautions.map((d, i) => (
                      <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />{d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.specialist_recommendation && (
                <div className="p-6 rounded-2xl bg-purple-50 border border-purple-100">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-purple-600" /> Specialist Recommendation
                  </h3>
                  <p className="text-sm text-purple-800">{result.specialist_recommendation}</p>
                </div>
              )}
            </div>

            {/* Do's and Don'ts */}
            <div className="grid md:grid-cols-2 gap-4">
              {result.do_list?.length > 0 && (
                <div className="p-6 rounded-2xl bg-green-50 border border-green-100">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> What To Do
                  </h3>
                  <ul className="space-y-2">
                    {result.do_list.map((d, i) => (
                      <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />{d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.dont_list?.length > 0 && (
                <div className="p-6 rounded-2xl bg-red-50 border border-red-100">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <X className="w-5 h-5" /> What To Avoid
                  </h3>
                  <ul className="space-y-2">
                    {result.dont_list.map((d, i) => (
                      <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />{d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Questions for Doctor */}
            {result.questions_to_ask_doctor?.length > 0 && (
              <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-teal-500" /> Questions to Ask Your Doctor
                </h3>
                <ul className="space-y-2">
                  {result.questions_to_ask_doctor.map((q, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />{q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
              ⚠️ {result.disclaimer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}