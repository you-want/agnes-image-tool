import { NextRequest, NextResponse } from "next/server";
import { agnesFetch, errorResponse, successResponse } from "@/lib/agnes-api";

const LOCALE_LANG_NAMES: Record<string, string> = {
  "zh-CN": "Chinese",
  en: "English",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, temperature = 0.7, max_tokens = 2048, locale } = body;

    if (!messages || !Array.isArray(messages)) return errorResponse("messages array is required");

    let finalMessages = [...messages];

    if (locale && LOCALE_LANG_NAMES[locale]) {
      const langName = LOCALE_LANG_NAMES[locale];
      const languageInstruction = `\n\nIMPORTANT: Respond exclusively in ${langName} (${locale}). Do not output explanations in any other language.`;

      finalMessages = finalMessages.map((msg: any) => {
        if (msg.role === "system") {
          return { ...msg, content: msg.content + languageInstruction };
        }
        return msg;
      });
    }

    const result = await agnesFetch(
      "/v1/chat/completions",
      {
        model: "agnes-2.0-flash",
        messages: finalMessages,
        temperature,
        max_tokens,
      },
    );

    return successResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message);
  }
}
