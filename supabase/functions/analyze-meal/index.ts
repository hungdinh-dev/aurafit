// POST /functions/v1/analyze-meal  (user JWT)
// Body: { photo_path: "<user_id>/<file>.jpg", meal_slot?, hint?, reanalyze? }
// The photo must already be uploaded to the private `meal-photos` bucket (compressed ~1024 px).
// Returns the AI estimate (items, portions, 7 nutrients, confidence, ≤ 3 clarifying questions with
// per-option adjustments) + server totals. The app saves meal_entries/meal_items after the user
// confirms, passing `ai_request_id`. Spec: docs/02-features/nutrition.md §4, D-014, D-022.
import { z } from 'zod';
import {
  AiProviderError,
  getAiProvider,
  MEAL_SLOTS,
  mealTotals,
} from '../_shared/ai/index.ts';
import { countRequestsToday, getUserAiContext, logAiRequest } from '../_shared/ai/usage.ts';
import { envInt } from '../_shared/env.ts';
import { HttpError, json, readJson, serve } from '../_shared/http.ts';
import { createAdminClient, requireUser } from '../_shared/supabase.ts';

const BUCKET = 'meal-photos';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

const BodySchema = z.object({
  photo_path: z.string().min(3).max(300).regex(/^[0-9a-f-]{36}\/[A-Za-z0-9._\-/]+$/, 'invalid photo_path')
    .refine((p) => !p.includes('..'), 'invalid photo_path'),
  meal_slot: z.enum(MEAL_SLOTS).optional(),
  hint: z.string().trim().max(200).optional(),
  reanalyze: z.boolean().optional().default(false),
});

function mimeFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'heic': return 'image/heic';
    case 'heif': return 'image/heif';
    default: return 'image/jpeg';
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

serve(async (req) => {
  const { user, client } = await requireUser(req);
  const body = await readJson(req, BodySchema);
  if (!body.photo_path.startsWith(`${user.id}/`)) {
    throw new HttpError(403, 'forbidden_path', 'photo_path must be inside your own folder');
  }

  const admin = createAdminClient();
  const ai = getAiProvider();
  const ctx = await getUserAiContext(admin, user.id);
  const kind = body.reanalyze ? 'reanalyze' : 'meal_image';
  const tier = body.reanalyze ? 'strong' : 'fast';
  const model = ai.modelFor(tier);

  // Daily photo quota: min(global limit, per-user setting). Re-analysis counts too.
  const limit = Math.min(envInt('AI_DAILY_PHOTO_LIMIT', 15), ctx.photoQuota);
  const used = await countRequestsToday(admin, user.id, ctx.timezone, ['meal_image', 'reanalyze']);
  if (used >= limit) {
    await logAiRequest(admin, { userId: user.id, kind, status: 'quota_exceeded', usage: { provider: ai.name, model } });
    throw new HttpError(429, 'quota_exceeded', 'Daily photo analysis limit reached', { used, limit });
  }

  // Download with the user's client: storage RLS guarantees ownership.
  const { data: blob, error: dlError } = await client.storage.from(BUCKET).download(body.photo_path);
  if (dlError || !blob) throw new HttpError(404, 'photo_not_found', 'Photo not found');
  if (blob.size > MAX_IMAGE_BYTES) throw new HttpError(413, 'photo_too_large', 'Compress the photo to ~1024 px first');
  const mimeType = ALLOWED_MIME.has(blob.type) ? blob.type : mimeFromPath(body.photo_path);
  if (!ALLOWED_MIME.has(mimeType)) throw new HttpError(415, 'unsupported_media_type', 'Unsupported image type');

  try {
    const result = await ai.analyzeMealImage({
      imageBase64: toBase64(new Uint8Array(await blob.arrayBuffer())),
      mimeType,
      locale: ctx.locale,
      mealSlot: body.meal_slot,
      hint: body.hint,
      tier,
    });
    const aiRequestId = await logAiRequest(admin, { userId: user.id, kind, status: 'ok', usage: result.usage });
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
        userId: user.id, kind, status: 'error', error: `${err.code}: ${err.message}`,
        usage: { provider: ai.name, model, ...err.usage },
      });
      throw new HttpError(err.code === 'config' ? 500 : 502, 'ai_failed', 'Meal analysis failed, please try again');
    }
    throw err;
  }
});
