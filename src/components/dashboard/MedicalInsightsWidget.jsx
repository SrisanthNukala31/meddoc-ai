import { AlertCircle, Info, AlertTriangle, CheckCircle, Brain } from 'lucide-react';

export default function MedicalInsightsWidget({ insights, onUpdate }) {

  const getInsightIcon = (severity) => {
    switch (severity) {
      case 'alert':   return <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />;
      default:        return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'alert':   return 'border-red-200 bg-red-50';
      case 'warning': return 'border-orange-200 bg-orange-50';
      default:        return 'border-blue-200 bg-blue-50';
    }
  };

  if (!insights || insights.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-500" /> Medical Insights
        </h3>
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No insights yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Analyze a lab report in <strong>Medical Docs</strong> to generate insights automatically.
          </p>
        </div>
      </div>
    );
  }

  // Sort: alerts first, then warnings, then info
  const sorted = [...insights].sort((a, b) => {
    const order = { alert: 0, warning: 1, info: 2 };
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
  });

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-500" /> Medical Insights
        </h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          From your lab reports
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {sorted.map((insight) => (
          <div
            key={insight.id}
            className={`p-3 rounded-xl border-2 ${getSeverityStyle(insight.severity)}`}
          >
            <div className="flex items-start gap-3">
              {getInsightIcon(insight.severity)}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-gray-900 text-sm">{insight.title}</h4>
                  {insight.source_date && (
                    <span className="text-xs text-gray-400 shrink-0">{insight.source_date}</span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{insight.description}</p>
                {insight.recommendations && insight.recommendations.length > 3 && (
                  <div className="mt-2 p-2 bg-white/70 rounded text-xs text-gray-600 border border-black/5">
                    <span className="font-medium">Recommendation: </span>
                    {insight.recommendations}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Insights auto-generated from your last 3 analyzed reports
      </p>
    </div>
  );
}
