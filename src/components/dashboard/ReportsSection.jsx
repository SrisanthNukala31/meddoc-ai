import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus, FileText, Trash2, TrendingUp, AlertTriangle,
  Brain, Clock, ChevronDown, ChevronUp, RotateCcw, History
} from 'lucide-react';
import { generateTextWithGemini } from '../../api/gemini';
import { generateTextWithGroq } from '../../api/groq';
import { generateTextWithCohere } from '../../api/cohere';
import { generateTextFallback } from '../../api/cascadeRouter';

export default function ReportsSection({ userId, onUpdate }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    report_type: 'blood-test',
    report_title: '',
    report_date: new Date().toISOString().split('T')[0],
    findings: '',
    doctor_name: '',
    clinic_name: '',
    analysis: '',
  });

  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResult, setCompareResult] = useState(null);
  const [compareError, setCompareError] = useState(null);

  // History state
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(null);

  // Load analyzed lab reports from home.jsx (stored in analysis_history with type='lab')
  const loadReports = async () => {
    try {
      const { data } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'lab')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setReports(data);
      return data;
    } catch (err) {
      console.error('Load reports error:', err);
      return null;
    }
  };

  const loadHistory = async () => {
    try {
      const { data } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'report_trend_comparison')
        .order('created_at', { ascending: false });
      if (data) setHistory(data);
    } catch (err) {
      console.error('Load history error:', err);
    }
  };

  useEffect(() => {
    if (userId) {
      loadReports();
      loadHistory();
    }
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.from('medical_reports').insert({ user_id: userId, ...formData });
      setFormData({
        report_type: 'blood-test', report_title: '',
        report_date: new Date().toISOString().split('T')[0],
        findings: '', doctor_name: '', clinic_name: '', analysis: '',
      });
      setShowForm(false);
      await loadReports();
      onUpdate();
    } catch (err) {
      console.error('Report add error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this analyzed report from history?')) {
      await supabase.from('analysis_history').delete().eq('id', id);
      loadReports();
      onUpdate();
    }
  };

  const handleDeleteHistory = async (id) => {
    if (confirm('Delete this analysis from history?')) {
      await supabase.from('analysis_history').delete().eq('id', id);
      loadHistory();
    }
  };

  const handleCompareReports = async (reportsData = reports) => {
    if (reportsData.length < 2) return;
    setCompareLoading(true);
    setCompareError(null);
    setCompareResult(null);
    try {
      // Use the two most recent analyzed reports for comparison
      const latest = reportsData[0];
      const previous = reportsData[1];

      const formatReport = (r) => {
        const a = r.analysis || {};
        const tests = a.test_results?.map(t => `${t.name}: ${t.value} ${t.unit || ''} (${t.status})`).join(', ') || '';
        const diseases = a.predicted_diseases?.map(d => `${d.disease_name} (${d.probability})`).join(', ') || '';
        return `Date: ${new Date(r.created_at).toLocaleDateString()}
Document Type: ${a.document_type || 'Lab Report'}
Summary: ${r.summary || a.explanation?.summary || ''}
Test Results: ${tests}
Predicted Conditions: ${diseases}
Key Findings: ${a.explanation?.key_findings?.join(', ') || ''}`;
      };

      const prompt = `You are a world-class medical diagnostician comparing two consecutive lab reports from the same patient.

PREVIOUS REPORT:
${formatReport(previous)}

LATEST REPORT:
${formatReport(latest)}

Analyze the progression between the two reports. Return ONLY this exact JSON:
{
  "overall_status": "Improving" or "Worsening" or "Stable",
  "body_condition": "Detailed clinical summary referencing actual values from both reports.",
  "disease_status": "Assessment of disease progression/regression between the two reports.",
  "key_values": ["e.g. Glucose dropped from 150 to 110 mg/dL (Improving)", "e.g. BP went from 120/80 to 135/90 (Worsening)"],
  "precautions": ["precaution 1", "precaution 2"],
  "what_to_avoid": ["avoid 1", "avoid 2"],
  "summary": "One concluding sentence on overall trajectory."
}`;

      const responseText = await generateTextFallback([
        { name: 'Groq', fn: generateTextWithGroq, apiKey: import.meta.env.VITE_GROQ_API_KEY_4 },
        { name: 'Gemini', fn: generateTextWithGemini, apiKey: import.meta.env.VITE_GEMINI_API_KEY_4 },
        { name: 'Cohere', fn: generateTextWithCohere, apiKey: import.meta.env.VITE_COHERE_API_KEY_4 }
      ], prompt);

      const cleaned = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setCompareResult(parsed);

      // Save comparison to history
      try {
        await supabase.from('analysis_history').insert({
          user_id: userId,
          type: 'report_trend_comparison',
          analysis: parsed,
          summary: parsed.summary
        });
        await loadHistory();
      } catch (dbErr) {
        console.warn('Could not save to history:', dbErr);
      }

    } catch (err) {
      console.error(err);
      setCompareError('Failed to analyze report trends. Please try again.');
    } finally {
      setCompareLoading(false);
    }
  };

  const getReportTypeLabel = (type) => {
    const types = {
      'blood-test': '🩸 Blood Test', 'xray': '🔍 X-Ray',
      'ultrasound': '📡 Ultrasound', 'mri': '🧠 MRI',
      'ct-scan': '💾 CT Scan', 'ekg': '❤️ EKG',
      'covid-test': '🦠 COVID Test', 'general': '📋 General',
    };
    return types[type] || type;
  };

  const statusColor = (status) => {
    if (!status) return 'text-gray-600 bg-gray-100';
    if (status.toLowerCase().includes('improv')) return 'text-green-700 bg-green-100';
    if (status.toLowerCase().includes('wors')) return 'text-red-700 bg-red-100';
    return 'text-yellow-700 bg-yellow-100';
  };

  const AnalyticsPanel = ({ result }) => (
    <div className="space-y-3">
      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(result.overall_status)}`}>
          {result.overall_status || 'Analyzed'}
        </span>
        <p className="text-sm text-indigo-800 font-medium">{result.summary}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {/* Body Condition */}
        <div className="md:col-span-2 p-3 bg-white rounded-lg border border-indigo-100">
          <strong className="text-indigo-700 text-xs uppercase tracking-wide">👤 Body Condition</strong>
          <p className="mt-1 text-sm text-gray-700">{result.body_condition || '—'}</p>
        </div>

        {/* Disease Status */}
        <div className="md:col-span-2 p-3 bg-white rounded-lg border border-teal-100">
          <strong className="text-teal-700 text-xs uppercase tracking-wide">🦠 Disease Status & Progress</strong>
          <p className="mt-1 text-sm text-gray-700">{result.disease_status || '—'}</p>
        </div>

        {/* Key Values */}
        <div className="md:col-span-2 p-3 bg-white rounded-lg border border-purple-100">
          <strong className="text-purple-700 text-xs uppercase tracking-wide">📊 Key Value Comparisons</strong>
          <ul className="mt-2 space-y-1">
            {result.key_values?.length > 0
              ? result.key_values.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5 shrink-0">•</span> {item}
                  </li>
                ))
              : <li className="text-sm text-gray-400">No specific numerical changes detected.</li>
            }
          </ul>
        </div>

        {/* Precautions */}
        <div className="p-3 bg-white rounded-lg border border-blue-100">
          <strong className="text-blue-700 text-xs uppercase tracking-wide">🛡️ Precautions</strong>
          <ul className="mt-1 space-y-1">
            {result.precautions?.map((item, i) => (
              <li key={i} className="text-xs text-gray-600">• {item}</li>
            ))}
          </ul>
        </div>

        {/* What to Avoid */}
        <div className="p-3 bg-white rounded-lg border border-orange-100">
          <strong className="text-orange-700 text-xs uppercase tracking-wide">
            <AlertTriangle className="w-3 h-3 inline mr-1" />What to Avoid
          </strong>
          <ul className="mt-1 space-y-1">
            {result.what_to_avoid?.map((item, i) => (
              <li key={i} className="text-xs text-gray-600">• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  // ── Add Report Form ──────────────────────────────────────────
  if (showForm) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Add Medical Report</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select name="report_type" value={formData.report_type} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <option value="blood-test">Blood Test</option>
              <option value="xray">X-Ray</option>
              <option value="ultrasound">Ultrasound</option>
              <option value="mri">MRI</option>
              <option value="ct-scan">CT Scan</option>
              <option value="ekg">EKG</option>
              <option value="covid-test">COVID Test</option>
              <option value="general">General Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Title *</label>
            <input type="text" name="report_title" value={formData.report_title} onChange={handleChange}
              required placeholder="e.g., Complete Blood Count"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
            <input type="date" name="report_date" value={formData.report_date} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
              <input type="text" name="doctor_name" value={formData.doctor_name} onChange={handleChange}
                placeholder="Dr. Smith" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
              <input type="text" name="clinic_name" value={formData.clinic_name} onChange={handleChange}
                placeholder="Clinic Name" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Findings</label>
            <textarea name="findings" value={formData.findings} onChange={handleChange}
              placeholder="Key findings from the report" rows="2"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Analysis / Interpretation</label>
            <textarea name="analysis" value={formData.analysis} onChange={handleChange}
              placeholder="Doctor's analysis or your notes" rows="2"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition">
              {loading ? 'Saving...' : 'Add Report'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-2 rounded-lg transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Main View ────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Medical Reports</h3>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg font-medium text-sm transition">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Minimum 2 reports nudge */}
      {reports.length < 2 && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Add at least <strong>2 reports</strong> to enable AI trend comparison.
          <span className="ml-auto font-semibold">{reports.length}/2</span>
        </div>
      )}

      {/* Compare Button */}
      {reports.length >= 2 && (
        <button
          onClick={() => handleCompareReports()}
          disabled={compareLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm hover:opacity-90 disabled:opacity-60 transition">
          {compareLoading
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing…</>
            : <><Brain className="w-4 h-4" /> Run AI Comparison ({reports.length} reports)</>
          }
        </button>
      )}

      {compareError && <p className="text-red-500 text-sm">{compareError}</p>}

      {/* Latest Analysis Result */}
      {compareResult && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm">
          <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5" /> AI Health Trajectory
          </h4>
          <AnalyticsPanel result={compareResult} />
        </div>
      )}

      {/* Report List */}
      {reports.length > 0 ? (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {reports.map((report, idx) => {
            const a = report.analysis || {};
            const label = idx === 0 ? '🟢 Latest' : idx === 1 ? '🔵 Previous' : `#${idx + 1}`;
            return (
              <div key={report.id}
                className="p-3 rounded-xl border border-gray-100 hover:border-teal-200 bg-gradient-to-r from-gray-50 to-transparent transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-teal-600">{label}</span>
                      <span className="text-xs text-gray-400 capitalize">{a.document_type || 'Lab Report'}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">{report.summary || 'Analyzed Report'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(report.created_at).toLocaleDateString()} · {new Date(report.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </p>
                    {a.test_results && a.test_results.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {a.test_results.slice(0,3).map(t => `${t.name}: ${t.value}`).join(' · ')}
                      </p>
                    )}
                  </div>
                  <button onClick={() => handleDelete(report.id)}
                    className="p-1.5 hover:bg-red-50 rounded transition shrink-0 ml-2">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No reports added yet</p>
        </div>
      )}

      {/* Analysis History */}
      {history.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(h => !h)}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition text-sm font-medium text-gray-700">
            <span className="flex items-center gap-2">
              <History className="w-4 h-4 text-gray-500" />
              Analysis History ({history.length})
            </span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showHistory && (
            <div className="mt-2 space-y-2 max-h-80 overflow-y-auto">
              {history.map((item) => (
                <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  {/* History item header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                    <button
                      onClick={() => setExpandedHistory(expandedHistory === item.id ? null : item.id)}
                      className="flex-1 flex items-center gap-2 text-left">
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-600">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                      {item.analysis?.overall_status && (
                        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(item.analysis.overall_status)}`}>
                          {item.analysis.overall_status}
                        </span>
                      )}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedHistory(expandedHistory === item.id ? null : item.id)}
                        className="p-1 hover:bg-gray-200 rounded transition">
                        {expandedHistory === item.id
                          ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                          : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
                      </button>
                      <button onClick={() => handleDeleteHistory(item.id)}
                        className="p-1 hover:bg-red-50 rounded transition">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded history detail */}
                  {expandedHistory === item.id && item.analysis && (
                    <div className="p-3 bg-indigo-50/50 border-t border-gray-100">
                      <AnalyticsPanel result={item.analysis} />
                    </div>
                  )}

                  {/* Collapsed summary */}
                  {expandedHistory !== item.id && item.analysis?.summary && (
                    <p className="px-3 py-2 text-xs text-gray-600 line-clamp-2">{item.analysis.summary}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
