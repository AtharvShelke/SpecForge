import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

function extensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    default:
      return "bin";
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only image uploads are allowed." },
        { status: 400 },
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 4MB." },
        { status: 400 },
      );
    }

    const extension = extensionFromMimeType(file.type);
    const safeName = `${Date.now()}-${randomUUID()}.${extension}`;
    const uploadsDirectory = path.join(process.cwd(), "public", "uploads");
    const destination = path.join(uploadsDirectory, safeName);

    await mkdir(uploadsDirectory, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(destination, buffer);

    return NextResponse.json({ url: `/uploads/${safeName}` });
  } catch (error) {
    console.error("Local upload failed:", error);
    return NextResponse.json(
      { error: "Unable to store uploaded file." },
      { status: 500 },
    );
  }
}
