import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";
import { rateLimit } from "@/lib/rate-limit";

const handler = toNextJsHandler(auth);

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "local";
}

export function GET(request: NextRequest) {
  return handler.GET(request);
}

export function POST(request: NextRequest) {
  if (!rateLimit(`auth:${clientKey(request)}`, 30, 60_000)) {
    return NextResponse.json(
      { message: "Too many attempts. Wait a minute and try again." },
      { status: 429 },
    );
  }
  return handler.POST(request);
}
