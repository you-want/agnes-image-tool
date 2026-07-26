import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkRateLimit, readJsonLimited, TEXT_BODY_LIMIT } from "@/lib/api-guard";

const CONFIG_KEY = "agnes_creator_config";
const DEFAULT_BASE_URL = "https://apihub.agnes-ai.com";

interface StoredConfig {
  apiKey: string;
  baseUrl: string;
}

async function readCookieConfig(): Promise<StoredConfig> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CONFIG_KEY)?.value;
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      baseUrl: typeof parsed.baseUrl === "string" ? parsed.baseUrl : "",
    };
  } catch {
    return { apiKey: "", baseUrl: "" };
  }
}

// Report whether a key is configured, WITHOUT ever returning the key itself.
export async function GET() {
  const cfg = await readCookieConfig();
  return NextResponse.json({
    hasApiKey: Boolean(cfg.apiKey || process.env.AGNES_API_KEY),
    baseUrl: cfg.baseUrl || process.env.AGNES_BASE_URL || DEFAULT_BASE_URL,
  });
}

export async function POST(request: NextRequest) {
  try {
    const limited = await checkRateLimit(request);
    if (limited) return limited;

    const parsed = await readJsonLimited(request, TEXT_BODY_LIMIT);
    if (parsed.error) return parsed.error;
    const { apiKey, baseUrl, clear } = parsed.data as {
      apiKey?: unknown;
      baseUrl?: unknown;
      clear?: unknown;
    };

    const existing = await readCookieConfig();

    // A blank apiKey preserves the existing one (the client sends a masked,
    // empty field when the user doesn't change it); `clear: true` wipes it.
    const finalApiKey = clear
      ? ""
      : typeof apiKey === "string" && apiKey.trim()
        ? apiKey.trim()
        : existing.apiKey;
    const finalBaseUrl =
      typeof baseUrl === "string" && baseUrl.trim()
        ? baseUrl.trim()
        : existing.baseUrl || DEFAULT_BASE_URL;

    const response = NextResponse.json({ success: true });
    response.cookies.set(
      CONFIG_KEY,
      JSON.stringify({ apiKey: finalApiKey, baseUrl: finalBaseUrl }),
      {
        httpOnly: true, // not readable by JS — protects the key from XSS exfiltration
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      }
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
