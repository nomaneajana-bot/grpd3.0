import { prisma } from "../../../../lib/server/prisma";

/** Minimal readiness probe: never return connection details or secret values. */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, data: { service: "grpd-api", database: "ready" } }, { headers });
  } catch {
    return Response.json({ ok: false, error: { code: "NOT_READY", message: "Service unavailable" } }, { status: 503, headers });
  }
}
