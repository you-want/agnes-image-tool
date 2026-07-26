const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

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
  const url = input.startsWith("http") ? input : `${API_BASE_URL}${input}`;
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
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper for POST requests (like image generation)
export async function apiPost<T>(
  endpoint: string,
  data: unknown
): Promise<T> {
  const response = await fetchWithOffline(endpoint, {
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
