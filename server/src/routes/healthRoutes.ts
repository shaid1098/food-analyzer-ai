import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  const verificationConfigured = !!process.env.VERIFICATION_API_KEY;
  const nutritionConfigured = !!process.env.NUTRITION_API_KEY;

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      gemini: geminiConfigured ? 'connected' : 'not_connected',
      verification: verificationConfigured ? 'connected' : 'not_connected',
      nutrition: nutritionConfigured ? 'connected' : 'not_connected',
      database: 'ready',
    },
  });
});

export { router as healthRoutes };
