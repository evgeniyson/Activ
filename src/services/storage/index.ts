import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { getDataMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/services/supabase/server";

export const STORAGE_BUCKET = "asset-files";

export interface StoredFile {
  /** Path inside the bucket / uploads dir: `<userId>/<assetId|misc>/<file>` */
  storagePath: string;
  /** Private URL served through /api/files (ownership-checked) */
  url: string;
}

export interface FileStorage {
  put(storagePath: string, data: Buffer, contentType: string): Promise<StoredFile>;
  get(storagePath: string): Promise<{ data: Buffer; contentType: string } | null>;
  remove(storagePath: string): Promise<void>;
}

export function fileUrl(storagePath: string): string {
  return `/api/files/${storagePath.split("/").map(encodeURIComponent).join("/")}`;
}

function contentTypeFor(p: string): string {
  const ext = path.extname(p).toLowerCase();
  return (
    { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".pdf": "application/pdf", ".heic": "image/heic" }[ext] ??
    "application/octet-stream"
  );
}

class LocalFileStorage implements FileStorage {
  private root = path.join(process.env.ACTIV_DATA_DIR ?? path.join(process.cwd(), ".data"), "uploads");
  private resolve(storagePath: string) {
    const abs = path.resolve(this.root, storagePath);
    if (!abs.startsWith(this.root)) throw new Error("Invalid storage path");
    return abs;
  }
  async put(storagePath: string, data: Buffer) {
    const abs = this.resolve(storagePath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, data);
    return { storagePath, url: fileUrl(storagePath) };
  }
  async get(storagePath: string) {
    try {
      const data = await fs.readFile(this.resolve(storagePath));
      return { data, contentType: contentTypeFor(storagePath) };
    } catch {
      return null;
    }
  }
  async remove(storagePath: string) {
    await fs.rm(this.resolve(storagePath), { force: true });
  }
}

class SupabaseFileStorage implements FileStorage {
  async put(storagePath: string, data: Buffer, contentType: string) {
    const sb = await createSupabaseServerClient();
    const { error } = await sb.storage.from(STORAGE_BUCKET).upload(storagePath, data, { contentType, upsert: true });
    if (error) throw new Error(`[storage] upload failed: ${error.message}`);
    return { storagePath, url: fileUrl(storagePath) };
  }
  async get(storagePath: string) {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb.storage.from(STORAGE_BUCKET).download(storagePath);
    if (error || !data) return null;
    return { data: Buffer.from(await data.arrayBuffer()), contentType: data.type || contentTypeFor(storagePath) };
  }
  async remove(storagePath: string) {
    const sb = await createSupabaseServerClient();
    await sb.storage.from(STORAGE_BUCKET).remove([storagePath]);
  }
}

let local: LocalFileStorage | null = null;
export function getFileStorage(): FileStorage {
  if (getDataMode() === "supabase") return new SupabaseFileStorage();
  if (!local) local = new LocalFileStorage();
  return local;
}
