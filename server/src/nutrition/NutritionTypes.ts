import { NutritionData } from '../../../shared/schemas/index.js';

export interface NutritionRawData {
  food_name: string;
  serving_size: number; // reference serving size (e.g. 100 for 100g)
  serving_unit: string; // reference serving unit (e.g. 'g', 'ml')
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  vitamin_a?: number;
  vitamin_c?: number;
  vitamin_d?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
}

export interface NutritionProvider {
  name: string;
  isConfigured(): boolean;
  getNutrition(foodName: string): Promise<NutritionData | null>;
}
