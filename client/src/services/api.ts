import type { FinalFoodAnalysis, UserGoal, EvaluationMetrics, EvaluationResult } from '@shared/schemas/index.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface AnalysisResponse extends FinalFoodAnalysis {}

export interface EvaluationResponse {
  metrics: EvaluationMetrics | null;
  results: EvaluationResult[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  services: {
    gemini: 'connected' | 'not_connected' | 'error';
    verification: 'connected' | 'not_connected' | 'error';
    nutrition: 'connected' | 'not_connected' | 'error';
    database: 'ready' | 'not_ready' | 'error';
  };
}

export const api = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) {
      throw new Error(`Health check failed: ${res.statusText}`);
    }
    return res.json();
  },

  async analyzeFood(input: {
    imageFile?: File;
    foodName?: string;
    goal: UserGoal;
  }): Promise<AnalysisResponse> {
    const formData = new FormData();
    if (input.imageFile) {
      formData.append('image', input.imageFile);
    }
    if (input.foodName) {
      formData.append('foodName', input.foodName);
    }
    formData.append('goal', input.goal);

    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Analysis failed: ${res.statusText}`);
    }

    return res.json();
  },

  async getEvaluation(): Promise<EvaluationResponse> {
    const res = await fetch(`${API_BASE}/evaluation`);
    if (!res.ok) {
      throw new Error(`Failed to fetch evaluation metrics: ${res.statusText}`);
    }
    return res.json();
  },

  async runEvaluation(): Promise<EvaluationResponse> {
    const res = await fetch(`${API_BASE}/evaluation/run`, {
      method: 'POST',
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to run evaluation: ${res.statusText}`);
    }
    return res.json();
  },
};
