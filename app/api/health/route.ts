export async function GET() {
  return Response.json({ ok: true, app: "spo-gestao", time: new Date().toISOString() });
}
