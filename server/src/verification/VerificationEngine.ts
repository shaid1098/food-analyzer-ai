import { GoogleVerificationProvider } from './GoogleVerificationProvider.js';
import type { VerificationProvider } from './VerificationProvider.js';
import type { VerificationResult, VerificationStatus } from '../../../shared/schemas/index.js';

interface VerifyInput {
  imageBase64?: string;
  imageMimeType?: string;
  primaryFoodName?: string;
}

interface VerificationDecision {
  decision: VerificationStatus;
  providerResult?: VerificationResult;
}

export class VerificationEngine {
  private providers: VerificationProvider[];

  constructor() {
    this.providers = [new GoogleVerificationProvider()];
  }

  async verify(input: VerifyInput): Promise<VerificationDecision> {
    // Try each provider
    for (const provider of this.providers) {
      if (!provider.isConfigured()) {
        continue;
      }

      try {
        const result = await provider.verifyImage({
          imageBase64: input.imageBase64,
          imageMimeType: input.imageMimeType,
        });

        if (result.status === 'SUCCESS' && input.primaryFoodName) {
          const decision = this.compareResults(input.primaryFoodName, result.candidate_foods);
          return { decision, providerResult: result };
        }

        if (result.status === 'UNAVAILABLE') {
          return { decision: 'UNAVAILABLE', providerResult: result };
        }

        return { decision: 'UNCERTAIN', providerResult: result };
      } catch (error) {
        console.error(`[FoodVerify][Verification] Provider ${provider.name} failed:`, (error as Error).message);
        continue;
      }
    }

    // No providers configured or all failed
    return {
      decision: 'UNAVAILABLE',
      providerResult: {
        provider: 'none',
        candidate_foods: [],
        confidence: 0,
        evidence: ['No verification providers are currently configured.'],
        status: 'UNAVAILABLE',
        latency: 0,
      },
    };
  }

  /**
   * Compare primary identification with verification candidates.
   * Uses normalized string comparison — not fuzzy matching that could silently
   * map unrelated foods.
   */
  private compareResults(primary: string, candidates: string[]): VerificationStatus {
    if (candidates.length === 0) return 'UNAVAILABLE';

    const normalizedPrimary = this.normalize(primary);

    for (const candidate of candidates) {
      const normalizedCandidate = this.normalize(candidate);

      // Exact match
      if (normalizedPrimary === normalizedCandidate) {
        return 'VERIFIED';
      }

      // Check if one contains the other (e.g., "palak paneer" vs "spinach paneer")
      if (
        normalizedPrimary.includes(normalizedCandidate) ||
        normalizedCandidate.includes(normalizedPrimary)
      ) {
        return 'PARTIAL_AGREEMENT';
      }

      // Check word overlap
      const primaryWords = new Set(normalizedPrimary.split(/\s+/));
      const candidateWords = new Set(normalizedCandidate.split(/\s+/));
      const intersection = [...primaryWords].filter(w => candidateWords.has(w));
      const overlapRatio = intersection.length / Math.max(primaryWords.size, candidateWords.size);

      if (overlapRatio >= 0.5) {
        return 'PARTIAL_AGREEMENT';
      }
    }

    // No match found
    return 'CONFLICT';
  }

  private normalize(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  }
}
