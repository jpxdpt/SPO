/** Diagnóstico seguro: só indica PRESENÇA de configuração, nunca valores. */
export async function GET() {
  return Response.json({
    ok: true,
    app: "spo-gestao",
    time: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV ?? null,
      database: Boolean(process.env.DATABASE_URL),
      authSecret: Boolean((process.env.AUTH_SECRET ?? "").trim()),
      authUrl: process.env.AUTH_URL ?? null,
      filesProvider: process.env.FILES_PROVIDER ?? "local",
      blobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      encryptionKey: Boolean(process.env.APP_ENCRYPTION_KEY),
    },
  });
}
