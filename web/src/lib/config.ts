import { cookies } from "next/headers";

const CONFIG_KEY = "agnes_creator_config";

export interface AppConfig {
  apiKey: string;
  baseUrl: string;
}

const DEFAULTS: AppConfig = {
  apiKey: process.env.AGNES_API_KEY || "",
  baseUrl: process.env.AGNES_BASE_URL || "https://apihub.agnes-ai.com",
};

function parseConfig(raw: string | undefined): AppConfig {
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      apiKey: parsed.apiKey || DEFAULTS.apiKey,
      baseUrl: parsed.baseUrl || DEFAULTS.baseUrl,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

// ---- Server-side: read from cookie ----

export async function loadServerConfig(): Promise<AppConfig> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(CONFIG_KEY)?.value;
    return parseConfig(raw);
  } catch {
    return { ...DEFAULTS };
  }
}

// ---- Client-side: read/write localStorage ----

export function getClientConfig(): AppConfig {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return parseConfig(raw ?? undefined);
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveClientConfig(config: AppConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

// ---- API route helpers ----

export function resolveApiKey(requestBodyKey?: string): string {
  if (requestBodyKey?.trim()) return requestBodyKey.trim();
  return DEFAULTS.apiKey || "";
}

export function resolveBaseUrl(): string {
  return DEFAULTS.baseUrl;
}
