import type { VerificationResult } from '../../../shared/schemas/index.js';
import type { VerificationProvider } from './VerificationProvider.js';

/**
 * Google Verification Provider
 * 
 * This is a provider abstraction for a legitimate Google visual-search API.
 * It does NOT scrape Google Lens or pretend a webpage is an API.
 * 
 * When VERIFICATION_API_KEY is configured with valid credentials for a
 * supported Google visual search API, this provider will call it.
 * 
 * Without valid credentials, it returns UNAVAILABLE — never fake results.
 */
export class GoogleVerificationProvider implements VerificationProvider {
  readonly name = 'Google Verification';

  isConfigured(): boolean {
    return !!process.env.VERIFICATION_API_KEY;
  }

  async verifyImage(input: {
    imageBase64?: string;
    imageMimeType?: string;
  }): Promise<VerificationResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.name,
        candidate_foods: [],
        confidence: 0,
        evidence: [],
        status: 'UNAVAILABLE',
        latency: 0,
      };
    }

    // When a legitimate API is configured, the actual API call would go here.
    // For now, return UNAVAILABLE since no real API is connected.
    // This is intentionally honest — we do not fabricate verification results.
    const start = Date.now();

    try {
      // TODO: Implement actual Google Visual Search API call when credentials are available
      // The API call would use process.env.VERIFICATION_API_KEY
      // Example: const response = await googleVisualSearchAPI.search(input.imageBase64);

      return {
        provider: this.name,
        candidate_foods: [],
        confidence: 0,
        evidence: ['Verification API integration pending — requires legitimate API credentials'],
        status: 'UNAVAILABLE',
        latency: Date.now() - start,
      };
    } catch (error) {
      console.error(`[FoodVerify][${this.name}] Verification failed:`, (error as Error).message);
      return {
        provider: this.name,
        candidate_foods: [],
        confidence: 0,
        evidence: [],
        status: 'ERROR',
        latency: Date.now() - start,
      };
    }
  }
}
