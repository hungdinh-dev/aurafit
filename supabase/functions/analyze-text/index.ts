// POST /functions/v1/analyze-text  (user JWT)
// Body: { text: "2 trứng luộc, 1 bát cơm", meal_slot? }
// Text-only analysis with the fast model (cheapest AI path, nutrition.md §3 #4).
// Same response shape as analyze-meal. Soft daily limit AI_DAILY_TEXT_LIMIT (default 50).
import { z } from 'zod';
import { AiProviderError, getAiProvider, MEAL_SLOTS, mealTotals } from '../_shared/ai/index.ts';
import { countRequestsToday, getUserAiContext, logAiRequest } from '../_shared/ai/usage.ts';
import { envInt } from '../_shared/env.ts';
import { HttpError, json, readJson, serve } from '../_shared/http.ts';
import { createAdminClient, requireUser } from '../_shared/supabase.ts';

const BodySchema = z.object({
  text: z.string().trim().min(2).max(500),
  meal_slot: z.enum(MEAL_SLOTS).optional(),
});

serve(async (req) => {
  const { user } = await requireUser(req);
  const body = await readJson(req, BodySchema);

  const admin = createAdminClient();
  const ai = getAiProvider();
  const ctx = await getUserAiContext(admin, user.id);
  const model = ai.modelFor('fast');

  const limit = envInt('AI_DAILY_TEXT_LIMIT', 50);
  const used = await countRequestsToday(admin, user.id, ctx.timezone, ['meal_text']);
  if (used >= limit) {
    await logAiRequest(admin, { userId: user.id, kind: 'meal_text', status: 'quota_exceeded', usage: { provider: ai.name, model } });
    throw new HttpError(429, 'quota_exceeded', 'Daily text analysis limit reached', { used, limit });
  }

  try {
    const result = await ai.analyzeMealText({ text: body.text, locale: ctx.locale, mealSlot: body.meal_slot, tier: 'fast' });
    const aiRequestId = await logAiRequest(admin, { userId: user.id, kind: 'meal_text', status: 'ok', usage: result.usage });
    return json({
      ai_request_id: aiRequestId,
      model: result.usage.model,
      analysis: result.data,
      totals: mealTotals(result.data.items),
      low_confidence: result.data.overall_confidence < 0.6,
      quota: { used: used + 1, limit },
    });
  } catch (err) {
    if (err instanceof AiProviderError) {
      await logAiRequest(admin, {
        userId: user.id, kind: 'meal_text', status: 'error', error: `${err.code}: ${err.message}`,
        usage: { provider: ai.name, model, ...err.usage },
      });
      throw new HttpError(err.code === 'config' ? 500 : 502, 'ai_failed', 'Meal analysis failed, please try again');
    }
    throw err;
  }
});
