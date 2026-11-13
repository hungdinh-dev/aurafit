// Gemini implementation of AiProvider, using the REST API (generateContent) with
// structured JSON output (responseMimeType + responseSchema).
// Docs: https://ai.google.dev/api/generate-content
import {
  MEAL_RESPONSE_SCHEMA,
  mealImageUserPrompt,
  mealSystemPrompt,
  mealTextUserPrompt,
} from '../prompts/meal-analysis.ts';
import { estimateCostUsd } from './pricing.ts';
import {
  type AiProvider,
  AiProviderError,
  type AiResult,
  type AiUsage,
  type Locale,
  type MealAnalysis,
  MealAnalysisSchema,
  type MealImageInput,
  type MealTextInput,
  type ModelTier,
} from './types.ts';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiOptions {
  apiKey: string;
  fastModel: string;
  strongModel?: string;
  timeoutMs?: number;
}

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

interface GenerateContentResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
  };
  modelVersion?: string;
}

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini';

  constructor(private readonly opts: GeminiOptions) {}

  modelFor(tier: ModelTier): string {
    return tier === 'strong' && this.opts.strongModel ? this.opts.strongModel : this.opts.fastModel;
  }

  analyzeMealImage(input: MealImageInput): Promise<AiResult<MealAnalysis>> {
    return this.generate(this.modelFor(input.tier ?? 'fast'), input.locale, [
      { text: mealImageUserPrompt({ mealSlot: input.mealSlot, hint: input.hint }) },
      { inlineData: { mimeType: input.mimeType, data: input.imageBase64 } },
    ]);
  }

  analyzeMealText(input: MealTextInput): Promise<AiResult<MealAnalysis>> {
    return this.generate(this.modelFor(input.tier ?? 'fast'), input.locale, [
      { text: mealTextUserPrompt({ text: input.text, mealSlot: input.mealSlot }) },
    ]);
  }

  private async generate(model: string, locale: Locale, parts: Part[]): Promise<AiResult<MealAnalysis>> {
    const body = {
      systemInstruction: { parts: [{ text: mealSystemPrompt(locale) }] },
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: MEAL_RESPONSE_SCHEMA,
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    };

    const started = performance.now();
    const usage: AiUsage = { provider: this.name, model, inputTokens: 0, outputTokens: 0, latencyMs: 0, costUsd: 0 };
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.opts.apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.opts.timeoutMs ?? 45_000),
      });
    } catch (err) {
      usage.latencyMs = Math.round(performance.now() - started);
      const timeout = err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError');
      throw new AiProviderError(timeout ? 'gemini timeout' : `gemini network error: ${String(err)}`,
        timeout ? 'timeout' : 'upstream', usage);
    }
    usage.latencyMs = Math.round(performance.now() - started);

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      throw new AiProviderError(`gemini HTTP ${res.status}: ${detail}`, 'upstream', usage);
    }

    const payload = (await res.json()) as GenerateContentResponse;
    usage.inputTokens = payload.usageMetadata?.promptTokenCount ?? 0;
    // Thinking tokens are billed as output tokens.
    usage.outputTokens = (payload.usageMetadata?.candidatesTokenCount ?? 0) + (payload.usageMetadata?.thoughtsTokenCount ?? 0);
    usage.costUsd = estimateCostUsd(model, usage.inputTokens, usage.outputTokens);

    if (payload.promptFeedback?.blockReason) {
      throw new AiProviderError(`gemini blocked: ${payload.promptFeedback.blockReason}`, 'blocked', usage);
    }
    const candidate = payload.candidates?.[0];
    const text = (candidate?.content?.parts ?? [])
      .filter((p) => !p.thought)
      .map((p) => p.text ?? '')
      .join('')
      .trim();
    if (!text) {
      throw new AiProviderError(`gemini empty response (finishReason=${candidate?.finishReason ?? 'n/a'})`,
        candidate?.finishReason === 'SAFETY' ? 'blocked' : 'invalid_output', usage);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new AiProviderError('gemini returned non-JSON output', 'invalid_output', usage);
    }
    const result = MealAnalysisSchema.safeParse(parsed);
    if (!result.success) {
      throw new AiProviderError(`gemini output failed validation: ${result.error.issues[0]?.message ?? ''}`,
        'invalid_output', usage);
    }
    return { data: result.data, usage };
  }
}
