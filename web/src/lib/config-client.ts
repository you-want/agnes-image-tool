// Read-only readiness of administrator-managed server configuration.
// API keys remain in server environment variables and never reach the browser.

export interface ConfigStatus {
  hasApiKey: boolean;
  baseUrl: string;
}

const DEFAULT_BASE_URL = "https://apihub.agnes-ai.com";

export async function fetchConfigStatus(): Promise<ConfigStatus> {
  try {
    const res = await fetch("/api/config/save", { method: "GET" });
    if (!res.ok) throw new Error("status request failed");
    const data = await res.json();
    return {
      hasApiKey: Boolean(data.hasApiKey),
      baseUrl: typeof data.baseUrl === "string" ? data.baseUrl : DEFAULT_BASE_URL,
    };
  } catch {
    return { hasApiKey: false, baseUrl: DEFAULT_BASE_URL };
  }
}
