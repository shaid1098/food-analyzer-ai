import { Request, Response } from 'express';
import { EvaluationStore } from '../services/evaluation/EvaluationStore.js';
import { EvaluationHarness } from '../services/evaluation/EvaluationHarness.js';

const store = new EvaluationStore();
const harness = new EvaluationHarness();

export const evaluationController = {
  async getMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const metrics = store.getMetrics();
      const results = store.getResults();
      res.json({ metrics, results });
    } catch (error) {
      console.error('[FoodVerify] Evaluation metrics error:', (error as Error).message);
      res.status(500).json({
        status: 'ERROR',
        message: 'Failed to retrieve evaluation metrics.',
      });
    }
  },

  async runEvaluation(_req: Request, res: Response): Promise<void> {
    try {
      console.log('[FoodVerify] Evaluation run requested...');
      const results = await harness.runAll();
      const metrics = store.getMetrics();
      res.json({ status: 'SUCCESS', metrics, results });
    } catch (error) {
      console.error('[FoodVerify] Evaluation run error:', (error as Error).message);
      res.status(500).json({
        status: 'ERROR',
        message: 'Failed to run evaluation.',
      });
    }
  },
};
