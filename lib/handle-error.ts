import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { UnauthorizedError } from "@/lib/session";
import { ForbiddenError } from "@/lib/org";
import { AiNotConfiguredError } from "@/lib/gemini";

/** Central API error → NextResponse mapper. Log unknowns, never leak internals. */
export function handleApiError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof AiNotConfiguredError) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ error: "That value is already in use." }, { status: 409 });
    }
  }
  console.error(error);
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Something went wrong" },
    { status: 500 },
  );
}
