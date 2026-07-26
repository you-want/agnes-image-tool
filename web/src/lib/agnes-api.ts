import { NextResponse } from "next/server";
import { loadServerConfig } from "@/lib/config";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 503 || response.status >= 500) {
        if (i === retries - 1) return response;
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (i + 1)));
        continue;
      }
      return response;
    } catch {
      if (i === retries - 1) throw new Error("Network request failed");
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (i + 1)));
    }
  }
  throw new Error("Unexpected retry loop");
}

export function createAuthHeaders(apiKey: string) {
  return {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export async function agnesFetch(path: string, body: unknown, apiKey?: string, baseUrl?: string) {
  const config = await loadServerConfig();
  const resolvedKey = apiKey?.trim() || config.apiKey || "";
  const resolvedBase = baseUrl?.replace(/\/+$/, "") || config.baseUrl || "https://apihub.agnes-ai.com";
  const url = `${resolvedBase}${path}`;
  const headers = createAuthHeaders(resolvedKey);

  const response = await fetchWithRetry(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(300_000),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errData = await response.json();
      errorDetail = errData.error?.message || JSON.stringify(errData.error) || response.statusText;
    } catch {}
    throw new Error(`API Error ${response.status}: ${errorDetail}`);
  }

  return response.json();
}

export async function agnesGet(path: string, apiKey?: string, baseUrl?: string) {
  const config = await loadServerConfig();
  const resolvedKey = apiKey?.trim() || config.apiKey || "";
  const resolvedBase = baseUrl?.replace(/\/+$/, "") || config.baseUrl || "https://apihub.agnes-ai.com";
  const url = `${resolvedBase}${path}`;
  const headers = createAuthHeaders(resolvedKey);

  const response = await fetchWithRetry(url, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errData = await response.json();
      errorDetail = errData.error?.message || JSON.stringify(errData.error) || response.statusText;
    } catch {}
    throw new Error(`API Error ${response.status}: ${errorDetail}`);
  }

  return response.json();
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse(data: unknown) {
  return NextResponse.json({ data }, { status: 200 });
}
