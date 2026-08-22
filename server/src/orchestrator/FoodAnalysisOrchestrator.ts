import { v4 as uuidv4 } from 'uuid';
import { GeminiFoodAnalyzer } from '../services/gemini/foodAnalyzer.js';
import { GeminiExplanationGenerator } from '../services/gemini/explanationGenerator.js';
import { VerificationEngine } from '../verification/VerificationEngine.js';
import { NutritionService } from '../nutrition/NutritionService.js';
import { validateImageQuality } from '../utils/imageValidation.js';
import type { FinalFoodAnalysis, UserGoal, ConfidenceLevel, VerificationStatus } from '../../../shared/schemas/index.js';

interface AnalyzeInput {
  requestId: string;
  imageBase64?: string;
  imageMimeType?: string;
  foodName?: string;
  goal: UserGoal;
}

export class FoodAnalysisOrchestrator {
  private geminiAnalyzer = new GeminiFoodAnalyzer();
  private explanationGenerator = new GeminiExplanationGenerator();
  private verificationEngine = new VerificationEngine();
  private nutritionService = new NutritionService();

  async analyze(input: AnalyzeInput): Promise<FinalFoodAnalysis> {
    const { requestId, imageBase64, imageMimeType, foodName, goal } = input;
    const errors: Array<{ stage: string; message: string; code?: string }> = [];
    const result: FinalFoodAnalysis = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      input: {
        had_image: !!imageBase64,
        food_name_input: foodName,
        goal,
      },
      errors: [],
      latency: { total: 0 },
    };

    try {
      // ── Stage 1: Image quality check ──
      if (imageBase64 && imageMimeType) {
        const quality = validateImageQuality(imageBase64, imageMimeType);
        result.image_quality = quality;

        if (quality.status === 'INVALID') {
          result.status = 'BAD_IMAGE';
          result.errors = [{ stage: 'image_quality', message: quality.message }];
          return result;
        }
      }

      // ── Stage 2: Primary identification (Gemini) ──
      let geminiLatencyStart = Date.now();
      const identification = await this.geminiAnalyzer.analyze({
        imageBase64,
        imageMimeType,
        foodName,
      });
      const geminiLatency = Date.now() - geminiLatencyStart;
      if (result.latency) result.latency.gemini = geminiLatency;

      if (identification.status === 'NO_FOOD_DETECTED') {
        result.status = 'NO_FOOD_DETECTED';
        result.errors = [{ stage: 'gemini', message: 'No food detected in the image.' }];
        return result;
      }

      if (identification.status === 'ERROR') {
        errors.push({ stage: 'gemini', message: identification.error || 'Gemini analysis failed', code: 'AI_SERVICE_ERROR' });
        // Continue — verification may still help if available
      }

      if (identification.data) {
        result.identification = identification.data;
        result.confidence_level = this.getConfidenceLevel(identification.data.confidence_score);
      }

      // ── Stage 3: Confidence-based verification routing ──
      const confidence = identification.data?.confidence_score ?? 0;
      const needsVerification = confidence < 0.80 || identification.status === 'ERROR';

      let verificationLatencyStart = Date.now();
      if (needsVerification) {
        console.log(`[FoodVerify][${requestId}] Confidence ${confidence.toFixed(2)} — triggering verification`);
        const verificationResult = await this.verificationEngine.verify({
          imageBase64,
          imageMimeType,
          primaryFoodName: identification.data?.food_name,
        });
        const verificationLatency = Date.now() - verificationLatencyStart;
        if (result.latency) result.latency.verification = verificationLatency;
        result.verification = verificationResult.providerResult;
        result.verification_status = verificationResult.decision;
      } else {
        console.log(`[FoodVerify][${requestId}] Confidence ${confidence.toFixed(2)} — skipping verification`);
        result.verification_status = 'VERIFIED';
      }

      // ── Stage 4: Determine if we can proceed ──
      if (result.verification_status === 'CONFLICT') {
        result.status = 'CONFLICT';
        result.errors = errors;
        // Still try to get nutrition for the primary identification
      }

      if (result.verification_status === 'REFUSED') {
        result.status = 'REFUSED';
        result.errors = errors;
        return result;
      }

      // ── Stage 5: Nutrition retrieval ──
      const foodForNutrition = result.identification?.food_name || foodName;
      if (foodForNutrition) {
        const nutritionLatencyStart = Date.now();
        const nutritionResult = await this.nutritionService.getNutrition(
          foodForNutrition,
          result.identification?.estimated_portion
        );
        const nutritionLatency = Date.now() - nutritionLatencyStart;
        if (result.latency) result.latency.nutrition = nutritionLatency;

        if (nutritionResult) {
          result.nutrition = nutritionResult;
        } else {
          errors.push({ stage: 'nutrition', message: 'Nutrition data unavailable for this food.' });
        }
      }

      // ── Stage 6: AI Explanation (only if identification is reliable) ──
      const canExplain = result.verification_status !== 'CONFLICT' &&
                         result.verification_status !== 'UNCERTAIN';

      if (canExplain && result.identification && result.nutrition) {
        const explanationStart = Date.now();
        const explanation = await this.explanationGenerator.generate({
          foodName: result.identification.food_name,
          nutrition: result.nutrition,
          confidence: result.identification.confidence_score,
          verificationStatus: result.verification_status || 'UNAVAILABLE',
          goal,
        });
        const explanationLatency = Date.now() - explanationStart;
        if (result.latency) result.latency.explanation = explanationLatency;

        if (explanation) {
          result.explanation = explanation;
        }
      } else if (result.verification_status === 'CONFLICT' || result.verification_status === 'UNCERTAIN') {
        // Don't generate confident advice for uncertain identification
        errors.push({
          stage: 'explanation',
          message: "Cannot provide reliable personalized analysis until the food is confirmed.",
        });
      }

      // ── Final status ──
      if (result.status === 'PENDING') {
        result.status = 'SUCCESS';
      }
      result.errors = errors.length > 0 ? errors : undefined;

      return result;
    } catch (error) {
      console.error(`[FoodVerify][${requestId}] Orchestrator error:`, (error as Error).message);
      result.status = 'AI_SERVICE_ERROR';
      result.errors = [
        ...errors,
        { stage: 'orchestrator', message: 'Food analysis encountered an unexpected error.' },
      ];
      return result;
    }
  }

  private getConfidenceLevel(score: number): ConfidenceLevel {
    if (score >= 0.80) return 'HIGH';
    if (score >= 0.50) return 'MODERATE';
    return 'LOW';
  }
}
