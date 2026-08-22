import { getGeminiClient, isGeminiConfigured } from './geminiClient.js';
import { EXPLANATION_PROMPT } from './prompts.js';
import { AIExplanationSchema } from '../../../../shared/schemas/index.js';
import type { AIExplanation, NutritionData, VerificationStatus, UserGoal } from '../../../../shared/schemas/index.js';

interface ExplanationInput {
  foodName: string;
  nutrition: NutritionData;
  confidence: number;
  verificationStatus: VerificationStatus;
  goal: UserGoal;
}

const GOAL_LABELS: Record<UserGoal, string> = {
  WEIGHT_LOSS: 'Weight Loss',
  MUSCLE_BUILDING: 'Muscle Building',
  WEIGHT_GAIN: 'Weight Gain',
  MAINTENANCE: 'Maintenance',
  GENERAL_HEALTHY_EATING: 'General Healthy Eating',
};

export class GeminiExplanationGenerator {
  async generate(input: ExplanationInput): Promise<AIExplanation | null> {
    if (!isGeminiConfigured()) {
      return null;
    }

    const client = getGeminiClient();
    if (!client) return null;

    try {
      const model = client.getGenerativeModel({ model: 'gemini-3.5-flash' });

      const dataPrompt = `
Food: ${input.foodName}
Confidence: ${(input.confidence * 100).toFixed(0)}%
Verification: ${input.verificationStatus}
User Goal: ${GOAL_LABELS[input.goal]}

VERIFIED NUTRITION DATA (from trusted database — do NOT modify these values):
- Serving: ${input.nutrition.serving_size}${input.nutrition.serving_unit}
- Calories: ${input.nutrition.calories} kcal
- Protein: ${input.nutrition.protein}g
- Carbohydrates: ${input.nutrition.carbohydrates}g
- Fat: ${input.nutrition.fat}g
- Fiber: ${input.nutrition.fiber}g
- Sugar: ${input.nutrition.sugar}g
- Sodium: ${input.nutrition.sodium}mg
${input.nutrition.vitamin_a ? `- Vitamin A: ${input.nutrition.vitamin_a}μg` : ''}
${input.nutrition.vitamin_c ? `- Vitamin C: ${input.nutrition.vitamin_c}mg` : ''}
${input.nutrition.iron ? `- Iron: ${input.nutrition.iron}mg` : ''}
${input.nutrition.calcium ? `- Calcium: ${input.nutrition.calcium}mg` : ''}
${input.nutrition.potassium ? `- Potassium: ${input.nutrition.potassium}mg` : ''}

Provide your analysis as JSON based on the user's goal of "${GOAL_LABELS[input.goal]}".`;

      const result = await model.generateContent([
        { text: EXPLANATION_PROMPT },
        { text: dataPrompt },
      ]);

      const text = result.response.text();
      if (!text) return null;

      // Extract JSON
      const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      const validated = AIExplanationSchema.safeParse(parsed);
      if (!validated.success) {
        console.error('[FoodVerify][Explanation] Zod validation failed:', validated.error.issues);
        return null;
      }

      return validated.data;
    } catch (error) {
      console.error('[FoodVerify][Explanation] Generation failed:', (error as Error).message);
      return null;
    }
  }
}
