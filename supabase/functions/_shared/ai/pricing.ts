// Cost estimate for ai_requests.cost_usd (launch-plan.md §4).
// Defaults = Gemini 3 Flash Preview paid tier (USD per 1M tokens, checked 2026-11-13):
// 0.50 input / 3.00 output. Override per deployment:
//   AI_PRICE_INPUT_PER_MTOK=0.5  AI_PRICE_OUTPUT_PER_MTOK=3
//   AI_PRICES_JSON='{"gemini-2.5-pro":{"in":1.25,"out":10}}'   (per-model overrides)
import { envNumber, envOptional } from '../env.ts';

interface Price {
  in: number;
  out: number;
}

let overrides: Record<string, Price> | null = null;

function modelOverrides(): Record<string, Price> {
  if (overrides) return overrides;
  overrides = {};
  const raw = envOptional('AI_PRICES_JSON');
  if (raw) {
    try {
      overrides = JSON.parse(raw) as Record<string, Price>;
    } catch {
      console.warn('AI_PRICES_JSON is not valid JSON; ignoring');
    }
  }
  return overrides;
}

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const price = modelOverrides()[model] ?? {
    in: envNumber('AI_PRICE_INPUT_PER_MTOK', 0.5),
    out: envNumber('AI_PRICE_OUTPUT_PER_MTOK', 3),
  };
  const usd = (inputTokens * price.in + outputTokens * price.out) / 1_000_000;
  return Math.round(usd * 1_000_000) / 1_000_000;
}
