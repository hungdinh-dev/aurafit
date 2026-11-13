// AiProvider factory. Provider and models are configuration (supabase secrets):
//   AI_PROVIDER=gemini (default)   GEMINI_API_KEY=…
//   AI_MODEL_FAST=gemini-flash-latest   AI_MODEL_STRONG=(optional, used for "Phân tích lại")
import { env, envInt, envOptional } from '../env.ts';
import { GeminiProvider } from './gemini.ts';
import { type AiProvider, AiProviderError } from './types.ts';

export * from './types.ts';

let cached: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (cached) return cached;
  const provider = env('AI_PROVIDER', 'gemini');
  switch (provider) {
    case 'gemini': {
      const apiKey = envOptional('GEMINI_API_KEY');
      if (!apiKey) throw new AiProviderError('GEMINI_API_KEY is not set', 'config');
      cached = new GeminiProvider({
        apiKey,
        fastModel: env('AI_MODEL_FAST', 'gemini-flash-latest'),
        strongModel: envOptional('AI_MODEL_STRONG'),
        timeoutMs: envInt('AI_TIMEOUT_MS', 45_000),
      });
      return cached;
    }
    default:
      throw new AiProviderError(`unsupported AI_PROVIDER "${provider}"`, 'config');
  }
}
