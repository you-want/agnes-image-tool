const CONFIG_KEY = "agnes_creator_config";

export interface AppConfig {
  apiKey: string;
  baseUrl: string;
}

const DEFAULTS: AppConfig = {
  apiKey: "",
  baseUrl: "https://apihub.agnes-ai.com",
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
