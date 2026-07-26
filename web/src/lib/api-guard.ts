import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/agnes-api";

// Re-exported so route handlers can import guards and validators from one place.
export {
  isValidImageSize,
  isValidImageRatio,
  isValidVideoRatio,
  isValidVideoMode,
  isValidFrameRate,
  clampInt,
} from "@/lib/validation";

/**
 * Per-IP rate limiting for the public API proxy routes.
 *
 * Two backends, selected automatically:
 *   - Upstash Redis (shared, correct across instances) when
 *     UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set.
 *   - In-memory fallback (best-effort, per server instance) otherwise.
 *
 * The Redis path uses a fixed window keyed by `ip:windowIndex` with INCR +
 * EXPIRE, issued as a single pipelined REST call — no extra dependencies.
 */

const WINDOW_MS = 60_000;
const WINDOW_SECONDS = WINDOW_MS / 1000;
const DEFAULT_MAX_PER_WINDOW = 20;

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const rateLimitBackend = REDIS_URL && REDIS_TOKEN ? "redis" : "memory";

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: `Too many requests. Try again in ${retryAfterSeconds}s.` },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

// ---------------- In-memory backend ----------------

const hits = new Map<string, { count: number; resetAt: number }>();

function checkMemory(ip: string, max: number): NextResponse | null {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    // Opportunistic cleanup so the map can't grow unbounded.
    if (hits.size > 5000) {
      for (const [key, value] of hits) {
        if (now > value.resetAt) hits.delete(key);
      }
    }
    return null;
  }

  if (entry.count >= max) {
    return tooManyRequests(Math.ceil((entry.resetAt - now) / 1000));
  }

  entry.count += 1;
  return null;
}

// ---------------- Upstash Redis backend ----------------

async function checkRedis(ip: string, max: number): Promise<NextResponse | null> {
  const now = Date.now();
  const windowIndex = Math.floor(now / WINDOW_MS);
  const key = `ratelimit:${ip}:${windowIndex}`;

  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(WINDOW_SECONDS)],
    ]),
    signal: AbortSignal.timeout(2000),
  });

  if (!res.ok) throw new Error(`Upstash responded ${res.status}`);

  // Pipeline returns [{ result: <count> }, { result: 1 }]
  const body = await res.json();
  const count = Number(body?.[0]?.result);
  if (!Number.isFinite(count)) throw new Error("Unexpected Upstash response");

  if (count > max) {
    const msIntoWindow = now - windowIndex * WINDOW_MS;
    return tooManyRequests(Math.ceil((WINDOW_MS - msIntoWindow) / 1000));
  }

  return null;
}

// ---------------- Public entry point ----------------

/** Returns a 429 response if the caller exceeded the window, else null. */
export async function checkRateLimit(
  request: NextRequest,
  max = DEFAULT_MAX_PER_WINDOW
): Promise<NextResponse | null> {
  const ip = clientIp(request);

  if (rateLimitBackend === "redis") {
    try {
      return await checkRedis(ip, max);
    } catch (err) {
      // Never let a rate-limiter outage take down the API — fall back to the
      // in-memory limiter so requests are still bounded per instance.
      console.error("Rate limit (redis) failed, falling back to memory:", err);
      return checkMemory(ip, max);
    }
  }

  return checkMemory(ip, max);
}

// ---------------- Body size limits ----------------

/** ~256 KB — enough for prompts/messages, no base64 images. */
export const TEXT_BODY_LIMIT = 256 * 1024;
/** ~20 MB — accommodates a 10 MB image encoded as base64 (~13.3 MB) + fields. */
export const IMAGE_BODY_LIMIT = 20 * 1024 * 1024;

type ParsedBody =
  | { data: Record<string, unknown>; error?: undefined }
  | { data?: undefined; error: NextResponse };

/** Reads and JSON-parses the body while enforcing a byte cap. */
export async function readJsonLimited(
  request: NextRequest,
  maxBytes: number
): Promise<ParsedBody> {
  const declaredLen = request.headers.get("content-length");
  if (declaredLen && Number(declaredLen) > maxBytes) {
    return { error: errorResponse("Request body too large.", 413) };
  }

  const text = await request.text();
  // Byte length (not char length) — multibyte prompts must not slip past.
  if (new Blob([text]).size > maxBytes) {
    return { error: errorResponse("Request body too large.", 413) };
  }

  try {
    const parsed = JSON.parse(text || "{}");
    if (typeof parsed !== "object" || parsed === null) {
      return { error: errorResponse("Invalid request body.") };
    }
    return { data: parsed as Record<string, unknown> };
  } catch {
    return { error: errorResponse("Invalid JSON body.") };
  }
}
