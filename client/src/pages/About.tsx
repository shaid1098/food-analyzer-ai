import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import type { HealthResponse } from '../services/api.js';
import { Activity, ShieldAlert, Cpu, Database, CheckCircle, HelpCircle } from 'lucide-react';

export default function About() {
  const [status, setStatus] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHealth()
      .then(setStatus)
      .catch(err => console.error('Failed to fetch status:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
          <span className="text-gradient">System Architecture</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          FoodVerify AI uses a multimodal confidence-gated pipeline to verify nutritional data and prevent AI hallucinations.
        </p>
      </div>

      {/* System Status Section */}
      <div className="glass-panel p-6 mb-10">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-100">
          <Activity className="text-purple-500 w-5 h-5" /> Live System Status
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-slate-800/50 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-slate-500 font-medium mb-1">GEMINI AI VISION</span>
              {status?.services.gemini === 'connected' ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-sm">
                  <CheckCircle className="w-4 h-4" /> Connected
                </span>
              ) : (
                <span className="text-amber-500 font-semibold flex items-center gap-1.5 text-sm">
                  <ShieldAlert className="w-4 h-4" /> Not Configured
                </span>
              )}
            </div>

            <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-slate-500 font-medium mb-1">INDEPENDENT VERIFIER</span>
              {status?.services.verification === 'connected' ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-sm">
                  <CheckCircle className="w-4 h-4" /> Connected
                </span>
              ) : (
                <span className="text-slate-400 font-semibold flex items-center gap-1.5 text-sm">
                  <HelpCircle className="w-4 h-4" /> Unavailable
                </span>
              )}
            </div>

            <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-slate-500 font-medium mb-1">NUTRITION DATABASE</span>
              {status?.services.nutrition === 'connected' ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-sm">
                  <CheckCircle className="w-4 h-4" /> External Connected
                </span>
              ) : (
                <span className="text-indigo-400 font-semibold flex items-center gap-1.5 text-sm font-mono">
                  <Database className="w-4 h-4" /> Dev Dataset (18 Foods)
                </span>
              )}
            </div>

            <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-slate-500 font-medium mb-1">DATABASE STATE</span>
              {status?.services.database === 'ready' ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-sm">
                  <CheckCircle className="w-4 h-4" /> Ready
                </span>
              ) : (
                <span className="text-red-400 font-semibold flex items-center gap-1.5 text-sm">
                  <ShieldAlert className="w-4 h-4" /> Error
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Architecture Flowcard */}
      <div className="glass-panel p-6 md:p-8 mb-10">
        <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center gap-2">
          <Cpu className="text-purple-500 w-6 h-6" /> The FoodVerify AI Pipeline
        </h2>

        <div className="relative border-l-2 border-slate-800 ml-4 md:ml-8 pl-6 md:pl-8 space-y-8">
          <div className="relative">
            <span className="absolute -left-11 top-1 bg-violet-600/20 text-violet-400 border border-violet-500/30 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <h3 className="text-lg font-semibold text-slate-200">Input Validation & Image Quality Check</h3>
            <p className="text-slate-400 text-sm mt-1">
              Supports manual text inputs or multi-format image files. Base64 inputs are evaluated for dimensions, file size limits, and basic quality metrics to block corrupted uploads.
            </p>
          </div>

          <div className="relative">
            <span className="absolute -left-11 top-1 bg-violet-600/20 text-violet-400 border border-violet-500/30 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <h3 className="text-lg font-semibold text-slate-200">Primary Food Vision model (Gemini Flash)</h3>
            <p className="text-slate-400 text-sm mt-1">
              Generates a structured JSON output with food name, portion estimates, category, and an AI confidence score normalized to 0.0-1.0. Gemini is constrained to never generate authoritative nutrition numbers.
            </p>
          </div>

          <div className="relative">
            <span className="absolute -left-11 top-1 bg-violet-600/20 text-violet-400 border border-violet-500/30 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <h3 className="text-lg font-semibold text-slate-200">Confidence Engine & Routing</h3>
            <p className="text-slate-400 text-sm mt-1">
              If confidence is <strong className="text-purple-400">&gt;= 80%</strong>, the system routes directly to nutrition lookup. If confidence is <strong className="text-amber-400">&lt; 80%</strong> or Gemini fails, an independent verification call is dynamically triggered.
            </p>
          </div>

          <div className="relative">
            <span className="absolute -left-11 top-1 bg-violet-600/20 text-violet-400 border border-violet-500/30 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <h3 className="text-lg font-semibold text-slate-200">Verification Engine & Conflict Detection</h3>
            <p className="text-slate-400 text-sm mt-1">
              Compares primary Gemini identification with candidates returned from an independent verification provider. It detects exact matches, partial agreements, or conflicts.
            </p>
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 mt-2 text-xs font-mono grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="flex flex-col gap-1"><span className="text-emerald-400">✓ Agreement</span><span>Gemini & Verifier match. Safe to compute.</span></div>
              <div className="flex flex-col gap-1"><span className="text-amber-400">⚠ Partial Agreement</span><span>Overlapping descriptors. Marked uncertain.</span></div>
              <div className="flex flex-col gap-1"><span className="text-red-400">✖ Conflict</span><span>Gemini and Verifier mismatch. Prompt user.</span></div>
            </div>
          </div>

          <div className="relative">
            <span className="absolute -left-11 top-1 bg-violet-600/20 text-violet-400 border border-violet-500/30 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">5</span>
            <h3 className="text-lg font-semibold text-slate-200">Verified Nutrition Repository</h3>
            <p className="text-slate-400 text-sm mt-1">
              Authoritative nutrition data is retrieved from a verified repository (not the LLM). Gram calculations scale nutritional content deterministically based on portions.
            </p>
          </div>

          <div className="relative">
            <span className="absolute -left-11 top-1 bg-violet-600/20 text-violet-400 border border-violet-500/30 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">6</span>
            <h3 className="text-lg font-semibold text-slate-200">Gemini Explanation & Goal Recommendation</h3>
            <p className="text-slate-400 text-sm mt-1">
              Gemini acts as the explanation layer, combining verified nutrition data with user-selected dietary goals (e.g. Weight Loss, Muscle Building) to generate personalized highlights without altering verified numbers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
