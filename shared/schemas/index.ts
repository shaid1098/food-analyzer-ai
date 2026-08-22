import { z } from 'zod';

// ============================================================
// Enums
// ============================================================

export const ConfidenceLevel = z.enum(['HIGH', 'MODERATE', 'LOW']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevel>;

export const VerificationStatus = z.enum([
  'VERIFIED',
  'PARTIAL_AGREEMENT',
  'CONFLICT',
  'UNAVAILABLE',
  'UNCERTAIN',
  'REFUSED',
]);
export type VerificationStatus = z.infer<typeof VerificationStatus>;

export const AnalysisStatus = z.enum([
  'SUCCESS',
  'NO_FOOD_DETECTED',
  'AI_SERVICE_ERROR',
  'VERIFICATION_UNAVAILABLE',
  'NUTRITION_UNAVAILABLE',
  'BAD_IMAGE',
  'CONFLICT',
  'REFUSED',
  'PENDING',
]);
export type AnalysisStatus = z.infer<typeof AnalysisStatus>;

export const UserGoal = z.enum([
  'WEIGHT_LOSS',
  'MUSCLE_BUILDING',
  'WEIGHT_GAIN',
  'MAINTENANCE',
  'GENERAL_HEALTHY_EATING',
]);
export type UserGoal = z.infer<typeof UserGoal>;

export const VerificationProviderStatus = z.enum([
  'SUCCESS',
  'LOW_CONFIDENCE',
  'UNAVAILABLE',
  'TIMEOUT',
  'ERROR',
]);
export type VerificationProviderStatus = z.infer<typeof VerificationProviderStatus>;

// ============================================================
// Food Analysis Request
// ============================================================

export const FoodAnalysisRequestSchema = z.object({
  image: z.string().optional(), // base64 encoded image
  foodName: z.string().optional(),
  goal: UserGoal,
}).refine(
  (data) => data.image || data.foodName,
  { message: 'Either an image or food name must be provided' }
);
export type FoodAnalysisRequest = z.infer<typeof FoodAnalysisRequestSchema>;

// ============================================================
// Gemini Food Identification
// ============================================================

export const FoodIdentificationSchema = z.object({
  food_name: z.string(),
  food_category: z.string(),
  confidence_score: z.number().min(0).max(1),
  visible_components: z.array(z.string()),
  estimated_portion: z.string(),
  possible_alternatives: z.array(z.string()),
  needs_verification: z.boolean(),
  reasoning_summary: z.string(),
});
export type FoodIdentification = z.infer<typeof FoodIdentificationSchema>;

// ============================================================
// Verification Result
// ============================================================

export const VerificationResultSchema = z.object({
  provider: z.string(),
  candidate_foods: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()),
  status: VerificationProviderStatus,
  latency: z.number(),
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

// ============================================================
// Nutrition Data
// ============================================================

export const NutritionDataSchema = z.object({
  food_name: z.string(),
  serving_size: z.number(),
  serving_unit: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbohydrates: z.number(),
  fat: z.number(),
  fiber: z.number(),
  sugar: z.number(),
  sodium: z.number(),
  vitamin_a: z.number().optional(),
  vitamin_c: z.number().optional(),
  vitamin_d: z.number().optional(),
  calcium: z.number().optional(),
  iron: z.number().optional(),
  potassium: z.number().optional(),
  source: z.string(),
  is_approximate: z.boolean(),
});
export type NutritionData = z.infer<typeof NutritionDataSchema>;

// ============================================================
// AI Explanation
// ============================================================

export const AIExplanationSchema = z.object({
  summary: z.string(),
  nutritional_highlights: z.array(z.string()),
  potential_benefits: z.array(z.string()),
  potential_concerns: z.array(z.string()),
  goal_alignment: z.string(),
  recommendation: z.string(),
});
export type AIExplanation = z.infer<typeof AIExplanationSchema>;

// ============================================================
// Image Quality
// ============================================================

export const ImageQualitySchema = z.object({
  status: z.enum(['GOOD', 'ACCEPTABLE', 'POOR', 'INVALID']),
  message: z.string(),
});
export type ImageQuality = z.infer<typeof ImageQualitySchema>;

// ============================================================
// Final Food Analysis (complete response)
// ============================================================

export const FinalFoodAnalysisSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  status: AnalysisStatus,
  
  // Input
  input: z.object({
    had_image: z.boolean(),
    food_name_input: z.string().optional(),
    goal: UserGoal,
  }),

  // Image quality
  image_quality: ImageQualitySchema.optional(),
  
  // Primary identification (Gemini)
  identification: FoodIdentificationSchema.optional(),
  confidence_level: ConfidenceLevel.optional(),
  
  // Independent verification
  verification: VerificationResultSchema.optional(),
  verification_status: VerificationStatus.optional(),
  
  // Nutrition
  nutrition: NutritionDataSchema.optional(),
  
  // AI Explanation
  explanation: AIExplanationSchema.optional(),
  
  // Errors
  errors: z.array(z.object({
    stage: z.string(),
    message: z.string(),
    code: z.string().optional(),
  })).optional(),
  
  // Timing
  latency: z.object({
    total: z.number(),
    gemini: z.number().optional(),
    verification: z.number().optional(),
    nutrition: z.number().optional(),
    explanation: z.number().optional(),
  }).optional(),
});
export type FinalFoodAnalysis = z.infer<typeof FinalFoodAnalysisSchema>;

// ============================================================
// Evaluation
// ============================================================

export const EvaluationTestCaseSchema = z.object({
  id: z.string(),
  input_food: z.string(),
  input_type: z.enum(['image', 'name']),
  expected_food: z.string(),
});
export type EvaluationTestCase = z.infer<typeof EvaluationTestCaseSchema>;

export const EvaluationResultSchema = z.object({
  test_case_id: z.string(),
  expected_food: z.string(),
  gemini_result: z.string().optional(),
  gemini_confidence: z.number().optional(),
  fallback_triggered: z.boolean(),
  verification_result: z.string().optional(),
  final_result: z.string().optional(),
  correct: z.boolean(),
  latency: z.number(),
  failure_reason: z.string().optional(),
  timestamp: z.string(),
});
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

export const EvaluationMetricsSchema = z.object({
  total_tests: z.number(),
  correct: z.number(),
  incorrect: z.number(),
  accuracy: z.number(),
  gemini_success_rate: z.number(),
  fallback_rate: z.number(),
  verification_agreement_rate: z.number(),
  conflict_rate: z.number(),
  refusal_rate: z.number(),
  average_latency: z.number(),
  api_error_count: z.number(),
});
export type EvaluationMetrics = z.infer<typeof EvaluationMetricsSchema>;

// ============================================================
// System Status
// ============================================================

export const SystemStatusSchema = z.object({
  gemini: z.enum(['connected', 'not_connected', 'error']),
  verification: z.enum(['connected', 'not_connected', 'error']),
  nutrition: z.enum(['connected', 'not_connected', 'error']),
  database: z.enum(['ready', 'not_ready', 'error']),
});
export type SystemStatus = z.infer<typeof SystemStatusSchema>;

// ============================================================
// API Error
// ============================================================

export const APIErrorSchema = z.object({
  status: z.string(),
  message: z.string(),
  code: z.number().optional(),
});
export type APIError = z.infer<typeof APIErrorSchema>;
