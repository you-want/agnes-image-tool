import { NextRequest, NextResponse } from "next/server";

const CONFIG_KEY = "agnes_creator_config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey = "", baseUrl = "https://apihub.agnes-ai.com" } = body;

    const response = NextResponse.json({ success: true });
    response.cookies.set(CONFIG_KEY, JSON.stringify({ apiKey, baseUrl }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
