import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, HelpCircle, ShieldAlert, Zap, Flame, Info } from 'lucide-react';
import type { FinalFoodAnalysis, UserGoal } from '@shared/schemas/index.js';

const GOAL_LABELS: Record<UserGoal, string> = {
  WEIGHT_LOSS: 'Weight Loss',
  MUSCLE_BUILDING: 'Muscle Building',
  WEIGHT_GAIN: 'Weight Gain',
  MAINTENANCE: 'Maintenance',
  GENERAL_HEALTHY_EATING: 'General Healthy Eating'
};

export default function Result() {
  const [result, setResult] = useState<FinalFoodAnalysis | null>(null);
  const [customServingSize, setCustomServingSize] = useState<number>(0);
  const [resolvedFood, setResolvedFood] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = sessionStorage.getItem('foodverify_current_result');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as FinalFoodAnalysis;
        setResult(parsed);
        if (parsed.nutrition) {
          setCustomServingSize(parsed.nutrition.serving_size);
        }
      } catch (e) {
        console.error('Failed to load result from session storage', e);
      }
    }
  }, []);

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <HelpCircle className="w-12 h-12 text-slate-650 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-350 mb-2">No Analysis Selected</h2>
        <p className="text-slate-500 text-sm mb-6">Please start a new scan on the scanner page.</p>
        <button onClick={() => navigate('/')} className="btn-primary mx-auto">
          Go to Home Scanner
        </button>
      </div>
    );
  }

  // Handle case where custom serving size changes
  const handleServingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value, 10);
    if (!isNaN(size) && size >= 0) {
      setCustomServingSize(size);
    }
  };

  // Safe nutritional math factor
  const getNutritionFactor = () => {
    if (!result.nutrition || customServingSize <= 0) return 0;
    return customServingSize / result.nutrition.serving_size;
  };

  const scaleValue = (val: number | undefined) => {
    if (val === undefined) return undefined;
    const factor = getNutritionFactor();
    return Math.round(val * factor * 10) / 10;
  };

  // Status badge config
  const getConfidenceBadge = () => {
    if (result.status === 'BAD_IMAGE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          🔴 Bad Image Quality
        </span>
      );
    }
    if (result.status === 'NO_FOOD_DETECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          🔴 No Food Detected
        </span>
      );
    }
    if (result.status === 'AI_SERVICE_ERROR') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          🔴 AI Service Error
        </span>
      );
    }

    const conf = result.identification?.confidence_score ?? 0;
    if (conf >= 0.80) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          🟢 High Confidence ({(conf * 100).toFixed(0)}%)
        </span>
      );
    }
    if (conf >= 0.50) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          🟡 Needs Verification ({(conf * 100).toFixed(0)}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        🔴 Low Confidence ({(conf * 100).toFixed(0)}%)
      </span>
    );
  };

  const getVerificationBadge = () => {
    const status = result.verification_status;
    if (!status || status === 'UNAVAILABLE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/50">
          ⚪ Independent verification unavailable
        </span>
      );
    }
    if (status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          ✓ Verification Agreement
        </span>
      );
    }
    if (status === 'PARTIAL_AGREEMENT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          ⚠ Partial Agreement
        </span>
      );
    }
    if (status === 'CONFLICT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          ⚠ Identification Conflict
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/50">
        {status}
      </span>
    );
  };

  const isConflict = result.verification_status === 'CONFLICT';
  const hasExplanation = result.explanation && !isConflict && result.verification_status !== 'UNCERTAIN';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-sm font-semibold transition-colors bg-slate-900/40 px-3 py-1.5 border border-slate-800/80 rounded-xl cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> New Scan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Verification & Identification column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Card */}
          <div className="glass-panel p-6">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Identified Food Name
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 mt-1 capitalize">
              {resolvedFood || result.identification?.food_name || result.input.food_name_input || '—'}
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Category: <span className="text-slate-350 capitalize">{result.identification?.food_category || '—'}</span>
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {getConfidenceBadge()}
              {getVerificationBadge()}
            </div>

            {/* Error notifications */}
            {result.errors && result.errors.length > 0 && (
              <div className="bg-red-950/20 border border-red-900/40 text-red-300 rounded-xl p-4 text-xs mt-4 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-red-400" /> Pipeline Warnings
                </span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {result.errors.map((e: { stage: string; message: string; code?: string }, idx: number) => (
                    <li key={idx}><span className="font-semibold text-slate-300">[{e.stage}]</span>: {e.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Conflict Resolver Card */}
          {isConflict && !resolvedFood && (
            <div className="glass-panel p-6 border-red-500/20 bg-red-950/5">
              <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5" /> Identification Conflict Detected
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                The primary AI identified this food differently than the independent verification provider. To ensure accurate nutrition calculations, please select the correct food:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setResolvedFood(result.identification?.food_name || '')}
                  className="glass-card p-4 text-left hover:border-purple-500/50 cursor-pointer"
                >
                  <span className="text-xs text-purple-400 font-semibold block mb-1">OPTION A (PRIMARY AI)</span>
                  <strong className="text-base text-slate-100 capitalize block mb-0.5">{result.identification?.food_name}</strong>
                  <span className="text-xs text-slate-500">Gemini Confidence: {result.identification?.confidence_score ? `${(result.identification.confidence_score * 100).toFixed(0)}%` : '—'}</span>
                </button>
                <button
                  onClick={() => setResolvedFood(result.verification?.candidate_foods?.[0] || '')}
                  className="glass-card p-4 text-left hover:border-teal-500/50 cursor-pointer"
                >
                  <span className="text-xs text-teal-400 font-semibold block mb-1">OPTION B (VERIFIER)</span>
                  <strong className="text-base text-slate-100 capitalize block mb-0.5">{result.verification?.candidate_foods?.[0]}</strong>
                  <span className="text-xs text-slate-500">Verifier Confidence: {result.verification?.confidence ? `${(result.verification.confidence * 100).toFixed(0)}%` : '—'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Verification Systems details */}
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-200">Execution Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Primary Vision AI</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-500 text-xs block">Provider</span>
                    <strong className="text-slate-300 text-sm">Gemini 2.0 Flash</strong>
                  </div>
                  {result.identification?.reasoning_summary && (
                    <div>
                      <span className="text-slate-500 text-xs block">AI Reasoning</span>
                      <p className="text-slate-400 text-xs italic mt-0.5">"{result.identification.reasoning_summary}"</p>
                    </div>
                  )}
                  {result.identification?.visible_components && result.identification.visible_components.length > 0 && (
                    <div>
                      <span className="text-slate-500 text-xs block">Detected Components</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {result.identification.visible_components.map((c: string, i: number) => (
                          <span key={i} className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800 capitalize">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-card p-4">
                <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Independent Verifier</h3>
                {result.verification ? (
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500 text-xs block">Provider</span>
                      <strong className="text-slate-300 text-sm">{result.verification.provider}</strong>
                    </div>
                    {result.verification.candidate_foods && result.verification.candidate_foods.length > 0 && (
                      <div>
                        <span className="text-slate-500 text-xs block">Candidates Identified</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {result.verification.candidate_foods.map((c: string, i: number) => (
                            <span key={i} className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800 capitalize">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.verification.evidence && result.verification.evidence.length > 0 && (
                      <div>
                        <span className="text-slate-500 text-xs block">Evidence logs</span>
                        <ul className="text-[10px] text-slate-400 mt-1 list-disc pl-3">
                          {result.verification.evidence.map((ev: string, i: number) => (
                            <li key={i}>{ev}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-28 text-slate-600 text-center">
                    <HelpCircle className="w-8 h-8 mb-1.5" />
                    <span className="text-xs font-semibold">Verifier was not called</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">High confidence skipped verification</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Explanation Goal fit Section */}
          <div className="glass-panel p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Zap className="text-purple-400 w-5 h-5" /> Goal Recommendation ({GOAL_LABELS[result.input.goal]})
            </h2>

            {hasExplanation ? (
              <div className="space-y-4">
                <p className="text-slate-300 text-sm italic border-l-2 border-purple-500 pl-3">
                  "{result.explanation?.summary}"
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/80">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Potential Benefits</h3>
                    <ul className="list-disc pl-4 text-xs text-slate-400 space-y-1.5">
                      {result.explanation?.potential_benefits.map((b: string, i: number) => <li key={i}>{b}</li>)}
                    </ul>
                  </div>

                  <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/80">
                    <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">Nutritional Highlights</h3>
                    <ul className="list-disc pl-4 text-xs text-slate-400 space-y-1.5">
                      {result.explanation?.nutritional_highlights.map((h: string, i: number) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 mt-4 space-y-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Goal Alignment</h3>
                    <p className="text-slate-300 text-xs mt-1">{result.explanation?.goal_alignment}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Recommendation</h3>
                    <p className="text-slate-300 text-xs mt-1">{result.explanation?.recommendation}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-4 rounded-xl bg-amber-500/5 border border-amber-500/25 text-amber-400 text-xs">
                <Info className="w-5 h-5 flex-shrink-0" />
                <span>I can't provide a reliable personalized analysis until the food is confirmed.</span>
              </div>
            )}
          </div>
        </div>

        {/* Nutrition values column */}
        <div className="space-y-6">
          <div className="glass-panel p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-200">Nutrition Profile</h2>

            {result.nutrition ? (
              <div className="space-y-6">
                
                {/* Serving size customizer */}
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2">
                  <label htmlFor="custom-serving" className="text-xs text-slate-400 font-bold uppercase tracking-wider flex justify-between">
                    <span>Serving Size</span>
                    <span className="text-[10px] text-slate-500 font-semibold italic capitalize">
                      {result.nutrition.is_approximate ? 'Approximate serving estimate' : 'Authoritative source'}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="custom-serving"
                      type="number"
                      value={customServingSize}
                      onChange={handleServingChange}
                      min="1"
                      className="glass-input w-24 text-center text-sm font-semibold"
                    />
                    <span className="text-slate-400 text-sm font-semibold">{result.nutrition.serving_unit}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 italic block mt-1">
                    Values are estimates based on identified food and serving size. Adjust weight to scale macros.
                  </span>
                </div>

                {/* Macro summary */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Calories</span>
                    <span className="text-2xl font-extrabold text-slate-100 font-mono flex items-center justify-center gap-1 mt-1">
                      <Flame className="w-5 h-5 text-orange-500" /> {scaleValue(result.nutrition.calories)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">kcal</span>
                  </div>
                  <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Protein</span>
                    <span className="text-2xl font-extrabold text-indigo-400 font-mono mt-1 block">
                      {scaleValue(result.nutrition.protein)}g
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">Macros</span>
                  </div>
                </div>

                {/* Macro meters */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-400">Carbohydrates</span>
                      <span className="text-slate-200">{scaleValue(result.nutrition.carbohydrates)}g</span>
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(100, ((scaleValue(result.nutrition.carbohydrates) || 0) / 100) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-400">Fat</span>
                      <span className="text-slate-200">{scaleValue(result.nutrition.fat)}g</span>
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 rounded-full" style={{ width: `${Math.min(100, ((scaleValue(result.nutrition.fat) || 0) / 50) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                {/* Micro metrics */}
                <div className="border-t border-slate-800/80 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Dietary Fiber</span>
                    <span className="text-slate-300 font-semibold font-mono">{scaleValue(result.nutrition.fiber)}g</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Total Sugars</span>
                    <span className="text-slate-300 font-semibold font-mono">{scaleValue(result.nutrition.sugar)}g</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Sodium</span>
                    <span className="text-slate-300 font-semibold font-mono">{scaleValue(result.nutrition.sodium)}mg</span>
                  </div>
                  
                  {result.nutrition.vitamin_a !== undefined && (
                    <div className="flex justify-between py-1 border-t border-slate-900/60 mt-1">
                      <span className="text-slate-500 font-medium">Vitamin A</span>
                      <span className="text-slate-300 font-semibold font-mono">{scaleValue(result.nutrition.vitamin_a)}μg</span>
                    </div>
                  )}
                  {result.nutrition.vitamin_c !== undefined && (
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">Vitamin C</span>
                      <span className="text-slate-300 font-semibold font-mono">{scaleValue(result.nutrition.vitamin_c)}mg</span>
                    </div>
                  )}
                  {result.nutrition.calcium !== undefined && (
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">Calcium</span>
                      <span className="text-slate-300 font-semibold font-mono">{scaleValue(result.nutrition.calcium)}mg</span>
                    </div>
                  )}
                  {result.nutrition.iron !== undefined && (
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">Iron</span>
                      <span className="text-slate-300 font-semibold font-mono">{scaleValue(result.nutrition.iron)}mg</span>
                    </div>
                  )}
                  {result.nutrition.potassium !== undefined && (
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">Potassium</span>
                      <span className="text-slate-300 font-semibold font-mono">{scaleValue(result.nutrition.potassium)}mg</span>
                    </div>
                  )}
                </div>

                {/* Nutrition Database Source Label */}
                <div className="text-[10px] text-slate-500 italic pt-2 text-center border-t border-slate-800">
                  Source: {result.nutrition.source}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-550 border border-slate-850/50 rounded-xl bg-slate-950/15">
                <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
                <span className="text-xs font-semibold text-slate-400">Nutrition Data Unavailable</span>
                <span className="text-[10px] text-slate-500 mt-1">No database mapping was found for the identified food name.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
