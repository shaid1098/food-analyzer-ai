import { getGeminiClient, isGeminiConfigured } from './geminiClient.js';

export class GeminiFoodNormalizer {
  async normalize(foodName: string): Promise<string> {
    if (!isGeminiConfigured()) {
      return foodName;
    }

    const client = getGeminiClient();
    if (!client) {
      return foodName;
    }

    try {
      const model = client.getGenerativeModel({ model: 'gemini-3.5-flash' });

      const prompt = `You are a food name normalizer. Convert the user's food name input into a standard, simple, generic food description that is suitable for searching in a USDA nutrition database.
Examples:
- "Hyderabadi chicken biryani" -> "chicken biryani"
- "palak" -> "spinach"
- "Ripe organic banana" -> "banana"
- "Guava" -> "guava"
- "Dal Tadka" -> "lentil curry"
- "double cheese beef burger" -> "beef burger"
- "Dragon fruit" -> "dragon fruit"
- "keyboard" -> "keyboard"

Input food name: "${foodName}"

Return ONLY the standardized food name in plain text, with no extra formatting, punctuation, markdown, or explanation.`;

      const result = await model.generateContent([{ text: prompt }]);
      const text = result.response.text();
      
      if (text && text.trim().length > 0) {
        // Strip out any accidental markdown or quotes the model might have returned
        const cleaned = text.replace(/[`"']/g, '').trim().toLowerCase();
        console.log(`[FoodNormalizer] Normalized "${foodName}" -> "${cleaned}"`);
        return cleaned;
      }

      return foodName;
    } catch (error) {
      console.error('[FoodNormalizer] Normalization failed:', (error as Error).message);
      return foodName;
    }
  }
}
