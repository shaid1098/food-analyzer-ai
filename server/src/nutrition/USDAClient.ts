import type { NutritionRawData } from './NutritionTypes.js';

export class USDAClient {
  private readonly baseUrl = 'https://api.nal.usda.gov/fdc/v1/foods/search';

  async getNutrition(foodName: string): Promise<NutritionRawData | null> {
    const apiKey = process.env.NUTRITION_API_KEY || 'DEMO_KEY';
    const params = new URLSearchParams({
      api_key: apiKey,
      query: foodName,
      pageSize: '1',
      dataType: 'Foundation,SR Legacy,Branded',
    });

    const url = `${this.baseUrl}?${params.toString()}`;
    console.log(`[USDAClient] Searching USDA FDC for "${foodName}"...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        if (res.status === 429) {
          console.warn('[USDAClient] Rate limit reached on USDA API (429).');
        } else {
          console.error(`[USDAClient] USDA API search returned status ${res.status}: ${res.statusText}`);
        }
        return null;
      }

      const data = await res.json();
      if (!data || !data.foods || data.foods.length === 0) {
        console.log(`[USDAClient] No search results found on USDA FDC for "${foodName}".`);
        return null;
      }

      const foodItem = data.foods[0];
      console.log(`[USDAClient] Best match: "${foodItem.description}" (FDC ID: ${foodItem.fdcId})`);

      const nutrients = foodItem.foodNutrients || [];

      // Helper function to extract nutrient amount by FDC Nutrient IDs
      const getVal = (ids: number[]): number => {
        const nut = nutrients.find((n: any) => {
          const id = n.nutrientId || (n.nutrient && n.nutrient.id);
          return ids.includes(id);
        });
        return nut ? (nut.value !== undefined ? nut.value : nut.amount || 0) : 0;
      };

      // Extract and map core nutrients (reference standard is always 100g)
      // Energy/Calories (IDs: 1008, 2047, 2048)
      const calories = getVal([1008, 2047, 2048]);
      // Protein (ID: 1003)
      const protein = getVal([1003]);
      // Total lipid (fat) (ID: 1004)
      const fat = getVal([1004]);
      // Carbohydrate (ID: 1005)
      const carbohydrates = getVal([1005]);
      // Fiber (ID: 1079)
      const fiber = getVal([1079]);
      // Total Sugar (ID: 2000, 1010)
      const sugar = getVal([2000, 1010]);
      // Sodium (ID: 1093)
      const sodium = getVal([1093]);

      // Micro nutrients (optional)
      const vitamin_a = getVal([1106, 1104]) || undefined;
      const vitamin_c = getVal([1162]) || undefined;
      const calcium = getVal([1087]) || undefined;
      const iron = getVal([1089]) || undefined;
      const potassium = getVal([1092]) || undefined;

      const rawData: NutritionRawData = {
        food_name: foodItem.description.toLowerCase(),
        serving_size: 100, // USDA returns per 100g standard reference
        serving_unit: 'g',
        calories,
        protein,
        carbohydrates,
        fat,
        fiber,
        sugar,
        sodium,
        vitamin_a,
        vitamin_c,
        calcium,
        iron,
        potassium,
      };

      return rawData;
    } catch (error) {
      clearTimeout(timeout);
      console.error(`[USDAClient] Search failed for "${foodName}":`, (error as Error).message);
      return null;
    }
  }
}
