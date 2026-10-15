import { requireAccess } from "@/lib/auth/access";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/api-guard";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

// Store uploads in the public directory so they're served as static files
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  audio: ["audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg", "audio/flac"],
};

export async function POST(request: NextRequest) {
  try {
    const limited = await checkRateLimit(request);
    if (limited) return limited;

    const access = await requireAccess(request);
    if (access.response) return access.response;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file || !file.size) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedImageTypes = ALLOWED_TYPES.image;
    const allowedAudioTypes = ALLOWED_TYPES.audio;
    const isImage = allowedImageTypes.includes(file.type);
    const isAudio = allowedAudioTypes.includes(file.type);

    if (!isImage && !isAudio) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: images (jpg, png, webp, gif) and audio (mp3, wav, m4a, ogg, flac)` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 });
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const filename = `${randomUUID()}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Return the public URL
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url, filename, size: file.size, type: file.type });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
