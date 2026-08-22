import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeRoutes } from './routes/analyzeRoutes.js';
import { evaluationRoutes } from './routes/evaluationRoutes.js';
import { healthRoutes } from './routes/healthRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// Routes
app.use('/api', healthRoutes);
app.use('/api', analyzeRoutes);
app.use('/api', evaluationRoutes);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[FoodVerify] Server running on port ${PORT}`);
  console.log(`[FoodVerify] Health check: http://localhost:${PORT}/api/health`);
  console.log(`[FoodVerify] Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`[FoodVerify] Verification API: ${process.env.VERIFICATION_API_KEY ? 'Configured' : 'Not configured'}`);
});

export default app;
