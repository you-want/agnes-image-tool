// Only the administrator controls the upstream key and URL. Browser cookies
// must never redirect requests carrying the administrator's API key.
export interface AppConfig {
  apiKey: string;
  baseUrl: string;
}

export async function loadServerConfig(): Promise<AppConfig> {
  return {
    apiKey: process.env.AGNES_API_KEY?.trim() || "",
    baseUrl: (process.env.AGNES_BASE_URL?.trim() || "https://apihub.agnes-ai.com").replace(/\/+$/, ""),
  };
}

export function resolveApiKey(): string {
  return process.env.AGNES_API_KEY?.trim() || "";
}

export function resolveBaseUrl(): string {
  return process.env.AGNES_BASE_URL?.trim() || "https://apihub.agnes-ai.com";
}
