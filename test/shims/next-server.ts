/**
 * Minimal next/server shim for Jest.
 * Workspace does not depend on the `next` package; route handlers under test are
 * the real exports from app/api route.ts files. Auth contract matches Auth.js v5:
 * req.auth?.user?.id (see lib/server/auth-helpers.ts).
 */
export class NextRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init);
  }
}

export class NextResponse extends Response {
  static json(data: unknown, init: ResponseInit = {}): NextResponse {
    const headers = new Headers(init.headers || {});
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    return new NextResponse(JSON.stringify(data), {
      ...init,
      headers,
    });
  }
}
