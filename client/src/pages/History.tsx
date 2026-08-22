import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Calendar, ChevronRight, Award, Flame } from 'lucide-react';
import type { FinalFoodAnalysis } from '@shared/schemas/index.js';

export default function History() {
  const [history, setHistory] = useState<FinalFoodAnalysis[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('foodverify_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history from localStorage', e);
      }
    }
  }, []);

  const handleClear = () => {
    localStorage.removeItem('foodverify_history');
    setHistory([]);
  };

  const handleItemClick = (analysis: FinalFoodAnalysis) => {
    // Navigate to results page with query parameter
    // Or save as current result and navigate
    sessionStorage.setItem('foodverify_current_result', JSON.stringify(analysis));
    navigate('/result');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Scan History</h1>
          <p className="text-slate-400 text-sm mt-1">Review your past food analyses and verification checks.</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 text-sm font-semibold border border-red-500/20 hover:border-red-500/40 bg-red-950/20 px-3 py-1.5 rounded-xl cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-slate-300 mb-1">No Scans Recorded Yet</h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
            Upload an image or enter a food name on the Home page to analyze your first meal.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary mx-auto"
          >
            Start First Analysis
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((h) => {
            const date = new Date(h.timestamp).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const foodName = h.identification?.food_name || h.input.food_name_input || 'Unknown';
            const calories = h.nutrition?.calories;
            const portion = h.identification?.estimated_portion || h.nutrition?.serving_size ? `${h.nutrition?.serving_size}${h.nutrition?.serving_unit}` : '';

            return (
              <div
                key={h.id}
                onClick={() => handleItemClick(h)}
                className="glass-card p-5 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-purple-400 group-hover:text-purple-300 group-hover:border-slate-700 transition-colors">
                    {h.input.had_image ? (
                      <Award className="w-6 h-6" />
                    ) : (
                      <Flame className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-200 group-hover:text-purple-400 transition-colors capitalize">
                      {foodName}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {date}
                      </span>
                      {portion && <span>• Portion: {portion}</span>}
                      {h.status && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          h.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' :
                          h.status === 'CONFLICT' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {h.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {calories !== undefined && (
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-slate-100 font-mono">{calories}</span>
                      <span className="text-slate-500 text-xs block">kcal</span>
                    </div>
                  )}
                  <ChevronRight className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
