// Static imports let the deployment compiler resolve every route dependency.
// Only routes that exist on this branch are registered (Batch6 selective port).

import * as routeModule0 from "../../app/api/v1/health/route";
import * as routeModuleAuthPinLogin from "../../app/api/v1/auth/pin/login/route";
import * as routeModuleAuthEmailRegister from "../../app/api/v1/auth/email/register/route";
import * as routeModuleAuthEmailLogin from "../../app/api/v1/auth/email/login/route";
import * as routeModuleAuthLogout from "../../app/api/v1/auth/logout/route";
import * as routeModule1 from "../../app/api/v1/clubs/route";
import * as routeModuleMemberGroup from "../../app/api/v1/clubs/[id]/member-group/route";
import * as routeModule2 from "../../app/api/v1/clubs/resolve/route";
import * as routeModule3 from "../../app/api/v1/clubs/join/route";
import * as routeModule4 from "../../app/api/v1/clubs/join-by-code/route";
import * as routeModule5 from "../../app/api/v1/sessions/route";
import * as routeModule6 from "../../app/api/v1/me/memberships/route";
import * as routeModule7 from "../../app/api/v1/me/sessions/route";
import * as routeModule8 from "../../app/api/v1/me/prs/route";
import * as routeModule9 from "../../app/api/v1/clubs/[id]/route";
import * as routeModule10 from "../../app/api/v1/clubs/[id]/request/route";
import * as routeModule11 from "../../app/api/v1/clubs/[id]/approve/route";
import * as routeModule12 from "../../app/api/v1/clubs/[id]/invite/route";
import * as routeModule13 from "../../app/api/v1/clubs/[id]/roster/route";
import * as routeModule14 from "../../app/api/v1/clubs/[id]/sessions/route";
import * as routeModule15 from "../../app/api/v1/clubs/[id]/leave/route";
import * as routeModule16 from "../../app/api/v1/clubs/[id]/cancel-request/route";
import * as routeModule17 from "../../app/api/v1/sessions/[id]/route";
import * as routeModule18 from "../../app/api/v1/sessions/[id]/join/route";
import * as routeModule19 from "../../app/api/v1/sessions/[id]/leave/route";
import * as routeModule20 from "../../app/api/v1/sessions/[id]/request/route";
import * as routeModule21 from "../../app/api/v1/sessions/[id]/assign/route";
import * as routeModule22 from "../../app/api/v1/sessions/[id]/participants/route";
import type { NextRequest } from "next/server";

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response>;

type RouteModule = Partial<
  Record<"GET" | "POST" | "PATCH" | "PUT" | "DELETE", RouteHandler>
>;

type RouteMatch = {
  load: () => Promise<RouteModule>;
  params: Record<string, string>;
};

function asRouteModule(
  loader: () => Promise<Record<string, unknown>>,
): () => Promise<RouteModule> {
  return () => loader() as Promise<RouteModule>;
}

function staticRoute(
  path: string,
  loader: () => Promise<Record<string, unknown>>,
): [string, RouteMatch] {
  return [path, { load: asRouteModule(loader), params: {} }];
}

const STATIC_ROUTES: Record<string, RouteMatch> = Object.fromEntries([
  staticRoute("health", async () => routeModule0),
  staticRoute("auth/pin/login", async () => routeModuleAuthPinLogin),
  staticRoute("auth/email/register", async () => routeModuleAuthEmailRegister),
  staticRoute("auth/email/login", async () => routeModuleAuthEmailLogin),
  staticRoute("auth/logout", async () => routeModuleAuthLogout),
  staticRoute("clubs", async () => routeModule1),
  staticRoute("clubs/resolve", async () => routeModule2),
  staticRoute("clubs/join", async () => routeModule3),
  staticRoute("clubs/join-by-code", async () => routeModule4),
  staticRoute("sessions", async () => routeModule5),
  staticRoute("me/memberships", async () => routeModule6),
  staticRoute("me/sessions", async () => routeModule7),
  staticRoute("me/prs", async () => routeModule8),
]);

function matchDynamicRoute(segments: string[]): RouteMatch | null {
  const [a, b, c] = segments;
  if (segments.length > 3) return null;

  if (a === "clubs" && b && !c) {
    return {
      load: asRouteModule(async () => routeModule9),
      params: { id: b },
    };
  }
  if (a === "clubs" && b && c === "request") {
    return {
      load: asRouteModule(async () => routeModule10),
      params: { id: b },
    };
  }
  if (a === "clubs" && b && c === "approve") {
    return {
      load: asRouteModule(async () => routeModule11),
      params: { id: b },
    };
  }
  if (a === "clubs" && b && c === "invite") {
    return {
      load: asRouteModule(async () => routeModule12),
      params: { id: b },
    };
  }
  if (a === "clubs" && b && c === "roster") {
    return {
      load: asRouteModule(async () => routeModule13),
      params: { id: b },
    };
  }
  if (a === "clubs" && b && c === "sessions") {
    return {
      load: asRouteModule(async () => routeModule14),
      params: { id: b },
    };
  }
  if (a === "clubs" && b && c === "leave") {
    return {
      load: asRouteModule(async () => routeModule15),
      params: { id: b },
    };
  }
  if (a === "clubs" && b && c === "cancel-request") {
    return {
      load: asRouteModule(async () => routeModule16),
      params: { id: b },
    };
  }
  if (a === "clubs" && b && c === "member-group") {
    return {
      load: asRouteModule(async () => routeModuleMemberGroup),
      params: { id: b },
    };
  }

  if (a === "sessions" && b && !c) {
    return {
      load: asRouteModule(async () => routeModule17),
      params: { id: b },
    };
  }
  if (a === "sessions" && b && c === "join") {
    return {
      load: asRouteModule(async () => routeModule18),
      params: { id: b },
    };
  }
  if (a === "sessions" && b && c === "leave") {
    return {
      load: asRouteModule(async () => routeModule19),
      params: { id: b },
    };
  }
  if (a === "sessions" && b && c === "request") {
    return {
      load: asRouteModule(async () => routeModule20),
      params: { id: b },
    };
  }
  if (a === "sessions" && b && c === "assign") {
    return {
      load: asRouteModule(async () => routeModule21),
      params: { id: b },
    };
  }
  if (a === "sessions" && b && c === "participants") {
    return {
      load: asRouteModule(async () => routeModule22),
      params: { id: b },
    };
  }

  return null;
}

function resolveRoute(segments: string[]): RouteMatch | null {
  const key = segments.join("/");
  if (STATIC_ROUTES[key]) {
    return STATIC_ROUTES[key];
  }
  return matchDynamicRoute(segments);
}

export async function dispatchApiRequest(
  req: NextRequest,
  pathSegments: string[],
): Promise<Response> {
  const match = resolveRoute(pathSegments);
  if (!match) {
    return Response.json(
      { ok: false, error: { message: "Not found", code: "NOT_FOUND" } },
      {
        status: 404,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const mod = await match.load();
  const method = req.method.toUpperCase();
  const handler =
    method === "GET"
      ? mod.GET
      : method === "POST"
        ? mod.POST
        : method === "PATCH"
          ? mod.PATCH
          : method === "PUT"
            ? mod.PUT
            : method === "DELETE"
              ? mod.DELETE
              : undefined;

  if (!handler) {
    return Response.json(
      {
        ok: false,
        error: { message: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
      },
      {
        status: 405,
        headers: { "content-type": "application/json" },
      },
    );
  }

  if (
    !["GET", "HEAD"].includes(method) &&
    req.headers.get("content-type")?.includes("application/json")
  ) {
    const body = await req.clone().text();
    if (body.trim()) {
      try {
        JSON.parse(body);
      } catch {
        return Response.json(
          {
            ok: false,
            error: { message: "Invalid JSON", code: "VALIDATION_ERROR" },
          },
          { status: 400, headers: { "content-type": "application/json" } },
        );
      }
    }
  }

  return handler(req, { params: Promise.resolve(match.params) });
}
