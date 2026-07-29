import { NextResponse } from "next/server";
import https from "node:https";
import { HttpsProxyAgent } from "https-proxy-agent";
import { loadServerConfig } from "@/lib/config";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 300_000;

let _proxyAgent: HttpsProxyAgent<string> | null | undefined = undefined;

function getProxyAgent(): HttpsProxyAgent<string> | null {
  if (_proxyAgent !== undefined) return _proxyAgent;
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.AGNES_PROXY;
  if (!proxyUrl) {
    _proxyAgent = null;
    return null;
  }
  _proxyAgent = new HttpsProxyAgent(proxyUrl);
  return _proxyAgent;
}

function httpsRequest(
  url: string,
  options: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    timeoutMs?: number;
  }
): Promise<{ status: number; body: string; headers: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const agent = getProxyAgent();
    const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;

    const req = https.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method,
      headers: options.headers,
      agent: agent || undefined,
      timeout: timeoutMs,
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(res.headers)) {
          if (typeof value === "string") headers[key] = value;
          else if (Array.isArray(value)) headers[key] = value.join(", ");
        }
        resolve({ status: res.statusCode ?? 0, body, headers });
      });
    });

    req.on("error", (e) => reject(e));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out. The API server may be slow or unreachable."));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function requestWithRetry(
  url: string,
  options: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    timeoutMs?: number;
  },
  retries = MAX_RETRIES
): Promise<{ status: number; body: string }> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await httpsRequest(url, options);
      if (response.status === 503 || response.status >= 500) {
        if (i === retries - 1) return response;
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (i + 1)));
        continue;
      }
      return response;
    } catch (err) {
      lastError = err;
      if (i === retries - 1) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("timed out") || msg.includes("Request timed out")) {
          throw new Error("Request timed out. The API server may be slow or unreachable.");
        }
        throw new Error(`Cannot connect to API server (${new URL(url).host}). It may be offline or blocked by your network.`);
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (i + 1)));
    }
  }
  throw new Error("Unexpected retry loop");
}

export function createAuthHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export async function agnesFetch(path: string, body: unknown, apiKey?: string, baseUrl?: string) {
  const config = await loadServerConfig();
  const resolvedKey = apiKey?.trim() || config.apiKey || "";
  const resolvedBase = baseUrl?.replace(/\/+$/, "") || config.baseUrl || "https://apihub.agnes-ai.com";

  if (!resolvedKey) {
    throw new Error("API key is not configured. Please set it in Settings or via AGNES_API_KEY env variable.");
  }

  const url = `${resolvedBase}${path}`;
  const headers = createAuthHeaders(resolvedKey);

  const response = await requestWithRetry(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    timeoutMs: REQUEST_TIMEOUT_MS,
  });

  if (response.status < 200 || response.status >= 300) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const errData = JSON.parse(response.body);
      errorDetail = errData.error?.message || JSON.stringify(errData.error) || errorDetail;
    } catch {
      errorDetail = response.body || errorDetail;
    }
    throw new Error(`API Error ${response.status}: ${errorDetail}`);
  }

  return JSON.parse(response.body);
}

export async function agnesGet(path: string, apiKey?: string, baseUrl?: string) {
  const config = await loadServerConfig();
  const resolvedKey = apiKey?.trim() || config.apiKey || "";
  const resolvedBase = baseUrl?.replace(/\/+$/, "") || config.baseUrl || "https://apihub.agnes-ai.com";

  if (!resolvedKey) {
    throw new Error("API key is not configured. Please set it in Settings or via AGNES_API_KEY env variable.");
  }

  const url = `${resolvedBase}${path}`;
  const headers = createAuthHeaders(resolvedKey);

  const response = await requestWithRetry(url, {
    method: "GET",
    headers,
    timeoutMs: 30_000,
  });

  if (response.status < 200 || response.status >= 300) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const errData = JSON.parse(response.body);
      errorDetail = errData.error?.message || JSON.stringify(errData.error) || errorDetail;
    } catch {
      errorDetail = response.body || errorDetail;
    }
    throw new Error(`API Error ${response.status}: ${errorDetail}`);
  }

  return JSON.parse(response.body);
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse(data: unknown) {
  return NextResponse.json({ data }, { status: 200 });
}

export function classifyError(error: unknown): { message: string; status: number } {
  const message = error instanceof Error ? error.message : "Unknown error";

  if (message.includes("API key is not configured")) {
    return { message, status: 401 };
  }
  if (message.includes("Cannot connect to API server") || message.includes("blocked by your network")) {
    return { message, status: 502 };
  }
  if (message.includes("timed out")) {
    return { message, status: 504 };
  }
  const apiErrorMatch = message.match(/^API Error (\d+):/);
  if (apiErrorMatch) {
    const upstreamStatus = Number(apiErrorMatch[1]);
    return { message, status: upstreamStatus >= 400 && upstreamStatus < 600 ? upstreamStatus : 502 };
  }
  return { message, status: 400 };
}
