import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { resetDemoData } from "@/lib/demo-seed";

export const maxDuration = 60;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * Daily demo reset (Vercel Cron, see vercel.json). Vercel sends
 * `Authorization: Bearer $CRON_SECRET` automatically. Rebuilds the demo org,
 * which removes every meeting and stored recording visitors uploaded, and
 * clears the daily upload counter.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await resetDemoData(prisma, { password: process.env.DEMO_PASSWORD ?? "" });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Demo reset failed", error);
    return NextResponse.json({ error: "Demo reset failed." }, { status: 500 });
  }
}
