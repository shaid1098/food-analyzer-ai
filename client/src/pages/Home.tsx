import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { Upload, Keyboard, AlertCircle, Sparkles, Check, ChevronRight } from 'lucide-react';
import type { UserGoal } from '@shared/schemas/index.js';

const GOALS: { value: UserGoal; label: string; desc: string }[] = [
  { value: 'GENERAL_HEALTHY_EATING', label: 'Healthy Eating', desc: 'Maintain clean, balanced nutrition' },
  { value: 'WEIGHT_LOSS', label: 'Weight Loss', desc: 'Caloric deficit and high satiety foods' },
  { value: 'MUSCLE_BUILDING', label: 'Muscle Building', desc: 'Protein-dense nutrition for recovery' },
  { value: 'WEIGHT_GAIN', label: 'Weight Gain', desc: 'Nutrient-rich, calorie-dense foods' },
  { value: 'MAINTENANCE', label: 'Maintenance', desc: 'Balanced macros to sustain current weight' }
];

export default function Home() {
  const [mode, setMode] = useState<'image' | 'name'>('image');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [foodName, setFoodName] = useState('');
  const [goal, setGoal] = useState<UserGoal>('GENERAL_HEALTHY_EATING');
  
  // Pipeline status tracking
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    } else {
      setError('Please drop a valid image file (JPEG, PNG, WebP).');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const simulateProgress = async () => {
    const stages = [
      'Validating image upload metrics...',
      'Sending to Gemini 2.0 Vision for identification...',
      'Extracting structured JSON metadata...',
      'Evaluating primary confidence metrics...',
      'Routing to verification (if confidence < 80%)...',
      'Retrieving verified nutrition database records...',
      'Applying calorie portion calculators...',
      'Generating goal-based recommendations...',
      'Finalizing analysis results...'
    ];

    for (let i = 0; i < stages.length; i++) {
      setStage(stages[i]);
      // Let each state run for a bit to show the workflow progression
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    if (mode === 'image' && !imageFile) {
      setError('Please upload or capture a food image.');
      return;
    }
    if (mode === 'name' && !foodName.trim()) {
      setError('Please enter a food name.');
      return;
    }

    setLoading(true);
    setError(null);

    // Run parallel progress text updates to show the actual pipeline
    const progressPromise = simulateProgress();

    try {
      const response = await api.analyzeFood({
        imageFile: mode === 'image' ? imageFile || undefined : undefined,
        foodName: mode === 'name' ? foodName : undefined,
        goal
      });

      // Wait for progress simulation to finish so user sees the flow
      await progressPromise;

      // Save to localStorage history
      const savedHistory = localStorage.getItem('foodverify_history');
      const historyList = savedHistory ? JSON.parse(savedHistory) : [];
      localStorage.setItem('foodverify_history', JSON.stringify([response, ...historyList].slice(0, 50)));

      // Save to sessionStorage for result page
      sessionStorage.setItem('foodverify_current_result', JSON.stringify(response));

      // Redirect to Result Page
      navigate('/result');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Food analysis service is temporarily unavailable.');
    } finally {
      setLoading(false);
      setStage('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Hackathon Demo Ready
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-3">
          <span className="text-gradient">FoodVerify AI</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-xl mx-auto">
          Identify food. Verify uncertainty. Understand nutrition.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main form area */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleAnalyze} className="glass-panel p-6 space-y-6 relative overflow-hidden">
            {loading && <div className="scan-line" />}

            {/* Input Mode Selector Tabs */}
            <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => { setMode('image'); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'image' ? 'bg-slate-850 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-4 h-4" /> Image Capture
              </button>
              <button
                type="button"
                onClick={() => { setMode('name'); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'name' ? 'bg-slate-850 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Keyboard className="w-4 h-4" /> Food Name
              </button>
            </div>

            {/* Upload Area */}
            {mode === 'image' && (
              <div className="space-y-4">
                {!imagePreview ? (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-950/20 group"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Upload className="w-10 h-10 text-slate-600 group-hover:text-purple-400 transition-colors mx-auto mb-3" />
                    <h3 className="text-slate-200 font-semibold mb-1">Upload or Drag Image</h3>
                    <p className="text-slate-500 text-xs max-w-xs mx-auto">
                      Supports JPEG, PNG, WebP, GIF. Camera capture is supported if your browser has permissions.
                    </p>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/40">
                    <img
                      src={imagePreview}
                      alt="Food preview"
                      className="w-full max-h-[300px] object-contain mx-auto block p-2"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 hover:opacity-100 transition-all flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary"
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="bg-red-650 hover:bg-red-500 text-white px-4 py-2 rounded-xl transition-all font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Text input area */}
            {mode === 'name' && (
              <div className="space-y-2">
                <label htmlFor="food-name" className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Enter a food name
                </label>
                <input
                  id="food-name"
                  type="text"
                  value={foodName}
                  onChange={(e) => { setFoodName(e.target.value); setError(null); }}
                  placeholder="e.g. Chicken biryani, Banana, Pizza"
                  className="glass-input w-full text-lg"
                />
                <span className="text-[11px] text-slate-500 italic block mt-1">
                  Tip: Enter simple identifiers for best local database mapping.
                </span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="bg-red-950/20 border border-red-900/40 text-red-300 rounded-xl p-4 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                <div>{error}</div>
              </div>
            )}

            {/* Analyze Button */}
            {!loading ? (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base font-bold py-3.5"
              >
                Analyze Food <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="glass-card p-5 text-center space-y-4 border-purple-500/20 bg-purple-500/5">
                <div className="relative w-10 h-10 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-500/10 border-t-purple-500 animate-spin" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-400 text-sm tracking-wide uppercase">Processing pipeline</h3>
                  <p className="text-slate-300 text-sm mt-1 animate-pulse">{stage}</p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Goal selector sidebar */}
        <div className="space-y-6">
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Personal Nutrition Goal
            </h2>
            <div className="space-y-2.5">
              {GOALS.map((g) => {
                const isSelected = goal === g.value;
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGoal(g.value)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-600/15 border-purple-500 text-slate-100 shadow-md'
                        : 'bg-slate-900/20 border-slate-800 hover:border-slate-700/60 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">{g.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{g.desc}</div>
                    </div>
                    {isSelected && (
                      <span className="bg-purple-500 text-white rounded-full p-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
