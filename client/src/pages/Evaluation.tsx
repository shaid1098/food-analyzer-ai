import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import type { EvaluationResponse } from '../services/api.js';
import { Play, Check, X, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';

export default function Evaluation() {
  const [data, setData] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = () => {
    setLoading(true);
    api.getEvaluation()
      .then(setData)
      .catch(err => {
        console.error(err);
        setError(err.message || 'Failed to fetch evaluation metrics');
      })
      .finally(() => setLoading(false));
  };

  const handleRunEvaluation = () => {
    setRunning(true);
    setError(null);
    api.runEvaluation()
      .then(res => {
        setData(res);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Error occurred while running evaluation harness');
      })
      .finally(() => setRunning(false));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-slate-400">Loading evaluation metrics...</p>
      </div>
    );
  }

  const metrics = data?.metrics;
  const results = data?.results || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Evaluation Harness</h1>
          <p className="text-slate-400 text-sm mt-1">
            Test the live analysis pipeline against 20 pre-configured test cases.
          </p>
        </div>
        <button
          onClick={handleRunEvaluation}
          disabled={running}
          className="btn-primary flex items-center gap-2"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Running Harness...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Run 20 Test Cases
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 text-red-300 text-sm mb-6 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong className="font-semibold block mb-0.5">Execution Failed</strong>
            {error}
          </div>
        </div>
      )}

      {/* Metrics Cards Grid */}
      {!metrics ? (
        <div className="glass-panel p-10 text-center mb-8">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-slate-300 mb-1">No Evaluation Data Available</h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-4">
            You need to trigger the test harness to calculate live system metrics.
          </p>
          <button
            onClick={handleRunEvaluation}
            disabled={running}
            className="btn-secondary mx-auto"
          >
            {running ? 'Running...' : 'Run Test Harness Now'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="glass-card p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-medium">TOTAL TESTS</span>
            <span className="text-2xl font-bold mt-2 text-slate-100">{metrics.total_tests}</span>
          </div>

          <div className="glass-card p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-medium">ACCURACY</span>
            <span className={`text-2xl font-bold mt-2 ${metrics.accuracy >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {metrics.accuracy.toFixed(1)}%
            </span>
          </div>

          <div className="glass-card p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-medium">GEMINI SUCCESS RATE</span>
            <span className="text-2xl font-bold mt-2 text-indigo-400">{metrics.gemini_success_rate.toFixed(1)}%</span>
          </div>

          <div className="glass-card p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-medium">FALLBACK RATE</span>
            <span className="text-2xl font-bold mt-2 text-amber-500">{metrics.fallback_rate.toFixed(1)}%</span>
          </div>

          <div className="glass-card p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-medium">CONFLICT RATE</span>
            <span className="text-2xl font-bold mt-2 text-red-400">{metrics.conflict_rate.toFixed(1)}%</span>
          </div>

          <div className="glass-card p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-medium">VERIFICATION AGREEMENT</span>
            <span className="text-2xl font-bold mt-2 text-teal-400">{metrics.verification_agreement_rate.toFixed(1)}%</span>
          </div>

          <div className="glass-card p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-medium">REFUSAL RATE</span>
            <span className="text-2xl font-bold mt-2 text-purple-400">{metrics.refusal_rate.toFixed(1)}%</span>
          </div>

          <div className="glass-card p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-medium">AVERAGE LATENCY</span>
            <span className="text-2xl font-bold mt-2 text-sky-400">{Math.round(metrics.average_latency)}ms</span>
          </div>

          <div className="glass-card p-4 flex flex-col justify-between col-span-2">
            <span className="text-xs text-slate-500 font-medium">API ERRORS DETECTED</span>
            <span className={`text-2xl font-bold mt-2 ${metrics.api_error_count > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {metrics.api_error_count}
            </span>
          </div>
        </div>
      )}

      {/* Results Detail Table */}
      {results.length > 0 && (
        <div className="glass-panel overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-200">Execution Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Expected Food</th>
                  <th className="px-6 py-3">Gemini Result</th>
                  <th className="px-6 py-3">Confidence</th>
                  <th className="px-6 py-3">Fallback</th>
                  <th className="px-6 py-3">Final Result</th>
                  <th className="px-6 py-3 text-center">Correct</th>
                  <th className="px-6 py-3 text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {results.map(r => (
                  <tr key={r.test_case_id} className="hover:bg-slate-800/10 text-slate-300">
                    <td className="px-6 py-4 font-mono text-xs">{r.test_case_id}</td>
                    <td className="px-6 py-4 font-medium">{r.expected_food}</td>
                    <td className="px-6 py-4">{r.gemini_result || <span className="text-slate-600">—</span>}</td>
                    <td className="px-6 py-4 font-mono">
                      {r.gemini_confidence !== undefined ? `${Math.round(r.gemini_confidence * 100)}%` : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {r.fallback_triggered ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Triggered</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-500">Skipped</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        r.final_result === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        r.final_result === 'BAD_IMAGE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        r.final_result === 'CONFLICT' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {r.final_result}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {r.correct ? (
                        <span className="inline-flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full w-6 h-6">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center bg-red-500/15 border border-red-500/30 text-red-400 rounded-full w-6 h-6" title={r.failure_reason}>
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-slate-400">{r.latency}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
