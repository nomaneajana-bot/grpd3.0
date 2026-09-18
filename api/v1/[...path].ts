import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NextRequest } from "next/server";

import { dispatchApiRequest } from "../../lib/server/vercel-dispatch";

export const config = {
  api: {
    bodyParser: true,
  },
};

function pathSegments(query: VercelRequest["query"]): string[] {
  const raw = query.path;
  if (Array.isArray(raw)) return raw.filter(Boolean) as string[];
  if (typeof raw === "string" && raw) return [raw];
  return [];
}

function toNextRequest(req: VercelRequest, segments: string[]): NextRequest {
  const host = req.headers.host ?? "localhost";
  const pathname = `/api/v1/${segments.join("/")}`;
  const url = new URL(pathname + (req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""), `https://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  let body: string | undefined;
  if (req.method && !["GET", "HEAD"].includes(req.method)) {
    if (typeof req.body === "string") {
      body = req.body;
    } else if (req.body !== undefined && req.body !== null) {
      body = JSON.stringify(req.body);
    }
  }

  return new NextRequest(url, {
    method: req.method,
    headers,
    body,
  });
}

async function sendResponse(res: VercelResponse, response: Response): Promise<void> {
  const text = await response.text();
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.send(text);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    const segments = pathSegments(req.query);
    const nextReq = toNextRequest(req, segments);
    const response = await dispatchApiRequest(nextReq, segments);
    await sendResponse(res, response);
  } catch (error) {
    console.error("API handler error:", error);
    res.status(500).json({
      ok: false,
      error: { message: "Internal server error", code: "INTERNAL_ERROR" },
    });
  }
}
