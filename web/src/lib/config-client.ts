// Client-side config access. The API key is NEVER stored in the browser
// (no localStorage, no JS-readable cookie); it lives only in an HttpOnly cookie
// set by /api/config/save. The client can only learn whether a key is
// configured, never read it back.

export interface ConfigStatus {
  hasApiKey: boolean;
  baseUrl: string;
}

export interface SaveConfigInput {
  apiKey?: string;
  baseUrl?: string;
  clear?: boolean;
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

export async function saveConfig(input: SaveConfigInput): Promise<boolean> {
  try {
    const res = await fetch("/api/config/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.ok;
  } catch {
    return false;
  }
}
