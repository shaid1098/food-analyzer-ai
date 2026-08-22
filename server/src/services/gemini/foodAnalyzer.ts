import { getGeminiClient, isGeminiConfigured } from './geminiClient.js';
import { FOOD_ANALYSIS_PROMPT } from './prompts.js';
import { FoodIdentificationSchema } from '../../../../shared/schemas/index.js';
import type { FoodIdentification } from '../../../../shared/schemas/index.js';

interface AnalyzeInput {
  imageBase64?: string;
  imageMimeType?: string;
  foodName?: string;
}

interface AnalyzeResult {
  status: 'SUCCESS' | 'NO_FOOD_DETECTED' | 'ERROR';
  data?: FoodIdentification;
  error?: string;
}

const TIMEOUT_MS = 30000; // 30 second timeout
const MAX_RETRIES = 2;

export class GeminiFoodAnalyzer {
  async analyze(input: AnalyzeInput): Promise<AnalyzeResult> {
    if (!isGeminiConfigured()) {
      return {
        status: 'ERROR',
        error: 'Gemini API is not configured. Set GEMINI_API_KEY in environment variables.',
      };
    }

    const client = getGeminiClient();
    if (!client) {
      return { status: 'ERROR', error: 'Failed to initialize Gemini client.' };
    }

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await this.callGemini(client, input);
        return result;
      } catch (error) {
        const err = error as Error;
        const isTransient = this.isTransientError(err);

        if (isTransient && attempt < MAX_RETRIES) {
          console.warn(`[FoodVerify][Gemini] Transient error (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${err.message}`);
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
          continue;
        }

        // Non-transient or final attempt
        console.error(`[FoodVerify][Gemini] Analysis failed: ${err.message}`);
        return {
          status: 'ERROR',
          error: this.sanitizeError(err),
        };
      }
    }

    return { status: 'ERROR', error: 'Gemini analysis failed after retries.' };
  }

  private async callGemini(client: any, input: AnalyzeInput): Promise<AnalyzeResult> {
    const model = client.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const parts: any[] = [{ text: FOOD_ANALYSIS_PROMPT }];

    // Add image if provided
    if (input.imageBase64 && input.imageMimeType) {
      parts.push({
        inlineData: {
          mimeType: input.imageMimeType,
          data: input.imageBase64,
        },
      });
      parts.push({ text: 'Analyze this food image.' });
    }

    // Add food name if provided
    if (input.foodName) {
      parts.push({ text: `The user says this food is: "${input.foodName}". Verify and analyze.` });
    }

    // Call with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const result = await model.generateContent(parts);
      clearTimeout(timeout);

      const response = result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        return { status: 'ERROR', error: 'Gemini returned an empty response.' };
      }

      // Extract JSON from response (handle markdown code blocks)
      const jsonStr = this.extractJSON(text);
      if (!jsonStr) {
        return { status: 'ERROR', error: 'Gemini response did not contain valid JSON.' };
      }

      // Parse JSON
      let parsed: any;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        return { status: 'ERROR', error: 'Gemini returned malformed JSON.' };
      }

      // Check for no food detected
      if (parsed.no_food_detected === true) {
        return { status: 'NO_FOOD_DETECTED' };
      }

      // Validate with Zod
      const validated = FoodIdentificationSchema.safeParse(parsed);
      if (!validated.success) {
        console.error('[FoodVerify][Gemini] Zod validation failed:', validated.error.issues);
        return {
          status: 'ERROR',
          error: `Gemini response failed validation: ${validated.error.issues.map(i => i.message).join(', ')}`,
        };
      }

      // Normalize confidence to 0.0-1.0
      const data = validated.data;
      data.confidence_score = Math.max(0, Math.min(1, data.confidence_score));
      data.needs_verification = data.confidence_score < 0.80;

      return { status: 'SUCCESS', data };
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractJSON(text: string): string | null {
    // Try to extract JSON from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Try to find raw JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    return null;
  }

  private isTransientError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('503') ||
      message.includes('500') ||
      message.includes('temporarily') ||
      message.includes('econnreset') ||
      message.includes('network')
    );
  }

  private sanitizeError(error: Error): string {
    const message = error.message;
    // Never expose API keys
    if (message.includes('API key') || message.includes('api_key') || message.includes('401')) {
      return 'Gemini authentication failed. Check API key configuration.';
    }
    if (message.includes('429') || message.includes('rate limit')) {
      return 'Gemini rate limit reached. Please try again shortly.';
    }
    if (message.includes('timeout') || message.includes('abort')) {
      return 'Gemini request timed out. Please try again.';
    }
    return 'Food identification is temporarily unavailable.';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
