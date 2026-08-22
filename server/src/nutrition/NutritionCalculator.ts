import type { NutritionRawData } from './NutritionTypes.js';
import type { NutritionData } from '../../../shared/schemas/index.js';

export class NutritionCalculator {
  /**
   * Calculate nutritional values based on target weight in grams.
   * Target weight must be greater than 0.
   */
  public calculateForWeight(
    rawFood: NutritionRawData,
    targetWeightGrams: number,
    source: string,
    isApproximate: boolean
  ): NutritionData {
    if (targetWeightGrams <= 0) {
      throw new Error('Serving size must be greater than 0 grams.');
    }

    const factor = targetWeightGrams / rawFood.serving_size;

    return {
      food_name: rawFood.food_name,
      serving_size: targetWeightGrams,
      serving_unit: 'g',
      calories: Math.round(rawFood.calories * factor),
      protein: Math.round(rawFood.protein * factor * 10) / 10,
      carbohydrates: Math.round(rawFood.carbohydrates * factor * 10) / 10,
      fat: Math.round(rawFood.fat * factor * 10) / 10,
      fiber: Math.round(rawFood.fiber * factor * 10) / 10,
      sugar: Math.round(rawFood.sugar * factor * 10) / 10,
      sodium: Math.round(rawFood.sodium * factor),
      
      // Optional fields
      vitamin_a: rawFood.vitamin_a !== undefined ? Math.round(rawFood.vitamin_a * factor) : undefined,
      vitamin_c: rawFood.vitamin_c !== undefined ? Math.round(rawFood.vitamin_c * factor) : undefined,
      vitamin_d: rawFood.vitamin_d !== undefined ? Math.round(rawFood.vitamin_d * factor) : undefined,
      calcium: rawFood.calcium !== undefined ? Math.round(rawFood.calcium * factor) : undefined,
      iron: rawFood.iron !== undefined ? Math.round(rawFood.iron * factor * 10) / 10 : undefined,
      potassium: rawFood.potassium !== undefined ? Math.round(rawFood.potassium * factor) : undefined,
      
      source,
      is_approximate: isApproximate,
    };
  }

  /**
   * Helper to parse a portion string (e.g. "1 medium banana (~120g)", "150g", "200 grams")
   * to extract the numerical weight in grams.
   */
  public parsePortionWeight(portionStr: string | undefined): number | null {
    if (!portionStr) return null;

    // Look for patterns like: ~120g, 120 g, 120g, 120grams, etc.
    const match = portionStr.match(/(?:~|\b)(\d+)\s*(?:g|gram|grams)\b/i);
    if (match && match[1]) {
      const val = parseInt(match[1], 10);
      if (val > 0) return val;
    }

    return null;
  }
}
