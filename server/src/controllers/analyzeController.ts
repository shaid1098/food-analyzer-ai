import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { FoodAnalysisOrchestrator } from '../orchestrator/FoodAnalysisOrchestrator.js';
import type { UserGoal } from '../../../shared/schemas/index.js';

const orchestrator = new FoodAnalysisOrchestrator();

export async function analyzeController(req: Request, res: Response): Promise<void> {
  try {
    const requestId = (req as any).requestId || uuidv4().slice(0, 8);
    const startTime = Date.now();

    // Extract inputs
    const file = req.file;
    const foodName = req.body.foodName as string | undefined;
    const goal = (req.body.goal as UserGoal) || 'GENERAL_HEALTHY_EATING';

    // Validate: must have image or food name
    if (!file && !foodName) {
      res.status(400).json({
        status: 'ERROR',
        message: 'Either an image or food name must be provided.',
      });
      return;
    }

    // Convert image to base64 if provided
    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;
    if (file) {
      imageBase64 = file.buffer.toString('base64');
      imageMimeType = file.mimetype;
    }

    console.log(`[FoodVerify][${requestId}] Analysis request: image=${!!file}, foodName=${foodName || 'none'}, goal=${goal}`);

    // Run the full orchestrator pipeline
    const result = await orchestrator.analyze({
      requestId,
      imageBase64,
      imageMimeType,
      foodName,
      goal,
    });

    const totalLatency = Date.now() - startTime;
    console.log(`[FoodVerify][${requestId}] Analysis complete: status=${result.status}, latency=${totalLatency}ms`);

    res.json({
      ...result,
      latency: {
        ...result.latency,
        total: totalLatency,
      },
    });
  } catch (error) {
    console.error('[FoodVerify] Analyze controller error:', (error as Error).message);
    res.status(500).json({
      status: 'AI_SERVICE_ERROR',
      message: 'Food analysis is temporarily unavailable.',
    });
  }
}
