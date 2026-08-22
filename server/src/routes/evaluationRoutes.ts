import { Router, Request, Response } from 'express';
import { evaluationController } from '../controllers/evaluationController.js';

const router = Router();

router.get('/evaluation', evaluationController.getMetrics);
router.post('/evaluation/run', evaluationController.runEvaluation);

export { router as evaluationRoutes };
