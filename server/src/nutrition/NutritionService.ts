import { NutritionRepository } from './NutritionRepository.js';
import { NutritionCalculator } from './NutritionCalculator.js';
import { USDAClient } from './USDAClient.js';
import { GeminiFoodNormalizer } from '../services/gemini/foodNormalizer.js';
import type { NutritionData } from '../../../shared/schemas/index.js';
import type { NutritionRawData } from './NutritionTypes.js';

export class NutritionService {
  private repository = new NutritionRepository();
  private calculator = new NutritionCalculator();
  private usdaClient = new USDAClient();
  private foodNormalizer = new GeminiFoodNormalizer();

  public async getNutrition(
    foodName: string,
    estimatedPortionStr?: string
  ): Promise<NutritionData | null> {
    console.log(`[NutritionService] Lookup request: foodName="${foodName}", estimatedPortionStr="${estimatedPortionStr || 'none'}"`);
    
    let rawFood: NutritionRawData | null = null;
    let source = 'FoodVerify Local Nutrition Database (Development)';

    // Step 1: Search local offline database & cache
    rawFood = this.repository.findFood(foodName);

    if (rawFood) {
      console.log(`[NutritionService] Match found in local repository: "${rawFood.food_name}"`);
      // If it has standard source label or cache source
      if (this.repository.findFood(foodName) === null) {
        // Cached item
        source = 'USDA FoodData Central (Cached)';
      }
    } else {
      console.log(`[NutritionService] No match in local repository. Checking USDA API...`);

      // Step 2: Search configured external USDA API directly
      const usdaResult = await this.usdaClient.getNutrition(foodName);

      if (usdaResult) {
        rawFood = usdaResult;
        source = 'USDA FoodData Central API';
        // Save to cache
        this.repository.saveToCache(usdaResult);
      } else {
        console.log(`[NutritionService] No direct match in USDA. Attempting AI-assisted name normalization...`);

        // Step 3: Use AI to normalize/map name to standard name
        const normalizedName = await this.foodNormalizer.normalize(foodName);

        if (normalizedName && normalizedName.toLowerCase() !== foodName.toLowerCase()) {
          console.log(`[NutritionService] Searching USDA API with normalized name: "${normalizedName}"...`);
          
          // Step 4: Search USDA API again with normalized name
          const normalizedUsdaResult = await this.usdaClient.getNutrition(normalizedName);
          
          if (normalizedUsdaResult) {
            rawFood = normalizedUsdaResult;
            source = `USDA FoodData Central API (Normalized from "${foodName}")`;
            // Save to cache with original requested name to speed up subsequent queries
            this.repository.saveToCache({
              ...normalizedUsdaResult,
              food_name: foodName.toLowerCase() // cache under original name so direct lookup hits next time
            });
          }
        }
      }
    }

    // Step 5 & 6: Return result or fail safely with null (NUTRITION_UNAVAILABLE)
    if (!rawFood) {
      console.warn(`[NutritionService] No nutrition data could be resolved for "${foodName}". Returning null.`);
      return null;
    }

    // Determine target portion weight in grams
    let weightGrams = this.calculator.parsePortionWeight(estimatedPortionStr);
    let isApproximate = true;

    if (weightGrams === null) {
      // Default to 100g if we cannot parse the portion
      weightGrams = 100;
      isApproximate = true;
      console.log(`[NutritionService] Could not parse serving weight from "${estimatedPortionStr || 'none'}". Defaulting to 100g.`);
    } else {
      isApproximate = true; // Image-derived estimates are always marked approximate
    }

    try {
      const calculated = this.calculator.calculateForWeight(
        rawFood,
        weightGrams,
        source,
        isApproximate
      );
      return calculated;
    } catch (err) {
      console.error('[NutritionService] Calculation error:', (err as Error).message);
      return null;
    }
  }
}
