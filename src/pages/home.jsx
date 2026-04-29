import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, Upload, RotateCcw, AlertCircle, History, ArrowRightLeft, CheckCircle, Activity, Scan } from 'lucide-react';
import { analyzeImageWithGroq, compareReportsWithGroq } from '../api/groq';
import { analyzeImageWithGemini, compareReportsWithGemini } from '../api/gemini';
import { analyzeImageFallback } from '../api/cascadeRouter';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('lab'); // lab, history
  const [history, setHistory] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  
  // Comparison states
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [selectedPastReport, setSelectedPastReport] = useState(null);
  const [currentImageBase64, setCurrentImageBase64] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user || !user.id || user.id === '00000000-0000-0000-0000-000000000000') return;
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'lab')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHistory(data || []);
    } catch (e) {
      console.error('Error fetching history:', e);
      const saved = localStorage.getItem('meddoc_history');
      if (saved) setHistory(JSON.parse(saved));
    }
  };

  const deleteFromHistory = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this analysis from history?')) return;
    try {
      await supabase.from('analysis_history').delete().eq('id', id);
      setHistory(prev => prev.filter(h => h.id !== id));
      if (selectedPastReport?.id === id) setSelectedPastReport(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const saveToHistory = async (newAnalysis, type = 'lab') => {
    const summary = newAnalysis.explanation?.summary || 'Medical Analysis';
    
    if (user) {
      try {
        const { error } = await supabase
          .from('analysis_history')
          .insert([{
            user_id: user.id,
            type: type,
            analysis: newAnalysis,
            summary: summary
          }]);
        if (error) throw error;
        fetchHistory();
      } catch (e) {
        console.error('Error saving to Supabase history:', e);
      }
    }

    // Always keep a local copy for safety
    const entry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: type,
      analysis: newAnalysis,
      summary: summary
    };
    const localHistory = [entry, ...history];
    localStorage.setItem('meddoc_history', JSON.stringify(localHistory.slice(0, 50)));
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
    });

  const handleFile = async (file) => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setComparisonResult(null);

    try {
      const base64 = await toBase64(file);
      setCurrentImageBase64(base64);

      if (selectedPastReport) {
        // Run comparison
        setIsComparing(true);
        const pastText = JSON.stringify(selectedPastReport.analysis);
        let resultString;
        
        // Lab Comparison (Waterfall Fallback)
        resultString = await analyzeImageFallback([
          { name: 'Groq', fn: compareReportsWithGroq, apiKey: import.meta.env.VITE_GROQ_API_KEY_2 },
          { name: 'Gemini', fn: compareReportsWithGemini, apiKey: import.meta.env.VITE_GEMINI_API_KEY_2 }
        ], pastText, base64);
        const cleaned = resultString.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        setComparisonResult(parsed);
      } else {
        // Normal Analysis
        // Lab Analysis (Gemini)
        const prompt = `You are a highly accurate medical diagnostician. Analyze this lab report, prescription, or medical document. Extract EVERY SINGLE input, metric, and finding from the document. Rigorously determine the status of the patient and predict any potential underlying diseases based on these exact markers. Return a JSON response with this exact structure:
{
  "document_type": "lab_report or prescription or other",
  "patient_info": {
    "name": "patient name or Unknown",
    "age": "age or Unknown",
    "date": "date or Unknown",
    "facility": "hospital/lab name or Unknown"
  },
  "test_results": [
    {
      "name": "test name",
      "value": "result value",
      "unit": "unit",
      "normal_range": "normal range",
      "status": "Normal or High or Low or Critical",
      "description": "what this test measures and its clinical significance"
    }
  ],
  "medications": [
    {
      "name": "medicine name",
      "dosage": "dosage",
      "purpose": "what it treats",
      "timing": "when to take"
    }
  ],
  "predicted_diseases": [
    {
      "disease_name": "clinical name of the suspected disease/condition",
      "probability": "High, Medium, or Low",
      "reasoning": "Detailed medical reasoning linking the exact document inputs/metrics to this specific disease."
    }
  ],
  "urgent_findings": ["any critical/urgent finding requiring immediate attention"],
  "explanation": {
    "summary": "comprehensive medical summary of the document",
    "key_findings": ["key finding 1", "key finding 2"],
    "warnings": ["warning if any"],
    "lifestyle_suggestions": ["suggestion 1", "suggestion 2"],
    "when_to_consult": "when to see a doctor"
  }
}

CRITICAL: Return ONLY valid, stringified JSON. Ensure there are absolutely NO unescaped double quotes inside your string values, and DO NOT use newline characters inside strings or it will fail JSON.parse. Do not include markdown blocks or any extra text.`;
        const resultString = await analyzeImageFallback([
          { name: 'Groq', fn: analyzeImageWithGroq, apiKey: import.meta.env.VITE_GROQ_API_KEY_2 },
          { name: 'Gemini', fn: analyzeImageWithGemini, apiKey: import.meta.env.VITE_GEMINI_API_KEY_2 }
        ], prompt, base64);
        const cleaned = resultString.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        setAnalysis(parsed);
        saveToHistory(parsed, 'lab');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setError('Failed to analyze document. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setIsComparing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setComparisonResult(null);
    setError(null);
    setSelectedPastReport(null);
    setCurrentImageBase64(null);
  };

  const renderAnalysis = () => {
    if (comparisonResult) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <ArrowRightLeft className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Comparison Results</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Previous Report</h4>
                <div className="text-sm text-gray-600">
                  {selectedPastReport?.summary || 'No summary available'}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Current Analysis</h4>
                <div className="text-sm text-gray-600">
                  {comparisonResult?.current_analysis?.summary || 'No summary available'}
                </div>
              </div>
            </div>

            {comparisonResult?.progression_summary && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Progression Analysis</h4>
                <p className="text-blue-800 text-sm">{comparisonResult.progression_summary}</p>
              </div>
            )}

            {comparisonResult?.recommendations && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Recommendations</h4>
                <ul className="text-green-800 text-sm space-y-1">
                  {comparisonResult.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    if (!analysis) return null;

    // Lab Report Analysis Display
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <FileSearch className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Analysis Results</h3>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Document Type</h4>
            <p className="text-sm text-gray-600 capitalize">{analysis.document_type}</p>
          </div>

          {analysis.patient_info && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Patient Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div><span className="font-medium">Name:</span> {analysis.patient_info.name}</div>
                <div><span className="font-medium">Age:</span> {analysis.patient_info.age}</div>
                <div><span className="font-medium">Date:</span> {analysis.patient_info.date}</div>
                <div><span className="font-medium">Facility:</span> {analysis.patient_info.facility}</div>
              </div>
            </div>
          )}

          {analysis.test_results && analysis.test_results.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Test Results</h4>
              <div className="space-y-2">
                {analysis.test_results.map((test, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${
                    test.status === 'Critical' ? 'bg-red-50 border-red-200' :
                    test.status === 'High' || test.status === 'Low' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{test.name}</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        test.status === 'Critical' ? 'bg-red-100 text-red-800' :
                        test.status === 'High' || test.status === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>{test.status}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {test.value} {test.unit} (Normal: {test.normal_range})
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{test.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.medications && analysis.medications.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Medications</h4>
              <div className="space-y-2">
                {analysis.medications.map((med, i) => (
                  <div key={i} className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium">{med.name}</div>
                    <div className="text-sm text-gray-600">
                      {med.dosage} - {med.timing}
                    </div>
                    <div className="text-xs text-gray-500">{med.purpose}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.predicted_diseases && analysis.predicted_diseases.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 flex-shrink-0" />
                Predicted Diseases & Conditions
              </h4>
              <div className="space-y-3">
                {analysis.predicted_diseases.map((disease, i) => (
                  <div key={i} className="bg-white p-3 rounded-md border border-purple-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-purple-800">{disease.disease_name}</span>
                      <span className={`text-xs px-2 py-1 rounded font-medium ml-2 ${disease.probability === 'High' ? 'bg-red-100 text-red-700' : disease.probability === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {disease.probability} Probability
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{disease.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.urgent_findings && analysis.urgent_findings.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Urgent Findings</h4>
              <ul className="text-red-800 text-sm space-y-1">
                {analysis.urgent_findings.map((finding, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.explanation && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Summary & Recommendations</h4>
              <p className="text-blue-800 text-sm mb-3">{analysis.explanation.summary}</p>
              
              {analysis.explanation.key_findings && (
                <div className="mb-3">
                  <h5 className="font-medium text-blue-800 mb-1">Key Findings:</h5>
                  <ul className="text-blue-700 text-sm space-y-1">
                    {analysis.explanation.key_findings.map((finding, i) => (
                      <li key={i}>- {finding}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.explanation.warnings && analysis.explanation.warnings.length > 0 && (
                <div className="mb-3">
                  <h5 className="font-medium text-red-800 mb-1">Warnings:</h5>
                  <ul className="text-red-700 text-sm space-y-1">
                    {analysis.explanation.warnings.map((warning, i) => (
                      <li key={i}>- {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.explanation.lifestyle_suggestions && (
                <div className="mb-3">
                  <h5 className="font-medium text-blue-800 mb-1">Lifestyle Suggestions:</h5>
                  <ul className="text-blue-700 text-sm space-y-1">
                    {analysis.explanation.lifestyle_suggestions.map((suggestion, i) => (
                      <li key={i}>- {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.explanation.when_to_consult && (
                <div>
                  <h5 className="font-medium text-blue-800 mb-1">When to Consult:</h5>
                  <p className="text-blue-700 text-sm">{analysis.explanation.when_to_consult}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">MedDoc AI</h1>
          <p className="text-gray-600">Medical Document Analysis System</p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="bg-white rounded-t-xl shadow-lg p-1 flex">
            <button
              onClick={() => { setActiveTab('lab'); resetAnalysis(); }}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                activeTab === 'lab' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileSearch className="w-4 h-4 inline mr-2" />
              Lab Reports
            </button>
            <button
              onClick={() => { setActiveTab('history'); resetAnalysis(); }}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                activeTab === 'history' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <History className="w-4 h-4 inline mr-2" />
              History
            </button>
          </div>

          <div className="bg-white rounded-b-xl shadow-lg">
            {activeTab === 'history' ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Analysis History</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{history.filter(h => h.type === 'lab').length} lab report{history.filter(h=>h.type==='lab').length !== 1 ? 's' : ''} analyzed</p>
                  </div>
                  {history.length > 0 && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">
                      Click a report to compare
                    </span>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <History className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-gray-600">No reports analyzed yet</p>
                    <p className="text-sm mt-1">Go to Lab Reports tab and upload a document to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {history.map((item, idx) => {
                      const a = item.analysis || {};
                      const isSelected = selectedPastReport?.id === item.id;
                      const analyzedAt = item.created_at || item.date;
                      const dateObj = analyzedAt ? new Date(analyzedAt) : null;
                      const dateStr = dateObj ? dateObj.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
                      const timeStr = dateObj ? dateObj.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12: true }) : '';
                      const docType = a.document_type || 'lab_report';
                      const urgentCount = (a.urgent_findings || []).length;
                      const abnormalTests = (a.test_results || []).filter(t => t.status !== 'Normal');
                      const highDiseases = (a.predicted_diseases || []).filter(d => d.probability === 'High');

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          onClick={() => setSelectedPastReport(isSelected ? null : item)}
                          className={`rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm'
                          }`}
                        >
                          {/* Card Header */}
                          <div className="flex items-start justify-between px-4 pt-4 pb-3">
                            <div className="flex items-start gap-3">
                              {/* Index badge */}
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                                idx === 0 ? 'bg-green-100 text-green-700' :
                                idx === 1 ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {idx === 0 ? '🆕' : `#${idx + 1}`}
                              </div>
                              <div className="flex-1 min-w-0">
                                {/* Doc type chip */}
                                <span className="inline-block text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 mb-1">
                                  {docType.replace(/_/g, ' ')}
                                </span>
                                {/* Summary */}
                                <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                                  {item.summary || a.explanation?.summary || 'Medical Analysis'}
                                </p>
                              </div>
                            </div>

                            {/* Delete button */}
                            <button
                              onClick={(e) => deleteFromHistory(item.id, e)}
                              className="ml-2 p-1.5 rounded-lg hover:bg-red-50 transition shrink-0"
                              title="Delete this report"
                            >
                              <svg className="w-4 h-4 text-red-400 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          {/* Date / Time strip */}
                          <div className="flex items-center gap-4 px-4 pb-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              {dateStr}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {timeStr}
                            </span>
                            {a.patient_info?.facility && (
                              <span className="truncate">📍 {a.patient_info.facility}</span>
                            )}
                          </div>

                          {/* Stats row */}
                          <div className="flex gap-2 px-4 pb-3 flex-wrap">
                            {a.test_results?.length > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                🧪 {a.test_results.length} tests
                              </span>
                            )}
                            {abnormalTests.length > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                                ⚠️ {abnormalTests.length} abnormal
                              </span>
                            )}
                            {urgentCount > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                                🚨 {urgentCount} urgent
                              </span>
                            )}
                            {highDiseases.length > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                                🦠 {highDiseases.length} high-risk condition{highDiseases.length > 1 ? 's' : ''}
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500 text-white font-medium ml-auto">
                                ✓ Selected for comparison
                              </span>
                            )}
                          </div>

                          {/* Key test values preview */}
                          {a.test_results?.length > 0 && (
                            <div className="px-4 pb-4">
                              <div className="flex flex-wrap gap-1.5">
                                {a.test_results.slice(0, 4).map((t, i) => (
                                  <span key={i} className={`text-xs px-2 py-1 rounded-lg border font-mono ${
                                    t.status === 'Critical' ? 'bg-red-50 border-red-200 text-red-700' :
                                    t.status === 'High' || t.status === 'Low' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                    'bg-green-50 border-green-200 text-green-700'
                                  }`}>
                                    {t.name}: {t.value} {t.unit || ''}
                                  </span>
                                ))}
                                {a.test_results.length > 4 && (
                                  <span className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-400">
                                    +{a.test_results.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeTab === 'medical' ? (
              /* ── Dedicated X-Ray Analyzer (fully local ML) ── */
              <XrayAnalyzer />
            ) : (
              <div className="p-6">
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragOver
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">
                    {selectedPastReport ? 'Upload New Document for Comparison' : 'Upload Document'}
                  </h3>
                  <p className="text-gray-500 mb-4">Upload lab reports or prescriptions</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFile(e.target.files[0])}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Choose File
                  </button>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="w-5 h-5" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}

                {(isAnalyzing || isComparing) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 text-center"
                  >
                    <div className="inline-flex items-center gap-2 text-blue-600">
                      <Activity className="w-5 h-5 animate-pulse" />
                      <span>{isComparing ? 'Comparing documents...' : 'Analyzing document...'}</span>
                    </div>
                  </motion.div>
                )}

                <AnimatePresence>
                  {(analysis || comparisonResult) && renderAnalysis()}
                </AnimatePresence>

                {(analysis || comparisonResult) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 text-center"
                  >
                    <button
                      onClick={resetAnalysis}
                      className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Analyze Another Document
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
