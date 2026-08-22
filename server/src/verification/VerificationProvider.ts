import type { VerificationResult } from '../../../shared/schemas/index.js';

export interface VerificationProvider {
  readonly name: string;
  isConfigured(): boolean;
  verifyImage(input: {
    imageBase64?: string;
    imageMimeType?: string;
  }): Promise<VerificationResult>;
}
