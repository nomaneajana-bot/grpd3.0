import type { NextRequest } from "next/server";

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response>;

type RouteModule = Partial<Record<"GET" | "POST" | "PATCH" | "PUT" | "DELETE", RouteHandler>>;

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
  staticRoute("health", () => import("../../app/api/v1/health/route")),
  staticRoute("clubs", () => import("../../app/api/v1/clubs/route")),
  staticRoute("clubs/resolve", () => import("../../app/api/v1/clubs/resolve/route")),
  staticRoute("clubs/join", () => import("../../app/api/v1/clubs/join/route")),
  staticRoute(
    "clubs/join-by-code",
    () => import("../../app/api/v1/clubs/join-by-code/route"),
  ),
  staticRoute("sessions", () => import("../../app/api/v1/sessions/route")),
  staticRoute("me/memberships", () => import("../../app/api/v1/me/memberships/route")),
  staticRoute("me/sessions", () => import("../../app/api/v1/me/sessions/route")),
  staticRoute("me/prs", () => import("../../app/api/v1/me/prs/route")),
  staticRoute("me/inbox", () => import("../../app/api/v1/me/inbox/route")),
  staticRoute(
    "auth/pin/login",
    () => import("../../app/api/v1/auth/pin/login/route"),
  ),
]);

function matchDynamicRoute(segments: string[]): RouteMatch | null {
  const [a, b, c, d, e, f] = segments;
  // Only the declared route shapes are valid; never ignore extra segments.
  if (segments.length > 3 && !(segments.length === 5 && a === "clubs" && c === "members" && e === "dues")) return null;

  if (
    a === "clubs" &&
    b &&
    c === "members" &&
    d &&
    e === "dues" &&
    !f
  ) {
    return {
      load: asRouteModule(
        () => import("../../app/api/v1/clubs/[id]/members/[userId]/dues/route"),
      ),
      params: { id: b, userId: d },
    };
  }

  if (a === "clubs" && b && !c) {
    return {
      load: asRouteModule(() => import("../../app/api/v1/clubs/[id]/route")),
      params: { id: b },
    };
  }
  if (a === "clubs" && b && c === "request") {
    return {
      load: asRouteModule(() => import("../../app/api/v1/clubs/[id]/request/route")),
      params: { id: b },
    };
  }
  if (a === "clubs" && b && c === "approve") {
    return {
      load: asRouteModule(() => import("../../app/api/v1/clubs/[id]/approve/route")),
      params: { id: b },
    };
  }
  if (a === "clubs" && b && c === "invite") {
    return {
      load: asRouteModule(() => import("../../app/api/v1/clubs/[id]/invite/route")),
      params: { id: b },
    };
  }
  if (a === "clubs" && b && c === "roster") {
    return {
      load: asRouteModule(() => import("../../app/api/v1/clubs/[id]/roster/route")),
      params: { id: b },
    };
  }
  if (a === "clubs" && b && c === "sessions") {
    return {
      load: asRouteModule(() => import("../../app/api/v1/clubs/[id]/sessions/route")),
      params: { id: b },
    };
  }
  if (a === "clubs" && b && c === "leave") {
    return {
      load: asRouteModule(() => import("../../app/api/v1/clubs/[id]/leave/route")),
      params: { id: b },
    };
  }
  if (a === "clubs" && b && c === "member-group") {
    return {
      load: asRouteModule(
        () => import("../../app/api/v1/clubs/[id]/member-group/route"),
      ),
      params: { id: b },
    };
  }
  if (a === "clubs" && b && c === "summary") {
    return {
      load: asRouteModule(() => import("../../app/api/v1/clubs/[id]/summary/route")),
      params: { id: b },
    };
  }

  if (a === "sessions" && b && !c) {
    return {
      load: asRouteModule(() => import("../../app/api/v1/sessions/[id]/route")),
      params: { id: b },
    };
  }
  if (a === "sessions" && b && c === "join") {
    return {
      load: asRouteModule(() => import("../../app/api/v1/sessions/[id]/join/route")),
      params: { id: b },
    };
  }
  if (a === "sessions" && b && c === "leave") {
    return {
      load: asRouteModule(() => import("../../app/api/v1/sessions/[id]/leave/route")),
      params: { id: b },
    };
  }
  if (a === "sessions" && b && c === "request") {
    return {
      load: asRouteModule(() => import("../../app/api/v1/sessions/[id]/request/route")),
      params: { id: b },
    };
  }
  if (a === "sessions" && b && c === "assign") {
    return {
      load: asRouteModule(() => import("../../app/api/v1/sessions/[id]/assign/route")),
      params: { id: b },
    };
  }
  if (a === "sessions" && b && c === "participants") {
    return {
      load: asRouteModule(() => import("../../app/api/v1/sessions/[id]/participants/route")),
      params: { id: b },
    };
  }
  if (a === "sessions" && b && c === "complete") {
    return {
      load: asRouteModule(() => import("../../app/api/v1/sessions/[id]/complete/route")),
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
      { status: 404 },
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
      { ok: false, error: { message: "Method not allowed", code: "METHOD_NOT_ALLOWED" } },
      { status: 405 },
    );
  }

  if (!["GET", "HEAD"].includes(method) && req.headers.get("content-type")?.includes("application/json")) {
    const body = await req.clone().text();
    if (body.trim()) {
      try { JSON.parse(body); }
      catch {
        return Response.json({ ok: false, error: { message: "Invalid JSON", code: "VALIDATION_ERROR" } }, { status: 400 });
      }
    }
  }

  return handler(req, { params: Promise.resolve(match.params) });
}
