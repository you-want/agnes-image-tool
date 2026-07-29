import { NextRequest } from "next/server";
import { agnesFetch, errorResponse, successResponse, classifyError } from "@/lib/agnes-api";
import { checkRateLimit, readJsonLimited, clampInt, TEXT_BODY_LIMIT } from "@/lib/api-guard";

const LOCALE_LANG_NAMES: Record<string, string> = {
  "zh-CN": "Chinese",
  en: "English",
};

const MAX_MESSAGES = 50;
const VALID_ROLES = new Set(["system", "user", "assistant"]);

interface ChatMessage {
  role: string;
  content: string;
}

function isValidMessage(m: unknown): m is ChatMessage {
  return (
    typeof m === "object" &&
    m !== null &&
    VALID_ROLES.has((m as ChatMessage).role) &&
    typeof (m as ChatMessage).content === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const limited = await checkRateLimit(request);
    if (limited) return limited;

    const parsed = await readJsonLimited(request, TEXT_BODY_LIMIT);
    if (parsed.error) return parsed.error;
    const { messages, temperature = 0.7, max_tokens = 2048, locale } = parsed.data;

    if (!Array.isArray(messages) || messages.length === 0) {
      return errorResponse("messages array is required");
    }
    if (messages.length > MAX_MESSAGES) return errorResponse("Too many messages");
    if (!messages.every(isValidMessage)) return errorResponse("Invalid message format");

    const safeTemperature = Math.min(Math.max(Number(temperature) || 0.7, 0), 2);
    const safeMaxTokens = clampInt(max_tokens, 1, 4096) ?? 2048;

    let finalMessages: ChatMessage[] = [...(messages as ChatMessage[])];

    if (typeof locale === "string" && LOCALE_LANG_NAMES[locale]) {
      const langName = LOCALE_LANG_NAMES[locale];
      const languageInstruction = `\n\nIMPORTANT: Respond exclusively in ${langName} (${locale}). Do not output explanations in any other language.`;

      finalMessages = finalMessages.map((msg) =>
        msg.role === "system"
          ? { ...msg, content: msg.content + languageInstruction }
          : msg
      );
    }

    const result = await agnesFetch("/v1/chat/completions", {
      model: "agnes-2.0-flash",
      messages: finalMessages,
      temperature: safeTemperature,
      max_tokens: safeMaxTokens,
    });

    return successResponse(result);
  } catch (error) {
    const { message, status } = classifyError(error);
    return errorResponse(message, status);
  }
}
