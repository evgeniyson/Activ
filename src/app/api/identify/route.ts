import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { track } from "@/lib/analytics";
import { getCurrentUser } from "@/services/auth/session";
import { IdentificationError, getIdentificationProvider, identifyByBarcode } from "@/services/identification";
import { getFileStorage } from "@/services/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 15 * 1024 * 1024;

/**
 * POST multipart/form-data { image: File, hint?: string } → identification + stored image
 * POST application/json { barcode: string } → catalog lookup
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { barcode?: string };
    const code = (body.barcode ?? "").replace(/\D/g, "");
    if (code.length < 8) return NextResponse.json({ error: "Введите корректный штрих-код (EAN/UPC)." }, { status: 400 });
    const result = identifyByBarcode(code);
    if (!result) return NextResponse.json({ error: "Этого штрих-кода пока нет в нашем каталоге. Добавьте предмет вручную." }, { status: 404 });
    return NextResponse.json({ identification: result, image: null });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Некорректная загрузка." }, { status: 400 });
  }
  const file = form.get("image");
  const hint = typeof form.get("hint") === "string" ? String(form.get("hint")).slice(0, 120) : undefined;
  if (!(file instanceof File)) return NextResponse.json({ error: "Изображение не получено." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Слишком большое изображение (максимум 15 МБ)." }, { status: 413 });

  track("asset_scan_started", { size: file.size });

  let jpeg: Buffer;
  let width = 0;
  let height = 0;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const out = await sharp(input, { failOn: "none" }).rotate().resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toBuffer({ resolveWithObject: true });
    jpeg = out.data;
    width = out.info.width;
    height = out.info.height;
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать изображение. Попробуйте фото в JPEG или PNG." }, { status: 415 });
  }
  if (width < 200 || height < 200) return NextResponse.json({ error: "Фото слишком маленькое для анализа. Подойдите ближе и попробуйте снова." }, { status: 422 });

  const storagePath = `${user.id}/scans/${randomUUID()}.jpg`;
  const stored = await getFileStorage().put(storagePath, jpeg, "image/jpeg");

  try {
    const result = await getIdentificationProvider().identify({ image: jpeg, mimeType: "image/jpeg", hint });
    track("asset_identified", { provider: result.provider, recognized: result.recognized, confidence: result.confidence });
    return NextResponse.json({ identification: result, image: { ...stored, width, height } });
  } catch (err) {
    const e = err instanceof IdentificationError ? err : new IdentificationError("Не удалось распознать предмет.", "provider_error");
    const status = e.code === "unavailable" ? 503 : e.code === "timeout" ? 504 : 502;
    return NextResponse.json({ error: e.message, code: e.code, image: { ...stored, width, height } }, { status });
  }
}
