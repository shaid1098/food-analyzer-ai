import { FoodAnalysisOrchestrator } from '../../orchestrator/FoodAnalysisOrchestrator.js';
import { EvaluationStore } from './EvaluationStore.js';
import type { EvaluationTestCase, EvaluationResult } from '../../../../shared/schemas/index.js';

export class EvaluationHarness {
  private orchestrator = new FoodAnalysisOrchestrator();
  private store = new EvaluationStore();

  private testCases: EvaluationTestCase[] = [
    { id: '01', input_food: 'banana', input_type: 'name', expected_food: 'banana' },
    { id: '02', input_food: 'apple', input_type: 'name', expected_food: 'apple' },
    { id: '03', input_food: 'orange', input_type: 'name', expected_food: 'orange' },
    { id: '04', input_food: 'tomato', input_type: 'name', expected_food: 'tomato' },
    { id: '05', input_food: 'potato', input_type: 'name', expected_food: 'potato' },
    { id: '06', input_food: 'carrot', input_type: 'name', expected_food: 'carrot' },
    { id: '07', input_food: 'samosa', input_type: 'name', expected_food: 'samosa' },
    { id: '08', input_food: 'chicken biryani', input_type: 'name', expected_food: 'chicken biryani' },
    { id: '09', input_food: 'dal', input_type: 'name', expected_food: 'dal' },
    { id: '10', input_food: 'paneer', input_type: 'name', expected_food: 'paneer' },
    { id: '11', input_food: 'palak paneer', input_type: 'name', expected_food: 'palak paneer' },
    { id: '12', input_food: 'pizza', input_type: 'name', expected_food: 'pizza' },
    { id: '13', input_food: 'burger', input_type: 'name', expected_food: 'burger' },
    { id: '14', input_food: 'salad', input_type: 'name', expected_food: 'salad' },
    { id: '15', input_food: 'rice', input_type: 'name', expected_food: 'rice' },
    { id: '16', input_food: 'roti', input_type: 'name', expected_food: 'roti' },
    { id: '17', input_food: 'idli', input_type: 'name', expected_food: 'idli' },
    { id: '18', input_food: 'dosa', input_type: 'name', expected_food: 'dosa' },
    { id: '19', input_food: 'keyboard', input_type: 'name', expected_food: 'unknown' }, // Unknown food
    { id: '20', input_food: 'blurry_image', input_type: 'image', expected_food: 'bad_image' }, // Blurry/bad image test
  ];

  public async runAll(): Promise<EvaluationResult[]> {
    const results: EvaluationResult[] = [];
    console.log(`[EvaluationHarness] Starting evaluation of ${this.testCases.length} test cases...`);

    for (const tc of this.testCases) {
      const start = Date.now();
      let geminiResult: string | undefined;
      let geminiConfidence: number | undefined;
      let fallbackTriggered = false;
      let verificationResult: string | undefined;
      let finalResult: string | undefined;
      let correct = false;
      let failureReason: string | undefined;

      try {
        if (tc.input_type === 'name') {
          // Run food name analysis
          const analysis = await this.orchestrator.analyze({
            requestId: `eval-${tc.id}`,
            foodName: tc.input_food,
            goal: 'GENERAL_HEALTHY_EATING',
          });

          geminiResult = analysis.identification?.food_name;
          geminiConfidence = analysis.identification?.confidence_score;
          fallbackTriggered = analysis.verification !== undefined;
          verificationResult = analysis.verification?.candidate_foods?.[0];
          finalResult = analysis.status;

          // Check correctness
          if (tc.expected_food === 'unknown') {
            // For unknown food, expect a status like NUTRITION_UNAVAILABLE or failure
            correct = analysis.status === 'NUTRITION_UNAVAILABLE' || analysis.nutrition === undefined;
            if (!correct) failureReason = 'Expected nutrition to be unavailable for non-food item';
          } else {
            correct = analysis.status === 'SUCCESS' && 
                      analysis.identification?.food_name.toLowerCase().includes(tc.expected_food.toLowerCase()) === true;
            if (!correct) {
              failureReason = `Expected food "${tc.expected_food}" but got "${geminiResult || 'none'}" with status "${analysis.status}"`;
            }
          }
        } else {
          // Blurry image test (send invalid base64 data to test validation)
          const analysis = await this.orchestrator.analyze({
            requestId: `eval-${tc.id}`,
            imageBase64: 'invalid_short_base64', // triggers INVALID check
            imageMimeType: 'image/jpeg',
            goal: 'GENERAL_HEALTHY_EATING',
          });

          finalResult = analysis.status;
          correct = analysis.status === 'BAD_IMAGE';
          if (!correct) {
            failureReason = `Expected status BAD_IMAGE but got "${analysis.status}"`;
          }
        }
      } catch (err) {
        failureReason = (err as Error).message;
        correct = false;
      }

      const latency = Date.now() - start;

      results.push({
        test_case_id: tc.id,
        expected_food: tc.expected_food,
        gemini_result: geminiResult,
        gemini_confidence: geminiConfidence,
        fallback_triggered: fallbackTriggered,
        verification_result: verificationResult,
        final_result: finalResult,
        correct,
        latency,
        failure_reason: failureReason,
        timestamp: new Date().toISOString(),
      });

      console.log(`[EvaluationHarness] Case ${tc.id}: expected="${tc.expected_food}" result="${geminiResult || 'none'}" correct=${correct} (${latency}ms)`);
    }

    this.store.saveResults(results);
    return results;
  }
}
