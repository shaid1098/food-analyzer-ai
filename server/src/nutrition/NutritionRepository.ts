import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { NutritionRawData } from './NutritionTypes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class NutritionRepository {
  private foods: Map<string, NutritionRawData> = new Map();
  private cache: Map<string, NutritionRawData> = new Map();
  private cachePath: string = '';

  constructor() {
    this.loadDevelopmentData();
    this.cachePath = path.join(process.cwd(), 'data/nutrition_cache.json');
    this.loadCache();
  }

  private loadDevelopmentData(): void {
    try {
      // Find data/nutrition/foods.json relative to server root
      const possiblePaths = [
        path.join(__dirname, '../../../data/nutrition/foods.json'),
        path.join(process.cwd(), 'data/nutrition/foods.json'),
        path.join(process.cwd(), '../data/nutrition/foods.json'),
      ];

      let dataPath = '';
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          dataPath = p;
          break;
        }
      }

      if (!dataPath) {
        console.error('[NutritionRepository] Could not locate foods.json development dataset.');
        return;
      }

      const raw = fs.readFileSync(dataPath, 'utf-8');
      const parsed = JSON.parse(raw) as NutritionRawData[];
      
      for (const item of parsed) {
        this.foods.set(this.normalizeName(item.food_name), item);
      }
      console.log(`[NutritionRepository] Loaded ${this.foods.size} foods from development dataset.`);
    } catch (error) {
      console.error('[NutritionRepository] Error loading development dataset:', (error as Error).message);
    }
  }

  private loadCache(): void {
    try {
      const dir = path.dirname(this.cachePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.cachePath)) {
        const raw = fs.readFileSync(this.cachePath, 'utf-8');
        const parsed = JSON.parse(raw) as NutritionRawData[];
        for (const item of parsed) {
          this.cache.set(this.normalizeName(item.food_name), item);
        }
        console.log(`[NutritionRepository] Loaded ${this.cache.size} foods from local cache.`);
      }
    } catch (error) {
      console.error('[NutritionRepository] Error loading cache:', (error as Error).message);
    }
  }

  public saveToCache(item: NutritionRawData): void {
    try {
      const normalized = this.normalizeName(item.food_name);
      this.cache.set(normalized, item);

      const items = Array.from(this.cache.values());
      const dir = path.dirname(this.cachePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.cachePath, JSON.stringify(items, null, 2), 'utf-8');
      console.log(`[NutritionRepository] Saved "${item.food_name}" to local cache.`);
    } catch (error) {
      console.error('[NutritionRepository] Error saving to cache:', (error as Error).message);
    }
  }

  public findFood(foodName: string): NutritionRawData | null {
    const normalized = this.normalizeName(foodName);
    
    // 1. Exact match or direct key match in foods.json
    if (this.foods.has(normalized)) {
      return this.foods.get(normalized) || null;
    }

    // 2. Exact match in cache
    if (this.cache.has(normalized)) {
      return this.cache.get(normalized) || null;
    }

    // 3. Exact word search mapping (no loose fuzzy matching that silently maps unrelated foods)
    // e.g. "ripe banana" contains "banana" and matches "banana"
    for (const [key, value] of this.foods.entries()) {
      const keyWords = key.split(/\s+/);
      const inputWords = normalized.split(/\s+/);

      // If the database key is a single word and is present in the input words, it's a match
      if (keyWords.length === 1 && inputWords.includes(key)) {
        return value;
      }
      
      // If the input contains the database key exactly (e.g. "organic chicken biryani" contains "chicken biryani")
      if (normalized.includes(key)) {
        return value;
      }
    }

    // 4. Exact word search mapping in cache
    for (const [key, value] of this.cache.entries()) {
      const keyWords = key.split(/\s+/);
      const inputWords = normalized.split(/\s+/);

      if (keyWords.length === 1 && inputWords.includes(key)) {
        return value;
      }
      
      if (normalized.includes(key)) {
        return value;
      }
    }

    return null;
  }

  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '') // remove punctuation
      .replace(/\s+/g, ' ');       // collapse multiple spaces
  }
}
