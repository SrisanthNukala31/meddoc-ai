import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Scan, AlertTriangle, CheckCircle, XCircle,
  Activity, Info, Printer, RotateCcw, ZoomIn, ZoomOut,
  ChevronDown, ChevronUp, ShieldAlert, Stethoscope
} from 'lucide-react';

const API_BASE = '/xray-api';

// ── Severity mappings ────────────────────────────────────────
const SEVERITY_STYLES = {
  severe:   { bg: 'bg-red-950/60',    border: 'border-red-500',    text: 'text-red-300',    badge: 'bg-red-500/20 text-red-300',    bar: 'bg-red-500'   },
  moderate: { bg: 'bg-amber-950/60',  border: 'border-amber-500',  text: 'text-amber-300',  badge: 'bg-amber-500/20 text-amber-300', bar: 'bg-amber-500' },
  mild:     { bg: 'bg-emerald-950/60',border: 'border-emerald-500',text: 'text-emerald-300',badge: 'bg-emerald-500/20 text-emerald-300', bar: 'bg-emerald-500'},
  normal:   { bg: 'bg-sky-950/60',    border: 'border-sky-500',    text: 'text-sky-300',    badge: 'bg-sky-500/20 text-sky-300',    bar: 'bg-sky-500'   },
};

function getSeverityStyle(severity) {
  return SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.normal;
}

// ── Sub-components ───────────────────────────────────────────

function ConfidenceBar({ value, severity }) {
  const s = getSeverityStyle(severity);
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${s.bar}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

function FindingCard({ finding, index }) {
  const [open, setOpen] = useState(false);
  const s = getSeverityStyle(finding.severity);
  const pct = Math.round(finding.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`rounded-xl border ${s.bg} ${s.border} p-4 cursor-pointer select-none`}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${s.badge}`}>
            {finding.severity?.toUpperCase()}
          </span>
          <span className={`font-semibold truncate ${s.text}`}>{finding.label}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-mono text-white/70">{pct}%</span>
          {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
        </div>
      </div>
      <div className="mt-2">
        <ConfidenceBar value={finding.confidence} severity={finding.severity} />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              {finding.description || finding.location || '—'}
            </p>
            {finding.methods_agreed && (
              <p className="mt-1 text-xs text-white/40">
                Detected by {finding.methods_agreed} independent method{finding.methods_agreed > 1 ? 's' : ''}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function QualityBadge({ quality }) {
  const style = quality === 'good'
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-700'
    : quality === 'fair'
    ? 'bg-amber-500/20 text-amber-300 border-amber-700'
    : 'bg-red-500/20 text-red-300 border-red-700';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${style}`}>
      Image quality: {quality}
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────

export default function XrayAnalyzer() {
  const [isDragging,   setIsDragging]   = useState(false);
  const [isAnalyzing,  setIsAnalyzing]  = useState(false);
  const [preview,      setPreview]      = useState(null);   // original image src
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState(null);
  const [imageZoom,    setImageZoom]    = useState(false);  // show annotated vs original
  const [showAnnot,    setShowAnnot]    = useState(true);

  const fileRef = useRef(null);

  const reset = () => {
    setPreview(null); setResult(null); setError(null); setIsAnalyzing(false);
    setShowAnnot(true); setImageZoom(false);
  };

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, BMP, etc.)');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);

    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const form = new FormData();
      form.append('file', file);

      const res  = await fetch(`${API_BASE}/analyze-xray`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
        setError('Cannot reach the analysis server. Make sure the Python backend is running: cd backend && python main.py');
      } else {
        setError(e.message);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const onDrop = useCallback(e => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const onDragOver = e  => { e.preventDefault(); setIsDragging(true);  };
  const onDragLeave = () => setIsDragging(false);

  // ── Flatten findings for display ────────────────────────
  const allFindings = result
    ? [
        ...(result.findings?.fractures       ?? []),
        ...(result.findings?.dislocations    ?? []),
        ...(result.findings?.bone_wear       ?? []),
        ...(result.findings?.chest_pathology ?? []),
      ]
    : [];

  const hasSevere = allFindings.some(f => f.severity === 'severe');

  // ── Loading pulses ───────────────────────────────────────
  const steps = [
    'Enhancing contrast (CLAHE)…',
    'Detecting body part via image heuristics…',
    'Running cortical-interruption analysis…',
    'Running texture-entropy analysis…',
    'Running gradient-magnitude analysis…',
    'Computing consensus findings…',
    'Checking chest pathologies (torchxrayvision)…',
    'Generating clinical report…',
  ];
  const [stepIdx, setStepIdx] = useState(0);

  // Cycle through loading step labels while analyzing
  const intervalRef = useRef(null);
  if (isAnalyzing && !intervalRef.current) {
    intervalRef.current = setInterval(() => setStepIdx(i => (i + 1) % steps.length), 1200);
  }
  if (!isAnalyzing && intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-sans">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-[#0c1535]/80 to-[#0a0f1e]/80 border-b border-white/[0.06] px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">X-Ray Analyzer</h1>
              <p className="text-xs text-white/40">Local ML Pipeline · No external APIs · Consensus detection</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-white/30 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            AI-assisted screening — not a clinical diagnosis
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ── Upload zone (shown when no file yet or reset) ── */}
        {!preview && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer p-14 text-center
              ${isDragging
                ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_40px_-10px_rgba(34,211,238,0.4)]'
                : 'border-white/20 bg-white/[0.025] hover:border-white/40 hover:bg-white/[0.04]'}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => processFile(e.target.files[0])}
            />
            <motion.div
              animate={isDragging ? { scale: 1.12 } : { scale: 1 }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center"
            >
              <Upload className="w-9 h-9 text-cyan-400" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">
              {isDragging ? 'Drop the X-ray here' : 'Upload X-Ray Image'}
            </h2>
            <p className="text-white/40 text-sm mb-6">
              Drag &amp; drop or click to browse · JPG, PNG, BMP, WEBP supported
            </p>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 rounded-full text-sm font-semibold shadow-lg hover:opacity-90 transition">
              <Scan className="w-4 h-4" />
              Choose File
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-white/30">
              {['Fracture Detection', 'Dislocation Analysis', 'Body Part ID', 'Chest Pathology', 'No Cloud API'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-cyan-500" /> {t}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Loading state ── */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-6"
            >
              {/* Spinner */}
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
                <div className="absolute inset-3 rounded-full border-t-2 border-blue-500 animate-spin"
                     style={{ animationDirection: 'reverse', animationDuration: '0.7s' }} />
                <Scan className="absolute inset-0 m-auto w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold mb-1">Analyzing X-Ray…</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stepIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="text-sm text-white/40"
                  >
                    {steps[stepIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>
              {preview && (
                <img src={preview} alt="preview" className="mt-4 max-h-40 rounded-xl opacity-30 blur-sm" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-red-950/60 border border-red-500/50 rounded-2xl p-6 flex gap-4 items-start mt-4"
            >
              <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-300 mb-1">Analysis Failed</p>
                <p className="text-sm text-red-400/80">{error}</p>
              </div>
              <button onClick={reset} className="text-xs text-white/40 hover:text-white transition">
                Reset
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        <AnimatePresence>
          {result && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Urgent Banner */}
              {(hasSevere || result.clinical_report?.urgent) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-900/40 border border-red-500 rounded-2xl p-5 flex gap-4 items-center"
                >
                  <AlertTriangle className="w-8 h-8 text-red-400 shrink-0 animate-pulse" />
                  <div>
                    <p className="font-bold text-red-300 text-lg">Urgent Findings Detected</p>
                    <p className="text-red-400/80 text-sm mt-0.5">
                      Severe abnormalities detected. Please seek immediate medical evaluation.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Row: image + body part card */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Image Panel */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <span className="text-sm font-medium text-white/70">X-Ray Image</span>
                    <div className="flex items-center gap-2">
                      {result.annotated_image && (
                        <button
                          onClick={() => setShowAnnot(a => !a)}
                          className="text-xs text-white/40 hover:text-white transition bg-white/5 px-3 py-1 rounded-full"
                        >
                          {showAnnot ? 'View Original' : 'View Annotated'}
                        </button>
                      )}
                      {result.image_quality && (
                        <QualityBadge quality={result.image_quality.quality} />
                      )}
                    </div>
                  </div>
                  <div className={`relative ${imageZoom ? 'max-h-[600px]' : 'max-h-80'} overflow-hidden transition-all duration-300`}>
                    <img
                      src={showAnnot && result.annotated_image ? result.annotated_image : preview}
                      alt="X-Ray"
                      className="w-full h-full object-contain bg-black/60 cursor-zoom-in"
                      onClick={() => setImageZoom(z => !z)}
                    />
                    <button
                      onClick={() => setImageZoom(z => !z)}
                      className="absolute bottom-3 right-3 bg-black/60 rounded-full p-1.5 text-white/60 hover:text-white transition"
                    >
                      {imageZoom ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Body Part + Stats */}
                <div className="space-y-4">
                  {/* Body part card */}
                  <div className="bg-gradient-to-br from-cyan-950/60 to-blue-950/60 border border-cyan-700/40 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-cyan-400/70 uppercase tracking-widest mb-1">Detected Region</p>
                        <p className="text-3xl font-bold text-white">{result.body_part}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/40 mb-1">Confidence</p>
                        <p className="text-2xl font-bold text-cyan-400">
                          {Math.round((result.body_part_confidence ?? 0) * 100)}%
                        </p>
                      </div>
                    </div>
                    <ConfidenceBar value={result.body_part_confidence ?? 0} severity="normal" />
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total Findings', value: allFindings.length, color: 'text-white' },
                      { label: 'Severe',   value: allFindings.filter(f => f.severity === 'severe').length,   color: 'text-red-400'    },
                      { label: 'Moderate', value: allFindings.filter(f => f.severity === 'moderate').length, color: 'text-amber-400'  },
                    ].map(s => (
                      <div key={s.label} className="bg-white/[0.04] border border-white/10 rounded-xl p-4 text-center">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Risk factors */}
                  {result.risk_factors?.length > 0 && (
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                      <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Common Risk Factors</p>
                      <ul className="space-y-1">
                        {result.risk_factors.map((rf, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" /> {rf}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Findings list */}
              {allFindings.length > 0 ? (
                <div>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Detected Findings
                    <span className="text-sm font-normal text-white/40 ml-1">({allFindings.length})</span>
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {allFindings.map((f, i) => (
                      <FindingCard key={i} finding={f} index={i} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-6 flex gap-4 items-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-emerald-300 text-lg">No Abnormalities Detected</p>
                    <p className="text-emerald-400/70 text-sm mt-0.5">
                      The analysis found no significant radiological findings. Always confirm with a physician.
                    </p>
                  </div>
                </div>
              )}

              {/* Clinical Summary + Recommendations */}
              {result.clinical_report && (
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Stethoscope className="w-5 h-5 text-cyan-400" />
                      <h3 className="font-semibold">Clinical Summary</h3>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {result.clinical_report.summary}
                    </p>
                  </div>

                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-semibold">Recommendations</h3>
                    </div>
                    <ul className="space-y-2">
                      {result.clinical_report.recommendations?.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                          <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-emerald-400 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-amber-950/30 border border-amber-700/30 rounded-2xl p-4 flex gap-3 items-start">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/70 leading-relaxed">{result.disclaimer}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={reset}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm transition"
                >
                  <RotateCcw className="w-4 h-4" /> Analyze Another
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm transition"
                >
                  <Printer className="w-4 h-4" /> Print Report
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
