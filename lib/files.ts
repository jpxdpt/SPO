import { isAllowedUpload } from "@/lib/validation";

/**
 * Abstração de ficheiros: disco local em dev, Vercel Blob em prod.
 * Bucket sempre privado; URLs assinados de curta duração (a ligar quando
 * a hospedagem estiver tratada). Bloqueia executáveis por MIME + tamanho.
 */
export type StoredFile = { storagePath: string; filename: string; mimeType: string; size: number };

export async function storeUpload(opts: {
  filename: string;
  mimeType: string;
  size: number;
  bytes: Uint8Array;
}): Promise<StoredFile> {
  if (!isAllowedUpload(opts.mimeType, opts.size)) {
    throw new Error("Tipo de ficheiro não permitido ou tamanho superior a 10 MB.");
  }
  const provider = process.env.FILES_PROVIDER ?? "local";
  if (provider === "local") {
    const { writeFile, mkdir } = await import("node:fs/promises");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), ".uploads");
    await mkdir(dir, { recursive: true });
    const safe = `${Date.now()}-${opts.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await writeFile(path.join(dir, safe), Buffer.from(opts.bytes));
    return { storagePath: `local:${safe}`, filename: opts.filename, mimeType: opts.mimeType, size: opts.size };
  }
  // Prod (Vercel Blob): ligar quando BLOB_READ_WRITE_TOKEN existir.
  const { put } = await import("@vercel/blob").catch(() => {
    throw new Error("BLOB_READ_WRITE_TOKEN em falta: configure a hospedagem primeiro.");
  });
  const blob = await put(`spo/${Date.now()}-${opts.filename}`, Buffer.from(opts.bytes), {
    access: "private" as never,
    contentType: opts.mimeType,
  } as never);
  return { storagePath: (blob as { url: string }).url, filename: opts.filename, mimeType: opts.mimeType, size: opts.size };
}
