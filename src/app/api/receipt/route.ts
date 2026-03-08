import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import Tesseract from "tesseract.js";
import { writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("image") as File;
  if (!file) return NextResponse.json({ error: "Kein Bild hochgeladen" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const tmpPath = join(tmpdir(), `receipt_${Date.now()}_${file.name}`);
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
  }
}
