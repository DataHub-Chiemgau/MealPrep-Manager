import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import Tesseract from "tesseract.js";
import { writeFile, unlink } from "fs/promises";
import { join, basename } from "path";
import { tmpdir } from "os";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/tiff",
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("image") as File;
  if (!file) return NextResponse.json({ error: "Kein Bild hochgeladen" }, { status: 400 });

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Ungültiger Dateityp. Nur Bilder (JPEG, PNG, WEBP, GIF, BMP, TIFF) erlaubt." },
      { status: 415 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Datei zu groß. Maximale Dateigröße: 10 MB." },
      { status: 413 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  // Use basename() first to prevent any path-traversal component in the filename
  const safeName = basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");
  const tmpPath = join(tmpdir(), `receipt_${Date.now()}_${safeName}`);
  await writeFile(tmpPath, buffer);

  try {
    const result = await Tesseract.recognize(tmpPath, "deu", {});
    const text = result.data.text;

    // Parse lines: try to extract item + price
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const items: { name: string; price: number | null }[] = lines
      .map((line) => {
        // Match pattern like "Artikelname 1.23" or "Artikelname 1,23"
        const match = line.match(/^(.+?)\s+(\d+[.,]\d{2})\s*[A-Z]?$/);
        if (match) {
          return {
            name: match[1].trim(),
            price: parseFloat(match[2].replace(",", ".")),
          };
        }
        return { name: line, price: null };
      })
      .filter((i) => i.name.length > 2);

    return NextResponse.json({ rawText: text, items });
  } catch (err) {
    return NextResponse.json({ error: "OCR fehlgeschlagen", details: String(err) }, { status: 500 });
  } finally {
    // Always clean up temp file
    unlink(tmpPath).catch(() => undefined);
  }
}
