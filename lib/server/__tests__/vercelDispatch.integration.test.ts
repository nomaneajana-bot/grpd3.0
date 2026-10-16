/**
 * Batch 6 — local Vercel entry + dispatcher + Bearer auth against disposable PG.
 * Synthetic AUTH_JWT_SECRET only (never production secrets).
 */

import http from "http";
import {
  AttendanceStatus,
  MembershipRole,
  MembershipStatus,
  PrismaClient,
  SessionVisibility,
} from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const DATABASE_URL = process.env.DATABASE_URL;
const SKIP =
  process.env.SKIP_PG_INTEGRATION === "1" ||
  !DATABASE_URL ||
  /mock|memory/i.test(DATABASE_URL);

const TEST_JWT_SECRET = "batch6-local-test-jwt-secret-not-for-prod";

// Must set before importing modules that read AUTH_JWT_SECRET / prisma.
process.env.AUTH_JWT_SECRET = TEST_JWT_SECRET;
delete process.env.EXPO_PUBLIC_DEMO_MODE;
delete process.env.EXPO_PUBLIC_USE_MOCK_API;

jest.mock("@/lib/server/prisma", () => {
  const { PrismaClient: PC } = require("@prisma/client");
  const client = new PC({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  return { prisma: client };
});

import { prisma } from "@/lib/server/prisma";
import { signAppAccessToken } from "@/lib/server/app-jwt";
import { dispatchApiRequest } from "@/lib/server/vercel-dispatch";
import vercelHandler from "../../../api/v1/[...path]";
import { createApiClient } from "@/lib/api/client";
import { assertConnectedApiUrl, resolveApiTransport } from "@/lib/api/mode";
import { ApiError } from "@/lib/api/errors";
import { NextRequest } from "next/server";
import * as apiMode from "@/lib/api/mode";

const describePg = SKIP ? describe.skip : describe;

async function signExpiredToken(userId: string): Promise<string> {
  const { createHmac } = await import("crypto");
  const secret = TEST_JWT_SECRET;
  const b64url = (input: Buffer | string) => {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
    return buf
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  };
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      sub: userId,
      iss: "grpd",
      iat: now - 3600,
      exp: now - 60,
    }),
  );
  const data = `${header}.${payload}`;
  const sig = createHmac("sha256", secret).update(data).digest();
  return `${data}.${b64url(sig)}`;
}

function assertJsonResponse(res: Response, status: number) {
  expect(res.status).toBe(status);
  const ct = res.headers.get("content-type") ?? "";
  expect(ct).toMatch(/application\/json/i);
}

async function dispatch(
  method: string,
  apiPath: string,
  opts?: { token?: string | null; body?: unknown },
): Promise<Response> {
  const headers = new Headers({ "content-type": "application/json" });
  if (opts?.token) headers.set("authorization", `Bearer ${opts.token}`);
  const req = new NextRequest(`https://test.local/api/v1/${apiPath}`, {
    method,
    headers,
    body:
      method === "GET" || method === "HEAD"
        ? undefined
        : JSON.stringify(opts?.body ?? {}),
  });
  const segments = apiPath.split("/").filter(Boolean);
  return dispatchApiRequest(req, segments);
}

type MockResState = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

function invokeVercelEntry(
  method: string,
  urlPath: string,
  opts?: { token?: string | null; body?: unknown },
): Promise<MockResState> {
  const state: MockResState = { statusCode: 200, headers: {}, body: "" };
  const req = {
    method,
    url: urlPath,
    headers: {
      host: "test.local",
      "content-type": "application/json",
      ...(opts?.token
        ? { authorization: `Bearer ${opts.token}` }
        : {}),
    },
    body: opts?.body ?? {},
  } as unknown as VercelRequest;

  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    setHeader(key: string, value: string) {
      state.headers[key.toLowerCase()] = String(value);
      return res;
    },
    send(payload: unknown) {
      state.body =
        typeof payload === "string" ? payload : JSON.stringify(payload);
      return res;
    },
    json(payload: unknown) {
      state.headers["content-type"] = "application/json";
      state.body = JSON.stringify(payload);
      return res;
    },
  } as unknown as VercelResponse;

  return vercelHandler(req, res).then(() => state);
}

describePg("Batch6 Vercel dispatcher + Bearer (PostgreSQL)", () => {
  const suffix = `b6_${Date.now().toString(36)}`;
  let clubSeq = 0;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.club.deleteMany({
      where: { slug: { startsWith: `club-${suffix}` } },
    });
  });

  async function seedClub(opts?: { withSecondAdmin?: boolean }) {
    clubSeq += 1;
    const tag = `${suffix}_${clubSeq}`;
    const ownerId = `owner_${tag}`;
    const memberId = `member_${tag}`;
    const pendingId = `pending_${tag}`;
    const outsiderId = `outsider_${tag}`;
    const admin2Id = `admin2_${tag}`;
    const club = await prisma.club.create({
      data: {
        name: `Club ${tag}`,
        slug: `club-${tag}`,
        city: "Casablanca",
        visibility: "members",
        createdById: ownerId,
        memberships: {
          create: [
            {
              userId: ownerId,
              role: MembershipRole.admin,
              status: MembershipStatus.approved,
            },
            {
              userId: memberId,
              role: MembershipRole.member,
              status: MembershipStatus.approved,
            },
            {
              userId: pendingId,
              role: MembershipRole.member,
              status: MembershipStatus.pending,
            },
            ...(opts?.withSecondAdmin
              ? [
                  {
                    userId: admin2Id,
                    role: MembershipRole.admin,
                    status: MembershipStatus.approved,
                  },
                ]
              : []),
          ],
        },
      },
    });
    const membersSession = await prisma.session.create({
      data: {
        title: `Privée ${tag}`,
        spot: "Parc",
        dateLabel: "SAMEDI",
        typeLabel: "Marche",
        volume: "",
        targetPace: "",
        estimatedDistanceKm: 0,
        recommendedGroupId: "",
        clubId: club.id,
        visibility: SessionVisibility.members,
        hostUserId: ownerId,
        attendance: {
          create: {
            userId: memberId,
            status: AttendanceStatus.joined,
            groupId: "B",
          },
        },
      },
    });
    return {
      club,
      ownerId,
      memberId,
      pendingId,
      outsiderId,
      admin2Id,
      membersSession,
    };
  }

  it("health returns JSON ready", async () => {
    const res = await dispatch("GET", "health");
    assertJsonResponse(res, 200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.database).toBe("ready");
    expect(JSON.stringify(body)).not.toMatch(/postgresql:\/\//i);
  });

  it("unknown API path returns JSON 404 (never SPA HTML)", async () => {
    const res = await dispatch("GET", "this/path/does-not-exist");
    assertJsonResponse(res, 404);
    const text = await res.text();
    expect(text).not.toMatch(/<!DOCTYPE html>/i);
    expect(text).toMatch(/NOT_FOUND/);

    const entry = await invokeVercelEntry(
      "GET",
      "/api/v1/this/path/does-not-exist",
    );
    expect(entry.statusCode).toBe(404);
    expect(entry.headers["content-type"] ?? "").toMatch(/json/i);
    expect(entry.body).not.toMatch(/<!DOCTYPE html>/i);
    expect(entry.body).toMatch(/NOT_FOUND/);
  });

  it("missing / invalid / expired Bearer → 401 via entry + dispatch; no DB mutation", async () => {
    const { club, memberId } = await seedClub();
    const before = await prisma.clubMembership.count({
      where: { clubId: club.id },
    });
    const expired = await signExpiredToken(memberId);

    for (const token of [null, "not-a-jwt", expired] as const) {
      const leave = await dispatch("POST", `clubs/${club.id}/leave`, {
        token,
      });
      assertJsonResponse(leave, 401);
      const leaveBody = await leave.json();
      expect(leaveBody.error.code).toBe("UNAUTHORIZED");

      const cancel = await dispatch(
        "POST",
        `clubs/${club.id}/cancel-request`,
        { token },
      );
      assertJsonResponse(cancel, 401);

      const entry = await invokeVercelEntry(
        "POST",
        `/api/v1/clubs/${club.id}/leave`,
        { token, body: {} },
      );
      expect(entry.statusCode).toBe(401);
      expect(entry.body).toMatch(/UNAUTHORIZED/);
    }

    expect(
      await prisma.clubMembership.count({ where: { clubId: club.id } }),
    ).toBe(before);
  });

  it("valid organizer/participant Bearer: leave + cancel + actor isolation", async () => {
    const { club, ownerId, memberId, pendingId, outsiderId, membersSession } =
      await seedClub();
    const memberTok = await signAppAccessToken(memberId);
    const pendingTok = await signAppAccessToken(pendingId);
    const outsiderTok = await signAppAccessToken(outsiderId);
    const ownerTok = await signAppAccessToken(ownerId);

    // Outsider leave with body claiming memberId — no mutation of member
    const iso = await dispatch("POST", `clubs/${club.id}/leave`, {
      token: outsiderTok,
      body: { userId: memberId },
    });
    assertJsonResponse(iso, 200);
    const isoBody = await iso.json();
    expect(isoBody.data.alreadyAbsent).toBe(true);
    expect(
      (
        await prisma.clubMembership.findUnique({
          where: { userId_clubId: { userId: memberId, clubId: club.id } },
        })
      )?.status,
    ).toBe(MembershipStatus.approved);

    // Participant leave: membership gone; members-only attendance left
    const leave = await dispatch("POST", `clubs/${club.id}/leave`, {
      token: memberTok,
    });
    assertJsonResponse(leave, 200);
    expect(
      await prisma.clubMembership.findUnique({
        where: { userId_clubId: { userId: memberId, clubId: club.id } },
      }),
    ).toBeNull();
    const att = await prisma.sessionAttendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId: membersSession.id,
          userId: memberId,
        },
      },
    });
    expect(att?.status).toBe(AttendanceStatus.left);

    // Pending cancel via entry
    const cancelEntry = await invokeVercelEntry(
      "POST",
      `/api/v1/clubs/${club.id}/cancel-request`,
      { token: pendingTok, body: {} },
    );
    expect(cancelEntry.statusCode).toBe(200);
    expect(cancelEntry.headers["content-type"] ?? "").toMatch(/json/i);
    expect(
      await prisma.clubMembership.findUnique({
        where: { userId_clubId: { userId: pendingId, clubId: club.id } },
      }),
    ).toBeNull();

    // Sole admin last-admin
    const last = await dispatch("POST", `clubs/${club.id}/leave`, {
      token: ownerTok,
    });
    assertJsonResponse(last, 409);
    const lastBody = await last.json();
    expect(lastBody.error.code).toBe("LAST_ADMIN");
    expect(
      (
        await prisma.clubMembership.findUnique({
          where: { userId_clubId: { userId: ownerId, clubId: club.id } },
        })
      )?.status,
    ).toBe(MembershipStatus.approved);
  });

  it("connected ApiClient (DEMO/mock false + explicit URL) leave/cancel; missing URL fails", async () => {
    const { club, memberId, pendingId } = await seedClub();
    const memberTok = await signAppAccessToken(memberId);
    const pendingTok = await signAppAccessToken(pendingId);

    const server = http.createServer(async (req, res) => {
      try {
        const host = req.headers.host ?? "127.0.0.1";
        const url = new URL(req.url ?? "/", `http://${host}`);
        if (!url.pathname.startsWith("/api/v1/")) {
          res.writeHead(404, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: { code: "NOT_FOUND" } }));
          return;
        }
        const segments = url.pathname.slice("/api/v1/".length).split("/");
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const raw = Buffer.concat(chunks).toString("utf8");
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers)) {
          if (v) headers.set(k, Array.isArray(v) ? v.join(",") : v);
        }
        const nextReq = new NextRequest(url, {
          method: req.method,
          headers,
          body: ["GET", "HEAD"].includes(req.method ?? "")
            ? undefined
            : raw || undefined,
        });
        const response = await dispatchApiRequest(nextReq, segments);
        const text = await response.text();
        res.writeHead(response.status, {
          "content-type":
            response.headers.get("content-type") ?? "application/json",
        });
        res.end(text);
      } catch (e) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: { message: String(e) } }));
      }
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("no addr");
    const baseUrl = `http://127.0.0.1:${addr.port}`;

    // Connected mode must not silently mock when URL missing.
    expect(() => assertConnectedApiUrl("")).toThrow(ApiError);
    try {
      assertConnectedApiUrl("");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).code).toBe("MISSING_API_URL");
    }

    // Force connected transport for this exercise (DEMO_MODE is a module const).
    const transportSpy = jest
      .spyOn(apiMode, "resolveApiTransport")
      .mockImplementation(async (baseUrl?: string) => {
        const url = (baseUrl ?? "").trim();
        return { mode: "connected" as const, useMock: false, apiUrl: url };
      });

    try {
      const missing = createApiClient({
        baseUrl: "",
        getAccessToken: async () => memberTok,
      });
      await expect(
        missing.request(`/api/v1/clubs/${club.id}/leave`, { method: "POST" }),
      ).rejects.toMatchObject({ code: "MISSING_API_URL" });

      const client = createApiClient({
        baseUrl,
        getAccessToken: async () => memberTok,
      });
      await client.request(`/api/v1/clubs/${club.id}/leave`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      expect(
        await prisma.clubMembership.findUnique({
          where: { userId_clubId: { userId: memberId, clubId: club.id } },
        }),
      ).toBeNull();

      const pendingClient = createApiClient({
        baseUrl,
        getAccessToken: async () => pendingTok,
      });
      await pendingClient.request(`/api/v1/clubs/${club.id}/cancel-request`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      expect(
        await prisma.clubMembership.findUnique({
          where: { userId_clubId: { userId: pendingId, clubId: club.id } },
        }),
      ).toBeNull();

      // Sanity: resolver reports connected when URL present
      const resolved = await resolveApiTransport(baseUrl);
      expect(resolved.useMock).toBe(false);
      expect(resolved.apiUrl).toBe(baseUrl);
    } finally {
      transportSpy.mockRestore();
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it("vercel.json routes /api/v1 to function destination (not SPA catch-all)", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cfg = require("../../../vercel.json") as {
      rewrites: Array<{ source: string; destination: string }>;
    };
    const api = cfg.rewrites.find((r) => r.source.includes("api/v1"));
    const spa = cfg.rewrites.find((r) => r.destination === "/index.html");
    expect(api?.destination).toBe("/api/v1/[...path]");
    expect(spa?.source).toMatch(/\(\?!api\/\)/);
  });
});
