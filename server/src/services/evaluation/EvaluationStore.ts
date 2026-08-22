import fs from 'fs';
import path from 'path';
import type { EvaluationResult, EvaluationMetrics } from '../../../../shared/schemas/index.js';

export class EvaluationStore {
  private filePath: string;
  private results: EvaluationResult[] = [];

  constructor() {
    this.filePath = path.join(process.cwd(), 'data/evaluation_results.json');
    this.ensureDataDir();
    this.loadResults();
  }

  private ensureDataDir(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadResults(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.results = JSON.parse(raw) as EvaluationResult[];
        console.log(`[EvaluationStore] Loaded ${this.results.length} evaluation records.`);
      }
    } catch (error) {
      console.error('[EvaluationStore] Error loading evaluation results:', (error as Error).message);
      this.results = [];
    }
  }

  public saveResults(newResults: EvaluationResult[]): void {
    try {
      this.results = newResults;
      fs.writeFileSync(this.filePath, JSON.stringify(this.results, null, 2), 'utf-8');
      console.log(`[EvaluationStore] Saved ${this.results.length} evaluation records.`);
    } catch (error) {
      console.error('[EvaluationStore] Error saving evaluation results:', (error as Error).message);
    }
  }

  public getResults(): EvaluationResult[] {
    this.loadResults();
    return this.results;
  }

  public getMetrics(): EvaluationMetrics | null {
    this.loadResults();
    if (this.results.length === 0) {
      return null;
    }

    let correctCount = 0;
    let geminiSuccessCount = 0;
    let fallbackCount = 0;
    let agreementCount = 0;
    let conflictCount = 0;
    let refusalCount = 0;
    let apiErrorCount = 0;
    let totalLatency = 0;

    for (const r of this.results) {
      if (r.correct) correctCount++;
      
      // If Gemini returned a response (even if low confidence) and didn't fail with API error
      const isGeminiSuccess = r.gemini_result && !r.failure_reason?.includes('Gemini API') && !r.failure_reason?.includes('Gemini timeout');
      if (isGeminiSuccess) geminiSuccessCount++;

      if (r.fallback_triggered) fallbackCount++;
      
      // Verification agreement
      if (r.fallback_triggered && r.verification_result && r.gemini_result) {
        if (r.verification_result.toLowerCase() === r.gemini_result.toLowerCase()) {
          agreementCount++;
        } else {
          conflictCount++;
        }
      }

      if (r.final_result === 'REFUSED' || (r.failure_reason && r.failure_reason.includes('REFUSED'))) {
        refusalCount++;
      }

      if (r.failure_reason && (r.failure_reason.includes('API') || r.failure_reason.includes('timeout') || r.failure_reason.includes('limit'))) {
        apiErrorCount++;
      }

      totalLatency += r.latency;
    }

    const total = this.results.length;

    return {
      total_tests: total,
      correct: correctCount,
      incorrect: total - correctCount,
      accuracy: total > 0 ? (correctCount / total) * 100 : 0,
      gemini_success_rate: total > 0 ? (geminiSuccessCount / total) * 100 : 0,
      fallback_rate: total > 0 ? (fallbackCount / total) * 100 : 0,
      verification_agreement_rate: fallbackCount > 0 ? (agreementCount / fallbackCount) * 100 : 0,
      conflict_rate: fallbackCount > 0 ? (conflictCount / fallbackCount) * 100 : 0,
      refusal_rate: total > 0 ? (refusalCount / total) * 100 : 0,
      average_latency: total > 0 ? totalLatency / total : 0,
      api_error_count: apiErrorCount,
    };
  }
}
