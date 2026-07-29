const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

/**
 * API helper endpoints are relative to API_BASE_URL (for example,
 * `/image/generate`, not `/api/image/generate`). Keep this resolver tolerant of
 * an accidental duplicated `/api` prefix so callers cannot produce `/api/api`.
 */
export function resolveApiUrl(input: string, baseUrl = API_BASE_URL): string {
  if (/^https?:\/\//i.test(input)) return input;

  const base = baseUrl.replace(/\/+$/, "");
  let path = input.startsWith("/") ? input : `/${input}`;

  if (base.endsWith("/api") && (path === "/api" || path.startsWith("/api/"))) {
    path = path.slice(4) || "/";
  }

  return `${base}${path}`;
}

export interface OfflineRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: string;
  cache?: RequestCache;
  timeout?: number;
}

/**
 * fetch wrapper with a timeout. API responses are intentionally NOT served from
 * cache — generation requests are unique per body and cannot be safely replayed
 * offline, so we surface a clear network error instead of a stale result.
 */
export async function fetchWithOffline(
  input: string,
  options: OfflineRequestOptions = {}
): Promise<Response> {
  const url = resolveApiUrl(input);
  const {
    method = "GET",
    headers = {},
    body,
    cache = "default",
    timeout = 30000,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body,
      cache,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      const seconds = Math.ceil(timeout / 1000);
      const unit = seconds === 1 ? "second" : "seconds";
      throw new Error(`Request timed out after ${seconds} ${unit}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper for POST requests (like image generation)
export async function apiPost<T>(
  endpoint: string,
  data: unknown,
  options: Omit<OfflineRequestOptions, "method" | "body"> = {}
): Promise<T> {
  const response = await fetchWithOffline(endpoint, {
    ...options,
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Request failed");
  }

  return response.json();
}

// Helper for GET requests
export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetchWithOffline(endpoint);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Request failed");
  }

  return response.json();
}
