import { z } from 'zod';
import { corsHeaders, handleCors } from './cors.ts';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message?: string,
    readonly details?: unknown,
  ) {
    super(message ?? code);
  }
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return json({ error: { code: err.code, message: err.message, details: err.details ?? null } }, err.status);
  }
  if (err instanceof z.ZodError) {
    return json({ error: { code: 'invalid_request', message: 'Invalid request body', details: err.issues } }, 400);
  }
  console.error('unhandled error', err);
  return json({ error: { code: 'internal_error', message: 'Internal error' } }, 500);
}

/** Parses and validates a JSON body. */
export async function readJson<S extends z.ZodTypeAny>(req: Request, schema: S): Promise<z.output<S>> {
  let raw: unknown;
  try {
    const text = await req.text();
    raw = text.trim() === '' ? {} : JSON.parse(text);
  } catch {
    throw new HttpError(400, 'invalid_json', 'Body must be JSON');
  }
  return schema.parse(raw);
}

/** Deno.serve wrapper: CORS preflight, POST only, uniform error responses. */
export function serve(handler: (req: Request) => Promise<Response>): void {
  Deno.serve(async (req: Request) => {
    const preflight = handleCors(req);
    if (preflight) return preflight;
    if (req.method !== 'POST') return json({ error: { code: 'method_not_allowed', message: 'Use POST' } }, 405);
    try {
      return await handler(req);
    } catch (err) {
      return errorResponse(err);
    }
  });
}
