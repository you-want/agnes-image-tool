import { recordVideoTask } from "@/lib/auth/video-tasks";
import { takeQuota } from "@/lib/auth/quota";
import { requireAccess } from "@/lib/auth/access";
import { NextRequest } from "next/server";
import https from "node:https";
import http, { type IncomingMessage } from "node:http";
import { HttpsProxyAgent } from "https-proxy-agent";
import { loadServerConfig } from "@/lib/config";
import { checkRateLimit, readJsonLimited, IMAGE_BODY_LIMIT } from "@/lib/api-guard";

const MAX_PROMPT_LEN = 4000;
const IMAGE_URL_TIMEOUT_MS = 10_000;

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

function httpsPost(
  url: string,
  body: unknown,
  apiKey: string
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const agent = getProxyAgent();

    const req = https.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        agent: agent || undefined,
        timeout: 300_000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      }
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out."));
    });

    req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Validates that an external image/audio URL is accessible.
 * Respects proxy configuration. Skips validation for local HTTP URLs.
 */
async function validateMediaUrl(url: string): Promise<string | null> {
  // Skip validation for local HTTP URLs (uploads)
  if (url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1")) {
    return null;
  }

  const isHttps = url.startsWith("https://");
  const protocol = isHttps ? https : http;

  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const agent = isHttps ? getProxyAgent() : undefined;

    const req = protocol.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: "GET",
        agent: agent || undefined,
        timeout: IMAGE_URL_TIMEOUT_MS,
      },
      (res: IncomingMessage) => {
        res.on("data", () => {});
        res.on("end", () => {
          if (res.statusCode! < 200) {
            resolve(`URL returned HTTP ${res.statusCode}. Ensure it is publicly accessible.`);
            return;
          }
          const ct = res.headers["content-type"] || "";
          // Accept URLs that don't specify content-type but returned 200 (likely images)
          if (ct && !ct.startsWith("image/") && !ct.startsWith("audio/")) {
            resolve(`URL returned content type "${ct}", expected image or audio.`);
            return;
          }
          resolve(null);
        });
      }
    );

    req.on("error", (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      resolve(`Failed to access URL: ${msg}`);
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(`URL timed out after ${IMAGE_URL_TIMEOUT_MS / 1000}s.`);
    });
    req.end();
  });
}

export async function POST(request: NextRequest) {
  try {
    const limited = await checkRateLimit(request);
    if (limited) return limited;

    const access = await requireAccess(request);
    if (access.response) return access.response;

    const parsed = await readJsonLimited(request, IMAGE_BODY_LIMIT);
    if (parsed.error) return parsed.error;
    const {
      prompt,
      mode,
      seconds,
      aspect_ratio,
      first_frame,
      last_frame,
      images,
      audios,
      negative_prompt,
      seed,
    } = parsed.data as Record<string, unknown>;

    // --- validations ---
    if (typeof prompt !== "string" || !prompt.trim()) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (prompt.length > MAX_PROMPT_LEN) {
      return Response.json({ error: "Prompt is too long" }, { status: 400 });
    }
    if (!["text", "keyframe", "reference"].includes(mode as string)) {
      return Response.json({ error: "Invalid mode. Must be: text, keyframe, or reference" }, { status: 400 });
    }
    if (seconds !== undefined) {
      const s = Number(seconds);
      if (!Number.isInteger(s) || s < 4 || s > 12) {
        return Response.json({ error: "seconds must be an integer between 4 and 12 (API limit)" }, { status: 400 });
      }
    }
    if (aspect_ratio !== undefined && !["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"].includes(aspect_ratio as string)) {
      return Response.json({ error: "Invalid aspect_ratio. Supported values: 21:9, 16:9, 4:3, 1:1, 3:4, 9:16" }, { status: 400 });
    }

    // mode-specific media validation
    if (mode === "text") {
      if (first_frame || last_frame || images || audios) {
        return Response.json({ error: "text mode: do not provide first_frame, last_frame, images, or audios" }, { status: 400 });
      }
    } else if (mode === "keyframe") {
      if (images || audios) {
        return Response.json({ error: "keyframe mode: do not provide images or audios" }, { status: 400 });
      }
      if (!first_frame && !last_frame) {
        return Response.json({ error: "keyframe mode: at least one of first_frame or last_frame is required" }, { status: 400 });
      }
    } else if (mode === "reference") {
      if (first_frame || last_frame) {
        return Response.json({ error: "reference mode: do not provide first_frame or last_frame" }, { status: 400 });
      }
      const imgList = Array.isArray(images) ? images : [];
      const audList = Array.isArray(audios) ? audios : [];
      if (imgList.length === 0 && audList.length === 0) {
        return Response.json({ error: "reference mode: at least one of images or audios is required" }, { status: 400 });
      }
      if (imgList.length > 5) {
        return Response.json({ error: "images length must not exceed 5" }, { status: 400 });
      }
      if (audList.length > 3) {
        return Response.json({ error: "audios length must not exceed 3" }, { status: 400 });
      }
    }

    // validate media URLs
    const validateUrls = async (urls: string[], label: string) => {
      for (const url of urls) {
        const trimmed = url.trim();
        if (!trimmed) continue;
        // Skip base64 data URIs - they don't need validation
        if (trimmed.startsWith("data:image/") || trimmed.startsWith("data:audio/")) continue;
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) continue;
        const err = await validateMediaUrl(trimmed);
        if (err) return err;
      }
      return null;
    };

    const urlErrors: string[] = [];
    if (first_frame) {
      const err = await validateMediaUrl(first_frame as string);
      if (err) urlErrors.push(`first_frame: ${err}`);
    }
    if (last_frame) {
      const err = await validateMediaUrl(last_frame as string);
      if (err) urlErrors.push(`last_frame: ${err}`);
    }
    if (Array.isArray(images)) {
      for (const img of images as string[]) {
        const trimmed = img.trim();
        // Skip base64 data URIs - they don't need URL validation
        if (trimmed.startsWith("data:image/") || trimmed.startsWith("data:audio/")) continue;
        const err = await validateMediaUrl(trimmed);
        if (err) urlErrors.push(`images: ${err}`);
      }
    }
    if (Array.isArray(audios)) {
      for (const aud of audios as string[]) {
        const trimmed = aud.trim();
        // Skip base64 data URIs
        if (trimmed.startsWith("data:audio/") || trimmed.startsWith("data:video/")) continue;
        const err = await validateMediaUrl(trimmed);
        if (err) urlErrors.push(`audios: ${err}`);
      }
    }
    if (urlErrors.length > 0) {
      return Response.json({ error: urlErrors.join(" | ") }, { status: 400 });
    }

    const config = await loadServerConfig();
    const apiKey = config.apiKey;
    if (!apiKey) {
      return Response.json({ error: "API key is not configured" }, { status: 401 });
    }

    const baseUrl = (config.baseUrl || "https://apihub.agnes-ai.com").replace(/\/+$/, "");
    const url = `${baseUrl}/v1/videos`;

    const payload: Record<string, unknown> = {
      model: "agnes-video-2.5-flash",
      prompt,
      mode,
      size: "720P",
    };

    if (seconds !== undefined) payload.seconds = String(seconds);
    if (aspect_ratio !== undefined) payload.aspect_ratio = aspect_ratio;
    if (negative_prompt !== undefined && typeof negative_prompt === "string") payload.negative_prompt = negative_prompt;
    if (seed !== undefined) payload.seed = seed;

    if (mode === "keyframe") {
      if (first_frame) payload.first_frame = first_frame;
      if (last_frame) payload.last_frame = last_frame;
    } else if (mode === "reference") {
      if (Array.isArray(images) && images.length > 0) payload.images = images;
      if (Array.isArray(audios) && audios.length > 0) payload.audios = audios;
    }

    const quotaError = await takeQuota(access.userId, "video");
    if (quotaError) return quotaError;

    const res = await httpsPost(url, payload, apiKey);

    if (res.status < 200 || res.status >= 300) {
      let detail = `HTTP ${res.status}`;
      try {
        const errData = JSON.parse(res.body);
        detail = errData.detail || errData.error?.message || JSON.stringify(errData.error) || res.body || detail;
      } catch {
        detail = res.body || detail;
      }
      console.log(`[Flash API] Error ${res.status}: ${detail}`);
      return Response.json({ error: `API Error ${res.status}: ${detail}` }, { status: res.status });
    }

    const result = JSON.parse(res.body);
    await recordVideoTask(access.userId, result);
    return Response.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
