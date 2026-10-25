import { auth } from "@/lib/auth";
import { ForbiddenError } from "@/lib/org";
import { demoBlockedMessage, isDemoEmail } from "@/lib/demo";

export class UnauthorizedError extends Error {
  constructor(message = "You must be signed in.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export type SessionUser = { id: string; email: string | null; isDemo: boolean };

/** Resolve the signed-in user id for an API route, or throw. */
export async function requireUserId(): Promise<string> {
  return (await requireSessionUser()).id;
}

/** Like requireUserId, plus whether this is the shared public demo account. */
export async function requireSessionUser(): Promise<SessionUser> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new UnauthorizedError();
  const email = session.user?.email ?? null;
  return { id, email, isDemo: isDemoEmail(email) };
}

/** Throws a friendly 403 when the demo account tries something that would spoil it for the next visitor. */
export function forbidInDemo(user: SessionUser, action: string) {
  if (user.isDemo) throw new ForbiddenError(demoBlockedMessage(action));
}
